ALTER TABLE "equipment" ADD COLUMN "deputy_manager_id" uuid;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_deputy_manager_id_users_id_fk" FOREIGN KEY ("deputy_manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "equipment_deputy_manager_id_idx" ON "equipment" USING btree ("deputy_manager_id");