import { Effect } from "effect";
import { Scalar } from "@scalar/hono-api-reference";
import { HonoApp } from "./hono-app";
import type { OpenAPIV3 } from "openapi-types";

type ScalarTheme = "alternate" | "default" | "moon" | "purple" | "solarized" | "none";

interface ScalarDocsConfig {
  /** The OpenAPI specification document. */
  spec: OpenAPIV3.Document;
  /** Path to serve the OpenAPI JSON spec. @default "/doc" */
  specPath?: string;
  /** Path to serve the Scalar API reference UI. @default "/scalar" */
  scalarPath?: string;
  /** Scalar UI theme. @default "purple" */
  theme?: ScalarTheme;
  /** Custom page title for the Scalar UI. */
  pageTitle?: string;
}

/**
 * ScalarDocs service -- registers OpenAPI spec and Scalar API reference endpoints on the HonoApp.
 *
 * Depends on HonoApp.
 *
 * Provides:
 * - `register`: mount the OpenAPI JSON spec endpoint and Scalar UI at configured paths
 */
export class ScalarDocs extends Effect.Service<ScalarDocs>()("ScalarDocs", {
  effect: Effect.gen(function* () {
    const honoApp = yield* HonoApp;

    return {
      /**
       * Register the OpenAPI spec endpoint and Scalar API reference UI on the app.
       *
       * @param config - The OpenAPI spec and Scalar configuration
       */
      register: (config: ScalarDocsConfig) =>
        Effect.sync(() => {
          const specPath = config.specPath ?? "/doc";
          const scalarPath = config.scalarPath ?? "/scalar";
          const theme = config.theme ?? "purple";

          // Serve the OpenAPI spec as JSON
          honoApp.app.get(specPath, (c) => c.json(config.spec));

          // Serve the Scalar API reference UI
          honoApp.app.get(
            scalarPath,
            Scalar({
              url: specPath,
              theme,
              pageTitle: config.pageTitle,
            }),
          );
        }),
    };
  }),
  dependencies: [HonoApp.Default],
}) {}
