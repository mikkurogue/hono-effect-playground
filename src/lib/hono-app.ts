import type { EvlogVariables } from "evlog/hono";
import { Hono, type MiddlewareHandler } from "hono";
import { Effect } from "effect";

/**
 * HonoApp service -- owns the Hono application instance.
 *
 * Provides:
 * - `app`: the raw Hono instance (for export / serving)
 * - `use`: register middleware via Effect
 * - `route`: mount a sub-router at a path
 */
export class HonoApp extends Effect.Service<HonoApp>()("HonoApp", {
	effect: Effect.gen(function* () {
		const app = new Hono<EvlogVariables>();

		return {
			/** The raw Hono instance. Use for `export default`, route definitions, or `Bun.serve`. */
			app,

			/** Register middleware on the app. */
			use: (...handlers: MiddlewareHandler[]) =>
				Effect.sync(() => {
					for (const handler of handlers) {
						app.use(handler);
					}
				}),

			/** Mount a sub-router at a given path. */
			route: <P extends string>(
				path: P,
				subApp: Hono<EvlogVariables>,
			) =>
				Effect.sync(() => {
					app.route(path, subApp);
				}),
		};
	}),
}) {}
