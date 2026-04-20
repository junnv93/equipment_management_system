-- 소프트웨어별 유효성 확인 목록 필터 쿼리 성능 개선
-- WHERE test_software_id = $1 AND status = $2 패턴에 최적화

CREATE INDEX IF NOT EXISTS "software_validations_test_software_id_status_idx"
  ON "software_validations" (test_software_id, status);
