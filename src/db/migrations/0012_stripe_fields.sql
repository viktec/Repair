ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "stripe_customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" varchar(255);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "stripe_price_id" varchar(255);
