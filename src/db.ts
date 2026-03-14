import "dotenv/config";
import { PgClient } from "@effect/sql-pg";
import * as PgDrizzle from "drizzle-orm/effect-postgres";
import { Context } from "effect";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import { types } from "pg";

const PgClientLive = PgClient.layer({
	url: Redacted.make(process.env.DATABASE_URL ?? ""),
	types: {
		getTypeParser(id, format) {
			// return raw values and let drizzle handle date/time parsing
			if ([1184, 1114, 1082, 1186, 1231, 1115, 1185, 1187, 1182].includes(id)) {
				return (value: unknown) => value;
			}

			return types.getTypeParser(id, format);
		},
	},
});

const drizzleEffect = PgDrizzle.make().pipe(
	Effect.provide(PgDrizzle.DefaultServices),
);

export class Db extends Context.Tag("Db")<
	Db,
	Effect.Effect.Success<typeof drizzleEffect>
>() {}

export const DbLive = Layer.effect(Db, drizzleEffect).pipe(
	Layer.provide(PgClientLive),
);
