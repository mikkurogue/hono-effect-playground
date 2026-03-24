import { type SQL, and, eq, ilike, inArray } from "drizzle-orm";
import * as Effect from "effect/Effect";
import * as z from "zod";
import { Db } from "../db";
import { RelationNotFoundError } from "../lib/errors";
import { assertAnyFound, assertFound, validate } from "../lib/service-helpers";
import { withDbError } from "../lib/with-db-error";
import { repositoriesTable, usersTable } from "../schema";
import { RepositoryFilter, repositoryResponseSchema, CreateRepositoryInput } from "./schema";

const entity = "Repository";

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
      conditions.length > 0 ? yield* query.where(and(...conditions)) : yield* query;

    return yield* validate(entity, z.array(repositoryResponseSchema), repositories);
  }).pipe(withDbError(entity));
}

export function getRepositoryById(id: string) {
  return Effect.gen(function* () {
    const db = yield* Db;
    const [repository] = yield* db
      .select()
      .from(repositoriesTable)
      .where(eq(repositoriesTable.id, id));
    const found = yield* assertFound(entity, id, repository);
    return yield* validate(entity, repositoryResponseSchema, found);
  }).pipe(withDbError(entity));
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
        new RelationNotFoundError({ entity, relation: "Owner", id: input.owner }),
      );
    }

    const [created] = yield* db.insert(repositoriesTable).values(input).returning();
    return yield* validate(entity, repositoryResponseSchema, created);
  }).pipe(withDbError(entity));
}

export function deleteRepositoryById(id: string) {
  return Effect.gen(function* () {
    const db = yield* Db;
    const result = yield* db
      .delete(repositoriesTable)
      .where(eq(repositoriesTable.id, id))
      .returning();
    yield* assertFound(entity, id, result[0]);
  }).pipe(withDbError(entity));
}

export function bulkDeleteRepositories(ids: string[]) {
  return Effect.gen(function* () {
    const db = yield* Db;
    const result = yield* db
      .delete(repositoriesTable)
      .where(inArray(repositoriesTable.id, ids))
      .returning();
    yield* assertAnyFound(entity, result);
  }).pipe(withDbError(entity));
}
