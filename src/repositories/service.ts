import { type SQL, and, eq, ilike, inArray } from "drizzle-orm";
import * as Effect from "effect/Effect";
import * as z from "zod";
import { Db } from "../db";
import { repositoriesTable, usersTable } from "../schema";
import {
	RepositoriesNotFoundError,
	RepositoryDatabaseError,
	RepositoryNotFoundError,
	RepositoryOwnerNotFoundError,
	RepositoryValidationError,
} from "./errors";

export const repositorySchema = z.object({
	id: z.uuid(),
	name: z.string().min(1),
	owner: z.uuid(),
});

export const createRepositorySchema = repositorySchema.omit({ id: true });
export const repositoryResponseSchema = repositorySchema;
export const bulkDeleteRepositoriesSchema = z.object({
	ids: z.array(z.uuid()),
});

export const repositoryFilterSchema = z.object({
	owner: z.uuid().optional(),
	name: z.string().optional(),
});

export type Repository = z.infer<typeof repositorySchema>;
export type CreateRepositoryInput = z.infer<typeof createRepositorySchema>;
export type RepositoryResponse = z.infer<typeof repositoryResponseSchema>;
export type RepositoryFilter = z.infer<typeof repositoryFilterSchema>;
export type BulkDeleteRepositoriesInput = z.infer<
	typeof bulkDeleteRepositoriesSchema
>;

export function getRepositories(filter?: RepositoryFilter) {
	return Effect.gen(function* () {
		const db = yield* Db;

		const conditions: SQL[] = [];
		if (filter?.owner) {
			conditions.push(eq(repositoriesTable.owner, filter.owner));
		}
		if (filter?.name) {
			conditions.push(ilike(repositoriesTable.name, `%${filter.name}%`));
		}

		const query = db.select().from(repositoriesTable);
		const repositories =
			conditions.length > 0
				? yield* query.where(and(...conditions))
				: yield* query;

		const parsed = z.array(repositoryResponseSchema).safeParse(repositories);
		if (!parsed.success) {
			return yield* Effect.fail(
				new RepositoryValidationError({ message: parsed.error.message }),
			);
		}

		return parsed.data;
	}).pipe(
		Effect.catchTags({
			EffectDrizzleQueryError: (error) =>
				Effect.fail(
					new RepositoryDatabaseError({ message: error.message }),
				),
		}),
	);
}

export function getRepositoryById(id: string) {
	return Effect.gen(function* () {
		const db = yield* Db;

		const [repository] = yield* db
			.select()
			.from(repositoriesTable)
			.where(eq(repositoriesTable.id, id));

		if (!repository) {
			return yield* Effect.fail(new RepositoryNotFoundError({ id }));
		}

		const parsed = repositoryResponseSchema.safeParse(repository);
		if (!parsed.success) {
			return yield* Effect.fail(
				new RepositoryValidationError({ message: parsed.error.message }),
			);
		}

		return parsed.data;
	}).pipe(
		Effect.catchTags({
			EffectDrizzleQueryError: (error) =>
				Effect.fail(
					new RepositoryDatabaseError({ message: error.message }),
				),
		}),
	);
}

export function createRepository(input: CreateRepositoryInput) {
	return Effect.gen(function* () {
		const db = yield* Db;

		// Verify the owner exists
		const [owner] = yield* db
			.select({ id: usersTable.id })
			.from(usersTable)
			.where(eq(usersTable.id, input.owner));

		if (!owner) {
			return yield* Effect.fail(
				new RepositoryOwnerNotFoundError({ owner: input.owner }),
			);
		}

		const [created] = yield* db
			.insert(repositoriesTable)
			.values(input)
			.returning();

		const parsed = repositoryResponseSchema.safeParse(created);
		if (!parsed.success) {
			return yield* Effect.fail(
				new RepositoryValidationError({ message: parsed.error.message }),
			);
		}

		return parsed.data;
	}).pipe(
		Effect.catchTags({
			EffectDrizzleQueryError: (error) =>
				Effect.fail(
					new RepositoryDatabaseError({ message: error.message }),
				),
		}),
	);
}

export function deleteRepositoryById(id: string) {
	return Effect.gen(function* () {
		const db = yield* Db;

		const result = yield* db
			.delete(repositoriesTable)
			.where(eq(repositoriesTable.id, id))
			.returning();

		if (result.length === 0) {
			return yield* Effect.fail(new RepositoryNotFoundError({ id }));
		}
	}).pipe(
		Effect.catchTags({
			EffectDrizzleQueryError: (error) =>
				Effect.fail(
					new RepositoryDatabaseError({ message: error.message }),
				),
		}),
	);
}

export function bulkDeleteRepositories(ids: string[]) {
	return Effect.gen(function* () {
		const db = yield* Db;

		const result = yield* db
			.delete(repositoriesTable)
			.where(inArray(repositoriesTable.id, ids))
			.returning();

		if (result.length === 0) {
			return yield* Effect.fail(new RepositoriesNotFoundError());
		}
	}).pipe(
		Effect.catchTags({
			EffectDrizzleQueryError: (error) =>
				Effect.fail(
					new RepositoryDatabaseError({ message: error.message }),
				),
		}),
	);
}
