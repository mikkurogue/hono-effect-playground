import { Data, Effect } from "effect";
import type { Hono } from "hono";
import type { EvlogVariables } from "evlog/hono";
import { HonoApp } from "./hono-app";

export class RouteBuilderError extends Data.TaggedError("RouteBuilderError")<
	Readonly<{ message: string }>
> {}

type RouteStr = `/${string}`;

/**
 * RouteBuilder service -- safely registers sub-routers on the HonoApp.
 *
 * Depends on HonoApp.
 *
 * Validates that:
 * - Route paths start with `/`
 * - Route paths don't contain double slashes
 *
 * Provides:
 * - `route`: mount a sub-router at a validated path
 * - `routes`: mount multiple sub-routers at once
 */
export class RouteBuilder extends Effect.Service<RouteBuilder>()(
	"RouteBuilder",
	{
		effect: Effect.gen(function* () {
			const honoApp = yield* HonoApp;

      const validatedPath = (path: RouteStr): Effect.Effect<string, RouteBuilderError> => {
        if (!path.startsWith("/")) {
          return Effect.fail(
            new RouteBuilderError({
              message: `Route path must start with "/", got: "${path}"`,
            }),
          );
        }

        if (path.includes("//")) {
          return Effect.fail(
            new RouteBuilderError({
              message: `Route path must not contain double slashes, got: "${path}"`,
            }),
          );
        }

        return Effect.succeed(path)
      }
			

			return {
				/** Mount a sub-router at a validated path. */
				route: (path: RouteStr, subApp: Hono<EvlogVariables>) =>
					Effect.gen(function* () {
						yield* validatedPath(path);
						yield* honoApp.route(path, subApp);
					}),

				/** Mount multiple sub-routers at once. */
				routes: (
					routes: ReadonlyArray<{
						path: RouteStr;
						router: Hono<EvlogVariables>;
					}>,
				) =>
					Effect.gen(function* () {
						for (const { path, router } of routes) {
							yield* validatedPath(path);
							yield* honoApp.route(path, router);
						}
					}),
			};
		}),
		dependencies: [HonoApp.Default],
	},
) {}
