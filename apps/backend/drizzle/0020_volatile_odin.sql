ALTER TABLE "calibration_factors" DROP CONSTRAINT "calibration_factors_calibration_id_calibrations_id_fk";
--> statement-breakpoint
ALTER TABLE "non_conformances" DROP CONSTRAINT "non_conformances_discovered_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "calibration_factors" ADD CONSTRAINT "calibration_factors_calibration_id_calibrations_id_fk" FOREIGN KEY ("calibration_id") REFERENCES "public"."calibrations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "non_conformances" ADD CONSTRAINT "non_conformances_discovered_by_users_id_fk" FOREIGN KEY ("discovered_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;