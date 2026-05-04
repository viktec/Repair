ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_reset_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_reset_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "trial_reminder_sent_at" timestamp;
