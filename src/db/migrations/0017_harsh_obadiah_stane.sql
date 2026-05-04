ALTER TABLE "users" ADD COLUMN "magic_link_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "magic_link_expires_at" timestamp;