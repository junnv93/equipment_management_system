CREATE TABLE "self_inspection_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inspection_id" uuid NOT NULL,
	"item_number" integer NOT NULL,
	"check_item" varchar(300) NOT NULL,
	"check_result" varchar(10) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "equipment_self_inspections" ADD COLUMN "special_notes" jsonb;--> statement-breakpoint
ALTER TABLE "self_inspection_items" ADD CONSTRAINT "self_inspection_items_inspection_id_equipment_self_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."equipment_self_inspections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "self_inspection_items_inspection_id_idx" ON "self_inspection_items" USING btree ("inspection_id");