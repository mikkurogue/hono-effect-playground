import type { EvlogVariables } from "evlog/hono";
import type { Env, Handler, Input, MiddlewareHandler } from "hono";
import { Hono } from "hono";
import { Effect } from "effect";

type HonoModuleApp = Hono<EvlogVariables>;

type ModuleHandler<P extends string = string, I extends Input = {}> = Handler<EvlogVariables, P, I>;

type ModuleMiddleware<
  P extends string = string,
  I extends Input = {},
  E extends Env = Env,
> = MiddlewareHandler<E, P, I>;

type ModuleRouteRegistrar = {
  <P extends string, I extends Input = {}>(
    path: P,
    handler: ModuleHandler<P, I>,
  ): Effect.Effect<void>;
  <P extends string, I extends Input = {}, I2 extends Input = I, E2 extends Env = Env>(
    path: P,
    ...handlers: [ModuleMiddleware<P, I, E2>, ModuleHandler<P, I2>]
  ): Effect.Effect<void>;
  <
    P extends string,
    I extends Input = {},
    I2 extends Input = I,
    I3 extends Input = I & I2,
    E2 extends Env = Env,
    E3 extends Env = Env,
  >(
    path: P,
    ...handlers: [ModuleMiddleware<P, I, E2>, ModuleMiddleware<P, I2, E3>, ModuleHandler<P, I3>]
  ): Effect.Effect<void>;
  (path: string, ...handlers: Array<ModuleMiddleware | ModuleHandler>): Effect.Effect<void>;
};

export type HonoModule = {
  app: HonoModuleApp;
  use: (...handlers: ModuleMiddleware[]) => Effect.Effect<void>;
  get: ModuleRouteRegistrar;
  post: ModuleRouteRegistrar;
  put: ModuleRouteRegistrar;
  patch: ModuleRouteRegistrar;
  delete: ModuleRouteRegistrar;
};

/**
 * Create an effectful hono module that can be used to define routes and middleware for modules
 */
export const createHonoModule = (): Effect.Effect<HonoModule> =>
  Effect.sync(() => {
    const app = new Hono<EvlogVariables>();
    const route = (method: "get" | "post" | "put" | "patch" | "delete") =>
      ((path: string, ...handlers: Array<ModuleMiddleware | ModuleHandler>) =>
        Effect.sync(() => {
          (app[method] as (...args: any[]) => unknown)(path, ...handlers);
        })) as ModuleRouteRegistrar;

    return {
      app,
      use: (...handlers) =>
        Effect.sync(() => {
          (app.use as (...args: any[]) => unknown)(...handlers);
        }),
      get: route("get"),
      post: route("post"),
      put: route("put"),
      patch: route("patch"),
      delete: route("delete"),
    };
  });
