CREATE TABLE "inspection_result_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inspection_id" uuid NOT NULL,
	"inspection_type" varchar(20) NOT NULL,
	"sort_order" integer NOT NULL,
	"section_type" varchar(20) NOT NULL,
	"title" varchar(200),
	"content" text,
	"table_data" jsonb,
	"document_id" uuid,
	"image_width_cm" numeric(4, 1),
	"image_height_cm" numeric(4, 1),
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inspection_result_sections" ADD CONSTRAINT "inspection_result_sections_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_result_sections" ADD CONSTRAINT "inspection_result_sections_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "irs_inspection_sort_idx" ON "inspection_result_sections" USING btree ("inspection_id","inspection_type","sort_order");