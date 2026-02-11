-- 20260212_add_audit_logs_indexes.sql
-- B-4: audit_logs 테이블 쿼리 성능 인덱스 추가
-- append-only 테이블이므로 INSERT 성능 영향 최소화, 조회 성능 대폭 개선

-- 엔티티 타입별 시간순 조회 (WHERE entity_type = ? ORDER BY timestamp DESC)
CREATE INDEX IF NOT EXISTS audit_logs_entity_type_timestamp_idx
  ON audit_logs (entity_type, timestamp);

-- 액션별 시간순 조회 (WHERE action = ? ORDER BY timestamp DESC)
CREATE INDEX IF NOT EXISTS audit_logs_action_timestamp_idx
  ON audit_logs (action, timestamp);

-- 특정 엔티티 이력 조회 (WHERE entity_id = ?)
CREATE INDEX IF NOT EXISTS audit_logs_entity_id_idx
  ON audit_logs (entity_id);

-- 사용자별 감사 추적 (WHERE user_id = ? ORDER BY timestamp DESC)
CREATE INDEX IF NOT EXISTS audit_logs_user_id_timestamp_idx
  ON audit_logs (user_id, timestamp);
