ALTER TABLE "organizations" ADD COLUMN "legal_name" varchar(255);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "sdi_code" varchar(10);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "pec" varchar(255);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "province" varchar(5);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "operative_address" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "operative_city" varchar(100);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "operative_postal_code" varchar(20);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "operative_province" varchar(5);