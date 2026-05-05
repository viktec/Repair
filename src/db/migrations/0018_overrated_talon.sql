CREATE TABLE "customer_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"package_id" uuid,
	"contract_number" varchar(20) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"total_minutes" integer NOT NULL,
	"used_minutes" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"client_portal_token" varchar(64) NOT NULL,
	"package_snapshot" jsonb,
	"notes" text,
	"signed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_contracts_client_portal_token_unique" UNIQUE("client_portal_token")
);
--> statement-breakpoint
CREATE TABLE "support_interventions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"intervention_number" varchar(20) NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"type" varchar(20) DEFAULT 'onsite' NOT NULL,
	"is_urgent" boolean DEFAULT false NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"raw_minutes" integer DEFAULT 0 NOT NULL,
	"billable_minutes" integer DEFAULT 0 NOT NULL,
	"technician_id" uuid,
	"technician_name" varchar(100),
	"status" varchar(20) DEFAULT 'completed' NOT NULL,
	"opened_by" varchar(20) DEFAULT 'technician' NOT NULL,
	"photos" text[] DEFAULT '{}',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"total_minutes" integer NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"urgency_surcharge_percent" integer DEFAULT 0 NOT NULL,
	"priority_level" integer DEFAULT 4 NOT NULL,
	"phone_rounding_minutes" integer DEFAULT 5 NOT NULL,
	"remote_rounding_minutes" integer DEFAULT 10 NOT NULL,
	"email_rounding_minutes" integer DEFAULT 10 NOT NULL,
	"call_fee_minutes" integer DEFAULT 10 NOT NULL,
	"delivery_fee_minutes" integer DEFAULT 0 NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_contracts" ADD CONSTRAINT "customer_contracts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_contracts" ADD CONSTRAINT "customer_contracts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_contracts" ADD CONSTRAINT "customer_contracts_package_id_support_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."support_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_interventions" ADD CONSTRAINT "support_interventions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_interventions" ADD CONSTRAINT "support_interventions_contract_id_customer_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."customer_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_interventions" ADD CONSTRAINT "support_interventions_technician_id_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_packages" ADD CONSTRAINT "support_packages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;