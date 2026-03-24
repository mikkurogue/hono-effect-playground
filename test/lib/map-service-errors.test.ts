import { describe, expect, test } from "bun:test";
import * as Effect from "effect/Effect";
import { mapServiceErrors } from "../../src/lib/map-service-errors";
import {
  NotFoundError,
  EntitiesNotFoundError,
  AlreadyExistsError,
  ValidationError,
  DatabaseError,
  RelationNotFoundError,
} from "../../src/lib/errors";

// Helper: run an effect through mapServiceErrors and return the result
const mapError = (error: any) =>
  Effect.runSync(mapServiceErrors(Effect.fail(error)));

describe("mapServiceErrors", () => {
  test("NotFoundError -> 404 with entity name", () => {
    const result = mapError(new NotFoundError({ entity: "User", id: "abc" }));
    expect(result).toEqual({ ok: false, status: 404, error: "User not found" });
  });

  test("EntitiesNotFoundError -> 404 with pluralized entity", () => {
    const result = mapError(new EntitiesNotFoundError({ entity: "User" }));
    expect(result).toEqual({ ok: false, status: 404, error: "Users not found" });
  });

  test("AlreadyExistsError -> 409 with entity name", () => {
    const result = mapError(new AlreadyExistsError({ entity: "User" }));
    expect(result).toEqual({ ok: false, status: 409, error: "User already exists" });
  });

  test("ValidationError -> 400 with original message", () => {
    const result = mapError(
      new ValidationError({ entity: "User", message: "Invalid email format" }),
    );
    expect(result).toEqual({ ok: false, status: 400, error: "Invalid email format" });
  });

  test("DatabaseError -> 500 with generic message (no leak)", () => {
    const result = mapError(
      new DatabaseError({ entity: "User", message: "connection refused on port 5432" }),
    );
    expect(result).toEqual({ ok: false, status: 500, error: "Internal server error" });
  });

  test("RelationNotFoundError -> 404 using relation name, not entity", () => {
    const result = mapError(
      new RelationNotFoundError({ entity: "Repository", relation: "Owner", id: "xyz" }),
    );
    expect(result).toEqual({ ok: false, status: 404, error: "Owner not found" });
  });
});
