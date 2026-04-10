CREATE TABLE "inspection_document_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"inspection_item_id" uuid NOT NULL,
	"inspection_item_type" varchar(20) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "intermediate_inspection_id" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "self_inspection_id" uuid;--> statement-breakpoint
ALTER TABLE "self_inspection_items" ADD COLUMN "detailed_result" text;--> statement-breakpoint
ALTER TABLE "intermediate_inspection_items" ADD COLUMN "detailed_result" text;--> statement-breakpoint
ALTER TABLE "inspection_document_items" ADD CONSTRAINT "inspection_document_items_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inspection_document_items_item_idx" ON "inspection_document_items" USING btree ("inspection_item_id","inspection_item_type");--> statement-breakpoint
CREATE INDEX "inspection_document_items_document_id_idx" ON "inspection_document_items" USING btree ("document_id");--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_intermediate_inspection_id_intermediate_inspections_id_fk" FOREIGN KEY ("intermediate_inspection_id") REFERENCES "public"."intermediate_inspections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_self_inspection_id_equipment_self_inspections_id_fk" FOREIGN KEY ("self_inspection_id") REFERENCES "public"."equipment_self_inspections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_intermediate_inspection_id_idx" ON "documents" USING btree ("intermediate_inspection_id");--> statement-breakpoint
CREATE INDEX "documents_self_inspection_id_idx" ON "documents" USING btree ("self_inspection_id");