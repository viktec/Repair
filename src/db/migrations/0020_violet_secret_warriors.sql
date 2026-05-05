CREATE TABLE "contract_check_visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"contract_id" uuid NOT NULL,
	"preferred_date1" timestamp NOT NULL,
	"preferred_date2" timestamp,
	"scheduled_at" timestamp,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"client_notes" text,
	"admin_notes" text,
	"opened_by" varchar(20) DEFAULT 'client' NOT NULL,
	"confirmed_by_client" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_contracts" ADD COLUMN "free_visits_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_contracts" ADD COLUMN "free_visits_per_period" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_contracts" ADD COLUMN "free_visit_period_months" integer DEFAULT 6 NOT NULL;--> statement-breakpoint
ALTER TABLE "contract_check_visits" ADD CONSTRAINT "contract_check_visits_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_check_visits" ADD CONSTRAINT "contract_check_visits_contract_id_customer_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."customer_contracts"("id") ON DELETE cascade ON UPDATE no action;