CREATE INDEX "checkouts_approver_id_idx" ON "checkouts" USING btree ("approver_id");--> statement-breakpoint
CREATE INDEX "checkouts_returner_id_idx" ON "checkouts" USING btree ("returner_id");--> statement-breakpoint
CREATE INDEX "checkouts_return_approved_by_idx" ON "checkouts" USING btree ("return_approved_by");--> statement-breakpoint
CREATE INDEX "checkouts_lender_confirmed_by_idx" ON "checkouts" USING btree ("lender_confirmed_by");