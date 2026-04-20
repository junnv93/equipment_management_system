-- calibration_plan_items.actual_calibration_id FK 추가
--
-- Phase 5a: 교정계획 항목과 실제 교정 기록을 연결하는 FK.
-- ON DELETE SET NULL — 교정 기록 삭제 시 계획 항목의 링크만 해제 (데이터 보존).
-- 인덱스: 역방향 조회(교정 기록 → 연결된 계획 항목) 최적화.

ALTER TABLE "calibration_plan_items"
  ADD COLUMN "actual_calibration_id" uuid
    REFERENCES "calibrations"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "calibration_plan_items_actual_calibration_id_idx"
  ON "calibration_plan_items" ("actual_calibration_id");
