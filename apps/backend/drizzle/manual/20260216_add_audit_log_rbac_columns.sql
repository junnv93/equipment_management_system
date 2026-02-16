-- ============================================================================
-- 감사 로그 역할별 접근 범위(RBAC) 컬럼 추가
-- ============================================================================
-- 목적: 감사 로그의 역할별 데이터 스코프 필터링 지원
--   - lab_manager: userSite로 사이트 필터
--   - technical_manager: userTeamId로 팀 필터
--   - quality_manager / system_admin: 전체 접근
-- ============================================================================

-- 1. 컬럼 추가 (nullable — 기존 로그 호환)
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_site VARCHAR(10);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_team_id UUID;

-- 2. 인덱스 생성 (스코프 필터링 쿼리 최적화)
CREATE INDEX IF NOT EXISTS audit_logs_user_site_timestamp_idx
  ON audit_logs(user_site, timestamp);
CREATE INDEX IF NOT EXISTS audit_logs_user_team_id_timestamp_idx
  ON audit_logs(user_team_id, timestamp);

-- 3. Backfill (best-effort: 현재 사용자 정보로 과거 로그 보완)
-- 주의: 사용자가 팀/사이트를 변경했을 수 있으므로 100% 정확하지 않음
UPDATE audit_logs al
SET user_site = u.site, user_team_id = u.team_id
FROM users u
WHERE al.user_id = u.id AND al.user_site IS NULL;
