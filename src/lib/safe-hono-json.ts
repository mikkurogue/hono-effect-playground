import { Context, Data } from "effect";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type { Context as HonoContext } from "hono";
import type { z } from "zod";

export class JsonParseError extends Data.TaggedError("JsonParseError")<{
  message: string;
}> {}

export class JsonValidationError extends Data.TaggedError("JsonValidationError")<{
  message: string;
  issues: z.core.$ZodIssue[];
}> {}

interface HonoJsonParser {
  readonly safeJson: <T extends z.ZodType>(
    ctx: HonoContext,
    schema: T,
  ) => Effect.Effect<z.infer<T>, JsonParseError | JsonValidationError>;
}

export class HonoJson extends Context.Tag("HonoJson")<HonoJson, HonoJsonParser>() {}

export const HonoJsonLive = Layer.succeed(HonoJson, {
  safeJson: <T extends z.ZodType>(ctx: HonoContext, schema: T) =>
    Effect.gen(function* () {
      const body = yield* Effect.tryPromise({
        try: () => ctx.req.json(),
        catch: (e) =>
          new JsonParseError({
            message: e instanceof Error ? e.message : "Failed to parse JSON body",
          }),
      });

      const validation = schema.safeParse(body);

      if (!validation.success) {
        return yield* Effect.fail(
          new JsonValidationError({
            message: "Validation failed",
            issues: validation.error.issues,
          }),
        );
      }

      return validation.data as z.infer<T>;
    }),
});
