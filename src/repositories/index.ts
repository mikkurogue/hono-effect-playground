import { zValidator } from "../lib/z-param-validator";
import Effect from "effect/Effect";
import type { EvlogVariables } from "evlog/hono";
import type { Hono } from "hono";
import z from "zod";
import { DbLive } from "../db";
import { createHonoModule } from "../lib/hono-module";
import { mapServiceErrors } from "../lib/map-service-errors";
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
      getRepositories(filter).pipe(Effect.provide(DbLive), mapServiceErrors),
    );

    if (!result.ok) {
      log.error(`Failed to list repositories: ${result.error}`);
      return ctx.json({ error: result.error }, result.status);
    }

    return ctx.json(result.value);
  });

  yield* app.get("/:id", zValidator("param", z.object({ id: z.uuid() })), async (ctx) => {
    const log = ctx.get("log");
    log.set({ route: "/repositories/:id" });

    const { id } = ctx.req.valid("param");

    const result = await Effect.runPromise(
      getRepositoryById(id).pipe(Effect.provide(DbLive), mapServiceErrors),
    );

    if (!result.ok) {
      log.error(`Failed to get repository ${id}: ${result.error}`);
      return ctx.json({ error: result.error }, result.status);
    }

    return ctx.json(result.value);
  });

  yield* app.post("/", zValidator("json", createRepositorySchema), async (ctx) => {
    const log = ctx.get("log");
    log.set({ route: "/repositories", method: "POST" });

    const body = ctx.req.valid("json");

    const result = await Effect.runPromise(
      createRepository(body).pipe(Effect.provide(DbLive), mapServiceErrors),
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

    const result = await Effect.runPromise(
      bulkDeleteRepositories(body.ids).pipe(Effect.provide(DbLive), mapServiceErrors),
    );

    if (!result.ok) {
      log.error(`Bulk delete repositories failed: ${result.error}`);
      return ctx.json({ error: result.error }, result.status);
    }

    return ctx.body(null, 204);
  });

  yield* app.delete("/:id", zValidator("param", z.object({ id: z.uuid() })), async (ctx) => {
    const log = ctx.get("log");
    log.set({ route: "/repositories/:id", method: "DELETE" });

    const params = ctx.req.valid("param");

    const result = await Effect.runPromise(
      deleteRepositoryById(params.id).pipe(Effect.provide(DbLive), mapServiceErrors),
    );

    if (!result.ok) {
      log.error(`Delete repository ${params.id} failed: ${result.error}`);
      return ctx.json({ error: result.error }, result.status);
    }

    return ctx.body(null, 204);
  });

  return app.app;
});
