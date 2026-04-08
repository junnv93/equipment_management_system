-- Orphan backfill: clear invalid references before enforcing FKs / type conversion
UPDATE "equipment" SET "requested_by" = NULL
  WHERE "requested_by" IS NOT NULL
    AND "requested_by" NOT IN (SELECT "id"::text FROM "users");--> statement-breakpoint
UPDATE "equipment" SET "approved_by" = NULL
  WHERE "approved_by" IS NOT NULL
    AND "approved_by" NOT IN (SELECT "id"::text FROM "users");--> statement-breakpoint
UPDATE "calibrations" SET "registered_by" = NULL
  WHERE "registered_by" IS NOT NULL
    AND "registered_by" NOT IN (SELECT "id" FROM "users");--> statement-breakpoint
UPDATE "calibrations" SET "approved_by" = NULL
  WHERE "approved_by" IS NOT NULL
    AND "approved_by" NOT IN (SELECT "id" FROM "users");--> statement-breakpoint
UPDATE "checkouts" SET "lender_team_id" = NULL
  WHERE "lender_team_id" IS NOT NULL
    AND "lender_team_id" NOT IN (SELECT "id" FROM "teams");--> statement-breakpoint
DELETE FROM "notification_preferences"
  WHERE "user_id" NOT IN (SELECT "id" FROM "users");--> statement-breakpoint
ALTER TABLE "equipment" ALTER COLUMN "requested_by" SET DATA TYPE uuid USING "requested_by"::uuid;--> statement-breakpoint
ALTER TABLE "equipment" ALTER COLUMN "approved_by" SET DATA TYPE uuid USING "approved_by"::uuid;--> statement-breakpoint
ALTER TABLE "calibrations" ADD CONSTRAINT "calibrations_registered_by_users_id_fk" FOREIGN KEY ("registered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibrations" ADD CONSTRAINT "calibrations_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_lender_team_id_teams_id_fk" FOREIGN KEY ("lender_team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
