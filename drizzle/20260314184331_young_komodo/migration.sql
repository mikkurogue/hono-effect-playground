CREATE TABLE "repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"owner" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"username" varchar(64) NOT NULL UNIQUE,
	"email" varchar(255) NOT NULL UNIQUE,
	"password" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_owner_users_id_fkey" FOREIGN KEY ("owner") REFERENCES "users"("id");