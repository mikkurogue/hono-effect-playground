import { zValidator } from "../lib/z-param-validator";
import * as Effect from "effect/Effect";
import type { EvlogVariables } from "evlog/hono";
import type { Hono } from "hono";
import * as z from "zod";
import { DbLive } from "../db";
import { createHonoModule } from "../lib/hono-module";
import {
  bulkDeleteRepositories,
  createRepository,
  deleteRepositoryById,
  getRepositories,
  getRepositoryById,
} from "./service";
import {
  bulkDeleteRepositoriesSchema,
  createRepositorySchema,
  repositoryFilterSchema,
} from "./schema";

export const repositoriesModule: Effect.Effect<Hono<EvlogVariables>> = Effect.gen(function* () {
  const app = yield* createHonoModule();

  yield* app.post("/search", zValidator("json", repositoryFilterSchema), async (ctx) => {
    const log = ctx.get("log");
    log.set({ route: "/repositories/search" });

    const filter = ctx.req.valid("json");

    const result = await Effect.runPromise(
      getRepositories(filter).pipe(
        Effect.provide(DbLive),
        Effect.map((value) => ({ ok: true as const, value })),
        Effect.catchTags({
          RepositoryValidationError: (error) => {
            log.error(`Repository response validation failed: ${error.message}`);
            return Effect.succeed({
              ok: false as const,
              status: 500 as const,
              error: "Invalid repository data in database",
            });
          },
          RepositoryDatabaseError: (error) => {
            log.error(`Database error while listing repositories: ${error.message}`);
            return Effect.succeed({
              ok: false as const,
              status: 500 as const,
              error: "Database error",
            });
          },
        }),
      ),
    );

    if (!result.ok) {
      return ctx.json({ error: result.error }, result.status);
    }

    return ctx.json(result.value);
  });

  yield* app.get("/:id", zValidator("param", z.object({ id: z.uuid() })), async (ctx) => {
    const log = ctx.get("log");
    log.set({ route: "/repositories/:id" });

    const { id } = ctx.req.valid("param");

    const result = await Effect.runPromise(
      getRepositoryById(id).pipe(
        Effect.provide(DbLive),
        Effect.map((value) => ({ ok: true as const, value })),
        Effect.catchTags({
          RepositoryNotFoundError: () => {
            log.error(`Repository with id ${id} not found`);
            return Effect.succeed({
              ok: false as const,
              status: 404 as const,
              error: "Repository not found",
            });
          },
          RepositoryValidationError: (error) => {
            log.error(`Repository response validation failed: ${error.message}`);
            return Effect.succeed({
              ok: false as const,
              status: 500 as const,
              error: "Invalid repository data in database",
            });
          },
          RepositoryDatabaseError: (error) => {
            log.error(`Database error while fetching repository: ${error.message}`);
            return Effect.succeed({
              ok: false as const,
              status: 500 as const,
              error: "Database error",
            });
          },
        }),
      ),
    );

    if (!result.ok) {
      return ctx.json({ error: result.error }, result.status);
    }

    return ctx.json(result.value);
  });

  yield* app.post("/", zValidator("json", createRepositorySchema), async (ctx) => {
    const log = ctx.get("log");
    log.set({ route: "/repositories", method: "POST" });

    const body = ctx.req.valid("json");

    const result = await Effect.runPromise(
      createRepository(body).pipe(
        Effect.provide(DbLive),
        Effect.map((value) => ({ ok: true as const, value })),
        Effect.catchTags({
          RepositoryOwnerNotFoundError: (error) => {
            log.error(`Owner with id ${error.owner} not found`);
            return Effect.succeed({
              ok: false as const,
              status: 404 as const,
              error: "Owner not found",
            });
          },
          RepositoryValidationError: (error) =>
            Effect.succeed({
              ok: false as const,
              status: 400 as const,
              error: error.message,
            }),
          RepositoryDatabaseError: (error) =>
            Effect.succeed({
              ok: false as const,
              status: 500 as const,
              error: error.message,
            }),
        }),
      ),
    );

    if (!result.ok) {
      log.error(`Repository creation failed: ${result.error}`);
      return ctx.json({ error: result.error }, result.status);
    }

    return ctx.json(
      {
        message: "Repository created successfully",
        repository: result.value,
      },
      201,
    );
  });

  yield* app.delete("/bulk", zValidator("json", bulkDeleteRepositoriesSchema), async (ctx) => {
    const log = ctx.get("log");
    log.set({ route: "/repositories/bulk", method: "DELETE" });

    const body = ctx.req.valid("json");

    const deleted = await Effect.runPromise(
      bulkDeleteRepositories(body.ids).pipe(
        Effect.provide(DbLive),
        Effect.as(true),
        Effect.catchTags({
          RepositoriesNotFoundError: () => Effect.succeed(false),
        }),
      ),
    );

    if (!deleted) {
      log.error("No repositories found for provided ids");
      return ctx.json({ error: "Repositories not found" }, 404);
    }

    return ctx.body(null, 204);
  });

  yield* app.delete("/:id", zValidator("param", z.object({ id: z.uuid() })), async (ctx) => {
    const log = ctx.get("log");
    log.set({ route: "/repositories/:id", method: "DELETE" });

    const params = ctx.req.valid("param");

    const deleted = await Effect.runPromise(
      deleteRepositoryById(params.id).pipe(
        Effect.provide(DbLive),
        Effect.as(true),
        Effect.catchTags({
          RepositoryNotFoundError: () => Effect.succeed(false),
        }),
      ),
    );

    if (!deleted) {
      log.error(`Repository with id ${params.id} not found`);
      return ctx.json({ error: "Repository not found" }, 404);
    }

    return ctx.body(null, 204);
  });

  return app.app;
});
