import { zValidator } from "@hono/zod-validator";
import * as Effect from "effect/Effect";
import type { EvlogVariables } from "evlog/hono";
import { Hono } from "hono";
import * as z from "zod";
import { DbLive } from "../db";
import {
	bulkDeleteUsers,
	bulkDeleteUsersSchema,
	createUser,
	createUserSchema,
	deleteUserById,
	getUsers,
} from "./service";

export const users = new Hono<EvlogVariables>();

users.get("/", async (ctx) => {
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

users.post("/", zValidator("json", createUserSchema), async (ctx) => {
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

users.delete(
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

users.delete(
	"/:id",
	zValidator("param", z.object({ id: z.coerce.number().int().positive() })),
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
