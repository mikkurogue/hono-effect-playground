CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"username" varchar(64) NOT NULL UNIQUE,
	"email" varchar(255) NOT NULL UNIQUE,
	"password" text NOT NULL
);
