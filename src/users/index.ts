import { zValidator } from "../lib/z-param-validator";
import Effect from "effect/Effect";
import type { EvlogVariables } from "evlog/hono";
import type { Context, Hono } from "hono";
import z from "zod";
import { DbLive } from "../db";
import { createHonoModule } from "../lib/hono-module";
import { mapServiceErrors } from "../lib/map-service-errors";
import { bulkDeleteUsers, createUser, deleteUserById, getUserById, getUsers } from "./service";
import { createUserSchema, bulkDeleteUsersSchema } from "./schema";

export const usersModule: Effect.Effect<Hono<EvlogVariables>> = Effect.gen(function* () {
  const app = yield* createHonoModule();

  yield* app.get("/", async (ctx: Context) => {
    const log = ctx.get("log");
    log.set({ route: "/users" });

    const result = await Effect.runPromise(
      getUsers().pipe(Effect.provide(DbLive), mapServiceErrors),
    );

    if (!result.ok) {
      log.error(`Failed to list users: ${result.error}`);
      return ctx.json({ error: result.error }, result.status);
    }

    return ctx.json(result.value);
  });

  yield* app.get("/:id", zValidator("param", z.object({ id: z.uuid() })), async (ctx) => {
    const log = ctx.get("log");
    log.set({ route: "/users/:id" });

    const { id } = ctx.req.valid("param");

    const result = await Effect.runPromise(
      getUserById(id).pipe(Effect.provide(DbLive), mapServiceErrors),
    );

    if (!result.ok) {
      log.error(`Failed to get user ${id}: ${result.error}`);
      return ctx.json({ error: result.error }, result.status);
    }

    return ctx.json(result.value);
  });

  yield* app.post("/", zValidator("json", createUserSchema), async (ctx) => {
    const log = ctx.get("log");
    log.set({ route: "/users", method: "POST" });

    const body = ctx.req.valid("json");

    const result = await Effect.runPromise(
      createUser(body).pipe(Effect.provide(DbLive), mapServiceErrors),
    );

    if (!result.ok) {
      log.error(`User creation failed: ${result.error}`);
      return ctx.json({ error: result.error }, result.status);
    }

    return ctx.json(
      {
        message: "User created successfully",
        user: result.value,
      },
      201,
    );
  });

  yield* app.delete("/bulk", zValidator("json", bulkDeleteUsersSchema), async (ctx) => {
    const log = ctx.get("log");
    log.set({ route: "/users/bulk", method: "DELETE" });

    const body = ctx.req.valid("json");

    const result = await Effect.runPromise(
      bulkDeleteUsers(body.ids).pipe(Effect.provide(DbLive), mapServiceErrors),
    );

    if (!result.ok) {
      log.error(`Bulk delete users failed: ${result.error}`);
      return ctx.json({ error: result.error }, result.status);
    }

    return ctx.body(null, 204);
  });

  yield* app.delete("/:id", zValidator("param", z.object({ id: z.uuid() })), async (ctx) => {
    const log = ctx.get("log");
    log.set({ route: "/users/:id", method: "DELETE" });

    const params = ctx.req.valid("param");

    const result = await Effect.runPromise(
      deleteUserById(params.id).pipe(Effect.provide(DbLive), mapServiceErrors),
    );

    if (!result.ok) {
      log.error(`Delete user ${params.id} failed: ${result.error}`);
      return ctx.json({ error: result.error }, result.status);
    }

    return ctx.body(null, 204);
  });

  return app.app;
});
