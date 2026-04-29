ALTER TABLE "organizations" ADD COLUMN "telegram_bot_token" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "telegram_chat_id" varchar(100);