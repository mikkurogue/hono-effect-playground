import { eq, inArray } from "drizzle-orm";
import { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import * as Effect from "effect/Effect";
import * as z from "zod";
import { Db } from "../db";
import { usersTable } from "../schema";
import {
	UserAlreadyExistsError,
	UserDatabaseError,
	UserNotFoundError,
	UsersNotFoundError,
	UserValidationError,
} from "./errors";

export const userSchema = z.object({
	id: z.number(),
	username: z.string().min(3),
	email: z.email(),
	password: z.string().min(6),
});

export const createUserSchema = userSchema.omit({ id: true });
export const userResponseSchema = userSchema.omit({ password: true });
export const bulkDeleteUsersSchema = z.object({
	ids: z.array(z.number().int().positive()).min(1),
});

export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type BulkDeleteUsersInput = z.infer<typeof bulkDeleteUsersSchema>;

export function getUsers() {
	return Effect.gen(function* () {
		const db = yield* Db;
		const users = yield* db.select().from(usersTable);

		const parsedUsers = z.array(userResponseSchema).safeParse(users);
		if (!parsedUsers.success) {
			return yield* Effect.fail(
				new UserValidationError({ message: parsedUsers.error.message }),
			);
		}

		return parsedUsers.data;
	}).pipe(
		Effect.catchTags({
			EffectDrizzleQueryError: (error) =>
				Effect.fail(new UserDatabaseError({ message: error.message })),
		}),
	);
}

export function createUser(user: CreateUserInput) {
	return Effect.gen(function* () {
		const db = yield* Db;

		const [createdUser] = yield* db.insert(usersTable).values(user).returning();

		const parsedUser = userResponseSchema.safeParse(createdUser);
		if (!parsedUser.success) {
			return yield* Effect.fail(
				new UserValidationError({ message: parsedUser.error.message }),
			);
		}

		return parsedUser.data;
	}).pipe(
		Effect.catchTags({
			EffectDrizzleQueryError: (error) => {
				if (
					error.message
						.toLowerCase()
						.includes("duplicate key value violates unique constraint")
				) {
					return Effect.fail(new UserAlreadyExistsError());
				}

				return Effect.fail(new UserDatabaseError({ message: error.message }));
			},
		}),
	);
}

export function getUserById(id: number) {
	return Effect.gen(function* () {
		const db = yield* Db;

		const [user] = yield* db
			.select()
			.from(usersTable)
			.where(eq(usersTable.id, id));

		if (!user) {
			return yield* Effect.fail(new UserNotFoundError({ id }));
		}

		const parsedUser = userResponseSchema.safeParse(user);
		if (!parsedUser.success) {
			return yield* Effect.fail(
				new UserValidationError({ message: parsedUser.error.message }),
			);
		}

		return parsedUser.data;
	}).pipe(
		Effect.catchTags({
			EffectDrizzleQueryError: (error) =>
				Effect.fail(new UserDatabaseError({ message: error.message })),
		}),
	);
}

export function deleteUserById(id: number) {
	return Effect.gen(function* () {
		const db = yield* Db;

		const result = yield* db
			.delete(usersTable)
			.where(eq(usersTable.id, id))
			.returning();

		if (result.length === 0) {
			return yield* Effect.fail(new UserNotFoundError({ id }));
		}
	}).pipe(
		Effect.catchTags({
			EffectDrizzleQueryError: (error) =>
				Effect.fail(new UserDatabaseError({ message: error.message })),
		}),
	);
}

export function bulkDeleteUsers(ids: number[]) {
	return Effect.gen(function* () {
		const db = yield* Db;

		const result = yield* db
			.delete(usersTable)
			.where(inArray(usersTable.id, ids))
			.returning();

		if (result.length === 0) {
			return yield* Effect.fail(new UsersNotFoundError());
		}
	}).pipe(
		Effect.catchTags({
			EffectDrizzleQueryError: (error) =>
				Effect.fail(new UserDatabaseError({ message: error.message })),
		}),
	);
}
