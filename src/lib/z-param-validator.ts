import { zValidator as zv } from "@hono/zod-validator";
import type { Env, MiddlewareHandler, ValidationTargets } from "hono";
import type * as v4 from "zod/v4/core";

type ZodSchema = v4.$ZodType;

export function zValidator<
	T extends ZodSchema,
	Target extends keyof ValidationTargets,
>(
	target: Target,
	schema: T,
): MiddlewareHandler<
	Env,
	string,
	{ in: { [K in Target]: v4.input<T> }; out: { [K in Target]: v4.output<T> } }
> {
	return zv(target, schema, (result, c) => {
		if (!result.success) {
			return c.json(
				{
					error: "Validation failed",
					issues: result.error.issues.map((issue) => ({
						path: issue.path,
						message: issue.message,
					})),
				},
				400,
			);
		}
	}) as any;
}
