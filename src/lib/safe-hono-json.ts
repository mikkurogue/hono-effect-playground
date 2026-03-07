import { Result, TaggedError } from "better-result";
import type { Context } from "hono";
import type { z } from "zod";

export class JsonParseError extends TaggedError("JsonParseError")<{
	message: string;
}>() {}

export class JsonValidationError extends TaggedError("JsonValidationError")<{
	message: string;
	issues: z.core.$ZodIssue[];
}>() {}

export async function safeJson<T extends z.ZodType>(
	ctx: Context,
	schema: T,
): Promise<Result<z.infer<T>, JsonParseError | JsonValidationError>> {
	const parseResult = await Result.tryPromise({
		try: () => ctx.req.json(),
		catch: (e) =>
			new JsonParseError({
				message: e instanceof Error ? e.message : "Failed to parse JSON body",
			}),
	});

	if (Result.isError(parseResult)) {
		return parseResult;
	}

	const validation = schema.safeParse(parseResult.value);

	if (!validation.success) {
		return Result.err(
			new JsonValidationError({
				message: "Validation failed",
				issues: validation.error.issues,
			}),
		);
	}

	return Result.ok(validation.data);
}
