import { describe, expect, test } from "bun:test";
import { Data } from "effect";
import * as Effect from "effect/Effect";
import { withDbError } from "../../src/lib/with-db-error";

// Mock tagged errors matching the _tag used by drizzle-orm and @effect/sql
class MockDrizzleQueryError extends Data.TaggedError("EffectDrizzleQueryError")<{
  message: string;
  query: string;
  params: unknown[];
  cause: unknown;
}> {}

class MockSqlError extends Data.TaggedError("SqlError")<{
  message: string;
}> {}

// Helper to extract the Fail error from an Effect
const runFailSync = <E>(effect: Effect.Effect<unknown, E, never>): E => {
  const exit = Effect.runSyncExit(effect);
  if (exit._tag !== "Failure" || exit.cause._tag !== "Fail") {
    throw new Error("Expected effect to fail");
  }
  return exit.cause.error;
};

describe("withDbError", () => {
  test("detects unique constraint violation when flag is enabled", () => {
    const error = runFailSync(
      Effect.fail(
        new MockDrizzleQueryError({
          message: 'duplicate key value violates unique constraint "users_email_key"',
          query: "INSERT INTO users",
          params: [],
          cause: null,
        }),
      ).pipe(withDbError("User", { uniqueConstraint: true })),
    );

    expect(error._tag).toBe("AlreadyExistsError");
    expect(error.entity).toBe("User");
  });

  test("does not detect unique constraint when flag is off", () => {
    const error = runFailSync(
      Effect.fail(
        new MockDrizzleQueryError({
          message: 'duplicate key value violates unique constraint "users_email_key"',
          query: "INSERT INTO users",
          params: [],
          cause: null,
        }),
      ).pipe(withDbError("User")),
    );

    expect(error._tag).toBe("DatabaseError");
  });

  test("case-insensitive unique constraint matching", () => {
    const error = runFailSync(
      Effect.fail(
        new MockDrizzleQueryError({
          message: 'DUPLICATE KEY VALUE VIOLATES UNIQUE CONSTRAINT "users_pkey"',
          query: "INSERT",
          params: [],
          cause: null,
        }),
      ).pipe(withDbError("User", { uniqueConstraint: true })),
    );

    expect(error._tag).toBe("AlreadyExistsError");
  });

  test("converts non-constraint DrizzleQueryError to DatabaseError with message", () => {
    const error = runFailSync(
      Effect.fail(
        new MockDrizzleQueryError({
          message: "relation 'foo' does not exist",
          query: "SELECT * FROM foo",
          params: [],
          cause: null,
        }),
      ).pipe(withDbError("User")),
    );

    expect(error._tag).toBe("DatabaseError");
    expect(error.entity).toBe("User");
    expect(error.message).toBe("relation 'foo' does not exist");
  });

  test("catches SqlError from the underlying SQL layer", () => {
    const error = runFailSync(
      Effect.fail(new MockSqlError({ message: "connection refused" })).pipe(
        withDbError("User"),
      ),
    );

    expect(error._tag).toBe("DatabaseError");
    expect(error.message).toBe("connection refused");
  });
});
