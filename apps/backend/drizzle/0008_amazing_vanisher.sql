ALTER TABLE "form_templates" DROP CONSTRAINT "form_templates_uploaded_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "form_templates" ADD CONSTRAINT "form_templates_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;