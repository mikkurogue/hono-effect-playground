import { eq, inArray } from "drizzle-orm";
import * as Effect from "effect/Effect";
import * as z from "zod";
import { Db } from "../db";
import { assertAnyFound, assertFound, validate } from "../lib/service-helpers";
import { withDbError } from "../lib/with-db-error";
import { usersTable } from "../schema";
import { CreateUserInput, userResponseSchema } from "./schema";

const entity = "User";

export function getUsers() {
  return Effect.gen(function* () {
    const db = yield* Db;
    const users = yield* db.select().from(usersTable);
    return yield* validate(entity, z.array(userResponseSchema), users);
  }).pipe(withDbError(entity));
}

export function createUser(user: CreateUserInput) {
  return Effect.gen(function* () {
    const db = yield* Db;
    const [created] = yield* db.insert(usersTable).values(user).returning();
    return yield* validate(entity, userResponseSchema, created);
  }).pipe(withDbError(entity, { uniqueConstraint: true }));
}

export function getUserById(id: string) {
  return Effect.gen(function* () {
    const db = yield* Db;
    const [user] = yield* db.select().from(usersTable).where(eq(usersTable.id, id));
    const found = yield* assertFound(entity, id, user);
    return yield* validate(entity, userResponseSchema, found);
  }).pipe(withDbError(entity));
}

export function deleteUserById(id: string) {
  return Effect.gen(function* () {
    const db = yield* Db;
    const result = yield* db.delete(usersTable).where(eq(usersTable.id, id)).returning();
    yield* assertFound(entity, id, result[0]);
  }).pipe(withDbError(entity));
}

export function bulkDeleteUsers(ids: string[]) {
  return Effect.gen(function* () {
    const db = yield* Db;
    const result = yield* db.delete(usersTable).where(inArray(usersTable.id, ids)).returning();
    yield* assertAnyFound(entity, result);
  }).pipe(withDbError(entity));
}
