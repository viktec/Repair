CREATE TYPE "public"."registration_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "registration_status" "registration_status" DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "registration_status" SET DEFAULT 'pending';
