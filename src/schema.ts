import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	username: varchar("username", { length: 64 }).notNull().unique(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	password: text("password").notNull(),
});

export type User = typeof usersTable.$inferSelect;

export const repositoriesTable = pgTable("repositories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  owner: uuid("owner").notNull().references(() => usersTable.id),
});

export type Repository = typeof repositoriesTable.$inferSelect;

