import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
	id: serial("id").primaryKey(),
	username: varchar("username", { length: 64 }).notNull().unique(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	password: text("password").notNull(),
});

export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
