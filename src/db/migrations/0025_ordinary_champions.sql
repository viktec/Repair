ALTER TABLE "suppliers" ADD COLUMN "payment_terms" text;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "assigned_user_id" uuid;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "assigned_user_name" varchar(255);--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;