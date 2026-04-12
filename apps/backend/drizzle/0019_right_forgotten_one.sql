ALTER TABLE "calibration_factors" DROP CONSTRAINT "calibration_factors_approved_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "non_conformances" DROP CONSTRAINT "non_conformances_corrected_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "non_conformances" DROP CONSTRAINT "non_conformances_closed_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "non_conformances" DROP CONSTRAINT "non_conformances_rejected_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "calibration_factors" ADD CONSTRAINT "calibration_factors_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "non_conformances" ADD CONSTRAINT "non_conformances_corrected_by_users_id_fk" FOREIGN KEY ("corrected_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "non_conformances" ADD CONSTRAINT "non_conformances_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "non_conformances" ADD CONSTRAINT "non_conformances_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;