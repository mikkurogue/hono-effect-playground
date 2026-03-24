import * as Effect from "effect/Effect";
import { AlreadyExistsError, DatabaseError } from "./errors";

type ServiceErrors = AlreadyExistsError | DatabaseError;

export const withDbError =
  (entity: string, options?: { uniqueConstraint?: boolean }) =>
  <A, E, R>(
    effect: Effect.Effect<A, E, R>,
  ): Effect.Effect<
    A,
    Exclude<E, { _tag: "EffectDrizzleQueryError" | "SqlError" }> | ServiceErrors,
    R
  > =>
    effect.pipe(
      Effect.catchAll(
        (
          error,
        ): Effect.Effect<
          never,
          ServiceErrors | Exclude<E, { _tag: "EffectDrizzleQueryError" | "SqlError" }>,
          never
        > => {
          const tagged = error as Record<string, unknown>;

          if (tagged._tag === "EffectDrizzleQueryError") {
            const message = String(tagged.message ?? "");
            if (
              options?.uniqueConstraint &&
              message.toLowerCase().includes("duplicate key value violates unique constraint")
            ) {
              return Effect.fail(new AlreadyExistsError({ entity }));
            }
            return Effect.fail(new DatabaseError({ entity, message }));
          }

          if (tagged._tag === "SqlError") {
            return Effect.fail(
              new DatabaseError({ entity, message: String(tagged.message ?? "") }),
            );
          }

          return Effect.fail(error as Exclude<E, { _tag: "EffectDrizzleQueryError" | "SqlError" }>);
        },
      ),
    );
