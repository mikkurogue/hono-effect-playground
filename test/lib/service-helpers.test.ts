import { describe, expect, test } from "bun:test";
import * as Effect from "effect/Effect";
import * as z from "zod";
import { validate, assertFound, assertAnyFound } from "../../src/lib/service-helpers";

// Helper to extract the Fail error from an Effect
const runFailSync = <E>(effect: Effect.Effect<unknown, E, never>): E => {
  const exit = Effect.runSyncExit(effect);
  if (exit._tag !== "Failure" || exit.cause._tag !== "Fail") {
    throw new Error("Expected effect to fail");
  }
  return exit.cause.error;
};

describe("validate", () => {
  const schema = z.object({ id: z.string(), name: z.string() });

  test("threads entity name into ValidationError on parse failure", () => {
    const error = runFailSync(validate("User", schema, { id: 123 }));
    expect(error._tag).toBe("ValidationError");
    expect(error.entity).toBe("User");
  });

  test("includes zod error details in ValidationError message", () => {
    const error = runFailSync(validate("User", schema, {}));
    expect(error.message.length).toBeGreaterThan(0);
  });
});

describe("assertFound", () => {
  test("treats undefined as not found", () => {
    const error = runFailSync(assertFound("User", "abc-123", undefined));
    expect(error._tag).toBe("NotFoundError");
    expect(error.entity).toBe("User");
    expect(error.id).toBe("abc-123");
  });

  test("accepts falsy defined values (null, 0, empty string)", () => {
    expect(Effect.runSync(assertFound("Item", "1", null))).toBe(null);
    expect(Effect.runSync(assertFound("Item", "1", 0))).toBe(0);
    expect(Effect.runSync(assertFound("Item", "1", ""))).toBe("");
    expect(Effect.runSync(assertFound("Item", "1", false))).toBe(false);
  });
});

describe("assertAnyFound", () => {
  test("treats empty array as not found", () => {
    const error = runFailSync(assertAnyFound("User", []));
    expect(error._tag).toBe("EntitiesNotFoundError");
    expect(error.entity).toBe("User");
  });

  test("passes through non-empty array", () => {
    const items = [{ id: "1" }];
    expect(Effect.runSync(assertAnyFound("User", items))).toBe(items);
  });
});
