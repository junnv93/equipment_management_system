ALTER TABLE "non_conformances"
  ADD COLUMN IF NOT EXISTS "previous_equipment_status" varchar(30);
