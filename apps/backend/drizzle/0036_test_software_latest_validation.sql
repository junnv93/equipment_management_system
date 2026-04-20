-- test_software 유효성 확인 연계 컬럼
--
-- ISO/IEC 17025 §6.4.13 — 소프트웨어 버전 변경 시 재검증 의무
-- latest_validation_id: null = 미검증 또는 재검증 필요, uuid = 최신 검증 완료
-- latest_validated_at: 최근 품질 승인(quality_approved) 시각

ALTER TABLE "test_software"
  ADD COLUMN IF NOT EXISTS "latest_validation_id" uuid
    REFERENCES "software_validations"("id") ON DELETE SET NULL;

ALTER TABLE "test_software"
  ADD COLUMN IF NOT EXISTS "latest_validated_at" timestamp;
