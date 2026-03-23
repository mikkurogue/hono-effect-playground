import { initLogger } from "evlog";
import { evlog } from "evlog/hono";
import { Effect, Layer } from "effect";
import { HonoApp } from "./lib/hono-app";
import { RouteBuilder } from "./lib/route-builder";
import { ScalarDocs } from "./lib/scalar-docs";
import { repositoriesModule } from "./repositories";
import { usersModule } from "./users";
import { apiSpec } from "./openapi-spec";

initLogger({
  env: {
    service: "my-api",
  },
});

const hono = Effect.gen(function* () {
  const honoApp = yield* HonoApp;
  const routeBuilder = yield* RouteBuilder;
  const scalarDocs = yield* ScalarDocs;

  const users = yield* usersModule;
  const repositories = yield* repositoriesModule;

  // Register middleware
  yield* honoApp.use(evlog());

  // Register API documentation (Scalar + OpenAPI spec)
  yield* scalarDocs.register({
    spec: apiSpec,
    pageTitle: "My API Reference",
    theme: "purple",
  });

  // Register root route
  honoApp.app.get("/", (c) => {
    c.get("log").set({ route: "/" });
    return c.text("Hello Hono!");
  });

  // Register sub-routers via the RouteBuilder
  yield* routeBuilder.routes([
    { path: "/users", router: users },
    { path: "/repositories", router: repositories },
  ]);

  return honoApp.app;
});

const AppLive = Layer.mergeAll(HonoApp.Default, RouteBuilder.Default, ScalarDocs.Default);

const app = Effect.runSync(hono.pipe(Effect.provide(AppLive)));

export default app;
