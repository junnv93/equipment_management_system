-- Migration: inspection export + deputy manager support
-- Adds signature_image_path, deputy_manager_id, form_templates table,
-- and renames calibration_method → management_method

ALTER TABLE "users" ADD COLUMN "signature_image_path" varchar(500);--> statement-breakpoint
ALTER TABLE "equipment" ADD COLUMN "deputy_manager_id" uuid;--> statement-breakpoint
ALTER TABLE "equipment" RENAME COLUMN "calibration_method" TO "management_method";--> statement-breakpoint
CREATE TABLE "form_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_number" varchar(20) NOT NULL,
	"version" integer NOT NULL DEFAULT 1,
	"storage_key" varchar(500) NOT NULL,
	"original_filename" varchar(300) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" integer NOT NULL,
	"is_active" boolean NOT NULL DEFAULT true,
	"uploaded_by" uuid,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "form_templates" ADD CONSTRAINT "form_templates_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "form_templates_form_number_idx" ON "form_templates" USING btree ("form_number");--> statement-breakpoint
CREATE UNIQUE INDEX "form_templates_active_idx" ON "form_templates" ("form_number") WHERE "is_active" = true;
