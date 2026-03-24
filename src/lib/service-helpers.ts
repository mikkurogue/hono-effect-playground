import * as Effect from "effect/Effect";
import type { ZodType } from "zod";
import { NotFoundError, EntitiesNotFoundError, ValidationError } from "./errors";

/** Validate data against a Zod schema, failing with ValidationError on parse failure */
export const validate = <T>(entity: string, schema: ZodType<T>, data: unknown) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    return Effect.fail(new ValidationError({ entity, message: result.error.message }));
  }
  return Effect.succeed(result.data);
};

/** Assert a single record exists, or fail with NotFoundError */
export const assertFound = <T>(entity: string, id: string, record: T | undefined) =>
  record !== undefined ? Effect.succeed(record) : Effect.fail(new NotFoundError({ entity, id }));

/** Assert at least one record was affected, or fail with EntitiesNotFoundError */
export const assertAnyFound = (entity: string, results: unknown[]) =>
  results.length > 0 ? Effect.succeed(results) : Effect.fail(new EntitiesNotFoundError({ entity }));
