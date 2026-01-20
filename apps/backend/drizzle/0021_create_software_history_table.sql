-- Migration: 0021_create_software_history_table
-- Description: Create software_history table for tracking software version changes
-- Related: Prompt 9-1 (소프트웨어 관리대장)

-- Create software_history table
CREATE TABLE IF NOT EXISTS "software_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "equipment_id" uuid NOT NULL,
  "software_name" varchar(200) NOT NULL,
  "previous_version" varchar(50),
  "new_version" varchar(50) NOT NULL,
  "changed_at" timestamp DEFAULT now() NOT NULL,
  "changed_by" uuid NOT NULL,
  "verification_record" text NOT NULL,
  "approval_status" varchar(20) DEFAULT 'pending' NOT NULL,
  "approved_by" uuid,
  "approved_at" timestamp,
  "approver_comment" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for software_history table
CREATE INDEX IF NOT EXISTS "software_history_equipment_id_idx" ON "software_history" ("equipment_id");
CREATE INDEX IF NOT EXISTS "software_history_software_name_idx" ON "software_history" ("software_name");
CREATE INDEX IF NOT EXISTS "software_history_approval_status_idx" ON "software_history" ("approval_status");
CREATE INDEX IF NOT EXISTS "software_history_changed_at_idx" ON "software_history" ("changed_at");
CREATE INDEX IF NOT EXISTS "software_history_equipment_software_idx" ON "software_history" ("equipment_id", "software_name", "changed_at");
