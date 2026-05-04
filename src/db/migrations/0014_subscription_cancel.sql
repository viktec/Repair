ALTER TABLE "organizations" ADD COLUMN "stripe_cancel_at_period_end" boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "stripe_current_period_end" timestamp;
