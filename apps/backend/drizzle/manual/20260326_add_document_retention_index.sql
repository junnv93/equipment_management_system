-- 문서 물리 삭제(purge) 쿼리 최적화를 위한 복합 인덱스
-- WHERE status = 'deleted' AND updated_at < cutoff 조건에 사용
CREATE INDEX IF NOT EXISTS documents_status_updated_at_idx
  ON documents (status, updated_at);

-- documentRetentionDays 시스템 설정 시드 (기본값: 30일)
INSERT INTO system_settings (category, key, value)
VALUES ('system', 'documentRetentionDays', '30'::jsonb)
ON CONFLICT DO NOTHING;
