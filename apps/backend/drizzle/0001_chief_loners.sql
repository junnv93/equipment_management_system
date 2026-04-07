CREATE TABLE "form_template_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_template_id" uuid NOT NULL,
	"previous_form_number" varchar(30),
	"new_form_number" varchar(30) NOT NULL,
	"change_summary" text NOT NULL,
	"revised_by" uuid,
	"revised_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "form_templates" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "form_template_revisions" ADD CONSTRAINT "form_template_revisions_form_template_id_form_templates_id_fk" FOREIGN KEY ("form_template_id") REFERENCES "public"."form_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_template_revisions" ADD CONSTRAINT "form_template_revisions_revised_by_users_id_fk" FOREIGN KEY ("revised_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "form_template_revisions_form_template_id_idx" ON "form_template_revisions" USING btree ("form_template_id");