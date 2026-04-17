-- 자체점검 snapshot 컬럼 추가 (UL-QP-18-05 양식 헤더 매핑)
--
-- Gap: 양식 헤더의 "분류" / "교정유효기간"이 장비 마스터(equipment.calibrationRequired)를
-- runtime 조회하여 재교정 후 과거 기록 drift 위험.
-- Fix: 점검 기록 시점 값을 snapshot으로 보존 (중간점검 동일 패턴 intermediate_inspections.ts L43~45).
--
-- Rollback 시: drop columns (데이터 손실 허용 — snapshot 없어도 runtime fallback 가능).

ALTER TABLE "equipment_self_inspections"
  ADD COLUMN "classification" varchar(20);

ALTER TABLE "equipment_self_inspections"
  ADD COLUMN "calibration_validity_period" varchar(50);
