ALTER TABLE "organizations" ALTER COLUMN "plan" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "plan" SET DEFAULT 'start'::text;--> statement-breakpoint
UPDATE "organizations" SET "plan" = 'start' WHERE "plan" = 'solo';--> statement-breakpoint
DROP TYPE "public"."plan";--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('start', 'pro', 'business');--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "plan" SET DEFAULT 'start'::"public"."plan";--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "plan" SET DATA TYPE "public"."plan" USING "plan"::"public"."plan";
