import type { SqlError } from "@effect/sql/SqlError";
import * as Effect from "effect/Effect";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import {
  AlreadyExistsError,
  DatabaseError,
  EntitiesNotFoundError,
  NotFoundError,
  RelationNotFoundError,
  ValidationError,
} from "./errors";

type BaseServiceErrors =
  | NotFoundError
  | EntitiesNotFoundError
  | AlreadyExistsError
  | ValidationError
  | DatabaseError
  | RelationNotFoundError
  | SqlError;

export type ServiceErrorResult = {
  ok: false;
  status: ContentfulStatusCode;
  error: string;
};

type ServiceSuccessResult<A> = {
  ok: true;
  value: A;
};

export type ServiceResult<A> = ServiceSuccessResult<A> | ServiceErrorResult;

/**
 * Pipe that maps common service errors to HTTP-friendly result objects.
 *
 * Handles: ValidationError (400), NotFoundError/EntitiesNotFoundError/RelationNotFoundError (404),
 * AlreadyExistsError (409), DatabaseError/SqlError (500).
 *
 * For domain-specific errors, add a `catchTags` before this pipe:
 * ```ts
 * effect.pipe(
 *   Effect.catchTags({
 *     ForbiddenError: (e) => Effect.succeed<ServiceResult<A>>({ ok: false, status: 403, error: "Forbidden" }),
 *   }),
 *   mapServiceErrors,
 * )
 * ```
 */
export const mapServiceErrors = <A, E extends BaseServiceErrors, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<ServiceResult<A>, never, R> =>
  (effect as Effect.Effect<A, BaseServiceErrors, R>).pipe(
    Effect.map((value): ServiceResult<A> => ({ ok: true, value })),
    Effect.catchTags({
      NotFoundError: (e) =>
        Effect.succeed<ServiceResult<A>>({
          ok: false,
          status: 404,
          error: `${e.entity} not found`,
        }),
      EntitiesNotFoundError: (e) =>
        Effect.succeed<ServiceResult<A>>({
          ok: false,
          status: 404,
          error: `${e.entity}s not found`,
        }),
      AlreadyExistsError: (e) =>
        Effect.succeed<ServiceResult<A>>({
          ok: false,
          status: 409,
          error: `${e.entity} already exists`,
        }),
      ValidationError: (e) =>
        Effect.succeed<ServiceResult<A>>({
          ok: false,
          status: 400,
          error: e.message,
        }),
      DatabaseError: () =>
        Effect.succeed<ServiceResult<A>>({
          ok: false,
          status: 500,
          error: "Internal server error",
        }),
      RelationNotFoundError: (e) =>
        Effect.succeed<ServiceResult<A>>({
          ok: false,
          status: 404,
          error: `${e.relation} not found`,
        }),
      SqlError: () =>
        Effect.succeed<ServiceResult<A>>({
          ok: false,
          status: 500,
          error: "Internal server error",
        }),
    }),
  );
