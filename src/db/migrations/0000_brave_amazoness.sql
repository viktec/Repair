CREATE TYPE "public"."plan" AS ENUM('solo', 'pro', 'business');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('owner', 'admin', 'technician', 'front_desk');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trial', 'active', 'past_due', 'canceled');--> statement-breakpoint
CREATE TABLE "memberships" (
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" "role" DEFAULT 'owner' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_user_id_organization_id_pk" PRIMARY KEY("user_id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"plan" "plan" DEFAULT 'solo' NOT NULL,
	"branding_logo_url" text,
	"branding_primary_color" varchar(7) DEFAULT '#0D8F7A',
	"phone" varchar(50),
	"address" text,
	"city" varchar(100),
	"postal_code" varchar(20),
	"vat_number" varchar(20),
	"subscription_status" "subscription_status" DEFAULT 'trial' NOT NULL,
	"trial_ends_at" timestamp,
	"onboarding_completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text,
	"phone" varchar(50),
	"email" varchar(255),
	"is_default" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"password_hash" text,
	"email_verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;