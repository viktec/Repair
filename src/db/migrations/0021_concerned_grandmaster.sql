ALTER TABLE "support_interventions" ADD COLUMN "location" varchar(200);--> statement-breakpoint
ALTER TABLE "support_interventions" ADD COLUMN "client_signature_token" varchar(64);--> statement-breakpoint
ALTER TABLE "support_interventions" ADD COLUMN "client_signed_at" timestamp;--> statement-breakpoint
ALTER TABLE "support_interventions" ADD COLUMN "client_signature_data" text;--> statement-breakpoint
ALTER TABLE "support_interventions" ADD CONSTRAINT "support_interventions_client_signature_token_unique" UNIQUE("client_signature_token");