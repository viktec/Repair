CREATE TYPE "public"."appraisal_intent" AS ENUM('sell', 'trade_in', 'both');--> statement-breakpoint
CREATE TYPE "public"."appraisal_status" AS ENUM('draft', 'survey_sent', 'survey_completed', 'ai_evaluated', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."battery_health_level" AS ENUM('great', 'good', 'fair', 'poor');--> statement-breakpoint
CREATE TYPE "public"."body_condition" AS ENUM('excellent', 'good', 'fair', 'poor');--> statement-breakpoint
CREATE TYPE "public"."screen_condition" AS ENUM('perfect', 'minor_scratches', 'cracked', 'shattered');--> statement-breakpoint
CREATE TABLE "device_appraisals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"survey_token" varchar(64) NOT NULL,
	"status" "appraisal_status" DEFAULT 'draft' NOT NULL,
	"brand" varchar(100) NOT NULL,
	"model" varchar(100) NOT NULL,
	"storage_gb" varchar(20),
	"color" varchar(50),
	"imei" varchar(20),
	"intent" "appraisal_intent",
	"works" boolean,
	"screen_condition" "screen_condition",
	"body_condition" "body_condition",
	"battery_health" "battery_health_level",
	"purchase_year" integer,
	"has_charger" boolean DEFAULT false NOT NULL,
	"has_original_box" boolean DEFAULT false NOT NULL,
	"customer_expected_cents" integer,
	"customer_notes" text,
	"survey_completed_at" timestamp,
	"ai_valuation_cents" integer,
	"ai_reasoning" text,
	"ai_evaluated_at" timestamp,
	"final_valuation_cents" integer,
	"trade_in_bonus_cents" integer DEFAULT 0 NOT NULL,
	"admin_notes" text,
	"approved_at" timestamp,
	"approved_by" uuid,
	"customer_id" uuid,
	"customer_name" varchar(255),
	"customer_phone" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "device_appraisals_survey_token_unique" UNIQUE("survey_token")
);
--> statement-breakpoint
ALTER TABLE "device_appraisals" ADD CONSTRAINT "device_appraisals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_appraisals" ADD CONSTRAINT "device_appraisals_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_appraisals" ADD CONSTRAINT "device_appraisals_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;