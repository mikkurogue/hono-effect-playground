import { initLogger } from "evlog";
import { evlog } from "evlog/hono";
import { Effect, Layer } from "effect";
import { HonoApp } from "./lib/hono-app";
import { RouteBuilder } from "./lib/route-builder";
import { repositoriesModule } from "./repositories";
import { usersModule } from "./users";

initLogger({
	env: {
		service: "my-api",
	},
});

const hono = Effect.gen(function* () {
	const honoApp = yield* HonoApp;
	const routeBuilder = yield* RouteBuilder;

	const users = yield* usersModule;
	const repositories = yield* repositoriesModule;

	// Register middleware
	yield* honoApp.use(evlog());

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

const AppLive = Layer.mergeAll(
	HonoApp.Default,
	RouteBuilder.Default,
);

const app = Effect.runSync(
	hono.pipe(
		Effect.provide(AppLive),
	),
);

export default app;
