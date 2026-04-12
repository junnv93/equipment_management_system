ALTER TABLE "calibration_factors" ADD CONSTRAINT "calibration_factors_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibration_factors" ADD CONSTRAINT "calibration_factors_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "non_conformances" ADD CONSTRAINT "non_conformances_discovered_by_users_id_fk" FOREIGN KEY ("discovered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "non_conformances" ADD CONSTRAINT "non_conformances_corrected_by_users_id_fk" FOREIGN KEY ("corrected_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "non_conformances" ADD CONSTRAINT "non_conformances_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "non_conformances" ADD CONSTRAINT "non_conformances_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_history" ADD CONSTRAINT "repair_history_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_history" ADD CONSTRAINT "repair_history_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calibration_factors_requested_by_idx" ON "calibration_factors" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "calibration_factors_approved_by_idx" ON "calibration_factors" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "non_conformances_discovered_by_idx" ON "non_conformances" USING btree ("discovered_by");--> statement-breakpoint
CREATE INDEX "non_conformances_corrected_by_idx" ON "non_conformances" USING btree ("corrected_by");--> statement-breakpoint
CREATE INDEX "non_conformances_closed_by_idx" ON "non_conformances" USING btree ("closed_by");--> statement-breakpoint
CREATE INDEX "non_conformances_rejected_by_idx" ON "non_conformances" USING btree ("rejected_by");--> statement-breakpoint
CREATE INDEX "repair_history_created_by_idx" ON "repair_history" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "repair_history_deleted_by_idx" ON "repair_history" USING btree ("deleted_by");