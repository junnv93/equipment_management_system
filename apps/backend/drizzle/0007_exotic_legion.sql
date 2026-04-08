ALTER TABLE "audit_logs" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
-- Backfill: orphan user_id → NULL so the FK constraint can be added safely
UPDATE "audit_logs" SET "user_id" = NULL WHERE "user_id" IS NOT NULL AND "user_id" NOT IN (SELECT "id" FROM "users");--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;