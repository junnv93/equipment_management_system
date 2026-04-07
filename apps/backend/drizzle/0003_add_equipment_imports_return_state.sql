ALTER TABLE "equipment_imports" ADD COLUMN "usage_location" varchar(255);--> statement-breakpoint
ALTER TABLE "equipment_imports" ADD COLUMN "quantity_out" integer;--> statement-breakpoint
ALTER TABLE "equipment_imports" ADD COLUMN "quantity_returned" integer;--> statement-breakpoint
ALTER TABLE "equipment_imports" ADD COLUMN "returned_condition" jsonb;--> statement-breakpoint
ALTER TABLE "equipment_imports" ADD COLUMN "returned_abnormal_details" text;