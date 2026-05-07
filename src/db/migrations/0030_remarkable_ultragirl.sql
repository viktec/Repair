CREATE TYPE "public"."imei_check_status" AS ENUM('clean', 'blocked', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."purchase_method" AS ENUM('cash', 'card', 'carrier_plan', 'financing');--> statement-breakpoint
CREATE TYPE "public"."purchase_place" AS ENUM('physical', 'online');--> statement-breakpoint
ALTER TABLE "device_appraisals" ADD COLUMN "purchase_method" "purchase_method";--> statement-breakpoint
ALTER TABLE "device_appraisals" ADD COLUMN "purchase_place" "purchase_place";--> statement-breakpoint
ALTER TABLE "device_appraisals" ADD COLUMN "has_proof_of_purchase" boolean;--> statement-breakpoint
ALTER TABLE "device_appraisals" ADD COLUMN "battery_percentage" integer;--> statement-breakpoint
ALTER TABLE "device_appraisals" ADD COLUMN "imei_check_status" "imei_check_status";