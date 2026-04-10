CREATE INDEX "calibration_plans_approved_by_idx" ON "calibration_plans" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "calibration_plans_reviewed_by_idx" ON "calibration_plans" USING btree ("reviewed_by");--> statement-breakpoint
CREATE INDEX "calibration_plans_rejected_by_idx" ON "calibration_plans" USING btree ("rejected_by");