import { zValidator } from "../lib/z-param-validator";
import * as Effect from "effect/Effect";
import type { EvlogVariables } from "evlog/hono";
import type { Context, Hono } from "hono";
import * as z from "zod";
import { DbLive } from "../db";
import { createHonoModule } from "../lib/hono-module";
import {
	bulkDeleteUsers,
	createUser,
	deleteUserById,
	getUserById,
	getUsers,
} from "./service";
import { createUserSchema, bulkDeleteUsersSchema } from "./schema";

export const usersModule: Effect.Effect<Hono<EvlogVariables>> = Effect.gen(
	function* () {
		const app = yield* createHonoModule();

		yield* app.get("/", async (ctx: Context) => {
			const log = ctx.get("log");
			log.set({ route: "/users" });

			const users = await Effect.runPromise(
				getUsers().pipe(
					Effect.provide(DbLive),
					Effect.map((value) => ({ ok: true as const, value })),
					Effect.catchTags({
						UserValidationError: (error) => {
							log.error(`User response validation failed: ${error.message}`);
							return Effect.succeed({
								ok: false as const,
								status: 500 as const,
								error: "Invalid user data in database",
							});
						},
						UserDatabaseError: (error) => {
							log.error(`Database error while listing users: ${error.message}`);
							return Effect.succeed({
								ok: false as const,
								status: 500 as const,
								error: "Database error",
							});
						},
					}),
				),
			);

			if (!users.ok) {
				return ctx.json({ error: users.error }, users.status);
			}

			return ctx.json(users.value);
		});

		yield* app.get(
			"/:id",
			zValidator("param", z.object({ id: z.uuid() })),
			async (ctx) => {
				const log = ctx.get("log");
				log.set({ route: "/users/:id" });

				const { id } = ctx.req.valid("param");

				const user = await Effect.runPromise(
					getUserById(id).pipe(
						Effect.provide(DbLive),
						Effect.map((value) => ({ ok: true as const, value })),
						Effect.catchTags({
							UserNotFoundError: () => {
								log.error(`User with id ${id} not found`);
								return Effect.succeed({
									ok: false as const,
									status: 404 as const,
									error: "User not found",
								});
							},
							UserValidationError: (error) => {
								log.error(
									`User response validation failed: ${error.message}`,
								);
								return Effect.succeed({
									ok: false as const,
									status: 500 as const,
									error: "Invalid user data in database",
								});
							},
							UserDatabaseError: (error) => {
								log.error(
									`Database error while fetching user: ${error.message}`,
								);
								return Effect.succeed({
									ok: false as const,
									status: 500 as const,
									error: "Database error",
								});
							},
						}),
					),
				);

				if (!user.ok) {
					return ctx.json({ error: user.error }, user.status);
				}

				return ctx.json(user.value);
			},
		);

		yield* app.post("/", zValidator("json", createUserSchema), async (ctx) => {
			const log = ctx.get("log");
			log.set({ route: "/users", method: "POST" });

			const body = ctx.req.valid("json");

			const createdUser = await Effect.runPromise(
				createUser(body).pipe(
					Effect.provide(DbLive),
					Effect.map((value) => ({ ok: true as const, value })),
					Effect.catchTags({
						UserAlreadyExistsError: () =>
							Effect.succeed({
								ok: false as const,
								status: 409 as const,
								error: "User already exists",
							}),
						UserValidationError: (error) =>
							Effect.succeed({
								ok: false as const,
								status: 400 as const,
								error: error.message,
							}),
						UserDatabaseError: (error) =>
							Effect.succeed({
								ok: false as const,
								status: 500 as const,
								error: error.message,
							}),
					}),
				),
			);

			if (!createdUser.ok) {
				log.error(`User creation failed: ${createdUser.error}`);
				return ctx.json({ error: createdUser.error }, createdUser.status);
			}

			return ctx.json(
				{
					message: "User created successfully",
					user: createdUser.value,
				},
				201,
			);
		});

		yield* app.delete(
			"/bulk",
			zValidator("json", bulkDeleteUsersSchema),
			async (ctx) => {
				const log = ctx.get("log");
				log.set({ route: "/users/bulk", method: "DELETE" });

				const body = ctx.req.valid("json");

				const deleted = await Effect.runPromise(
					bulkDeleteUsers(body.ids).pipe(
						Effect.provide(DbLive),
						Effect.as(true),
						Effect.catchTags({
							UsersNotFoundError: () => Effect.succeed(false),
						}),
					),
				);

				if (!deleted) {
					log.error("No users found for provided ids");
					return ctx.json({ error: "Users not found" }, 404);
				}

				return ctx.body(null, 204);
			},
		);

		yield* app.delete(
			"/:id",
			zValidator("param", z.object({ id: z.uuid() })),
			async (ctx) => {
				const log = ctx.get("log");
				log.set({ route: "/users/:id", method: "DELETE" });

				const params = ctx.req.valid("param");

				const deleted = await Effect.runPromise(
					deleteUserById(params.id).pipe(
						Effect.provide(DbLive),
						Effect.as(true),
						Effect.catchTags({
							UserNotFoundError: () => Effect.succeed(false),
						}),
					),
				);

				if (!deleted) {
					log.error(`User with id ${params.id} not found`);
					return ctx.json({ error: "User not found" }, 404);
				}

				return ctx.body(null, 204);
			},
		);

		return app.app;
	},
);
