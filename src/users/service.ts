import { eq, inArray } from "drizzle-orm";
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
import { CreateUserInput, userResponseSchema } from "./schema";

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

export function getUserById(id: string) {
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

export function deleteUserById(id: string) {
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

export function bulkDeleteUsers(ids: string[]) {
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
