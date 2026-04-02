-- equipment.id FK ON DELETE 정책 통일: cascade → restrict
-- UL-QP-18 기준 이력 보존 원칙 적용
-- 소프트 삭제(isActive=false)만 사용하므로 실제 트리거되지 않으나, 방어적 설계

-- 1. disposal_requests
ALTER TABLE "disposal_requests" DROP CONSTRAINT IF EXISTS "disposal_requests_equipment_id_equipment_id_fk";
ALTER TABLE "disposal_requests" ADD CONSTRAINT "disposal_requests_equipment_id_equipment_id_fk"
  FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT;

-- 2. calibration_plan_items
ALTER TABLE "calibration_plan_items" DROP CONSTRAINT IF EXISTS "calibration_plan_items_equipment_id_equipment_id_fk";
ALTER TABLE "calibration_plan_items" ADD CONSTRAINT "calibration_plan_items_equipment_id_equipment_id_fk"
  FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT;

-- 3. equipment_location_history
ALTER TABLE "equipment_location_history" DROP CONSTRAINT IF EXISTS "equipment_location_history_equipment_id_equipment_id_fk";
ALTER TABLE "equipment_location_history" ADD CONSTRAINT "equipment_location_history_equipment_id_equipment_id_fk"
  FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT;

-- 4. repair_history
ALTER TABLE "repair_history" DROP CONSTRAINT IF EXISTS "repair_history_equipment_id_equipment_id_fk";
ALTER TABLE "repair_history" ADD CONSTRAINT "repair_history_equipment_id_equipment_id_fk"
  FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT;

-- 5. equipment_incident_history
ALTER TABLE "equipment_incident_history" DROP CONSTRAINT IF EXISTS "equipment_incident_history_equipment_id_equipment_id_fk";
ALTER TABLE "equipment_incident_history" ADD CONSTRAINT "equipment_incident_history_equipment_id_equipment_id_fk"
  FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT;

-- 6. equipment_maintenance_history
ALTER TABLE "equipment_maintenance_history" DROP CONSTRAINT IF EXISTS "equipment_maintenance_history_equipment_id_equipment_id_fk";
ALTER TABLE "equipment_maintenance_history" ADD CONSTRAINT "equipment_maintenance_history_equipment_id_equipment_id_fk"
  FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT;

-- 7. equipment_requests
ALTER TABLE "equipment_requests" DROP CONSTRAINT IF EXISTS "equipment_requests_equipment_id_equipment_id_fk";
ALTER TABLE "equipment_requests" ADD CONSTRAINT "equipment_requests_equipment_id_equipment_id_fk"
  FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT;

-- 8. equipment_attachments
ALTER TABLE "equipment_attachments" DROP CONSTRAINT IF EXISTS "equipment_attachments_equipment_id_equipment_id_fk";
ALTER TABLE "equipment_attachments" ADD CONSTRAINT "equipment_attachments_equipment_id_equipment_id_fk"
  FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT;

-- 9. documents
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_equipment_id_equipment_id_fk";
ALTER TABLE "documents" ADD CONSTRAINT "documents_equipment_id_equipment_id_fk"
  FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE RESTRICT;
