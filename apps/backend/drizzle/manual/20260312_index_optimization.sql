-- =============================================================================
-- 인덱스 최적화 마이그레이션 (2026-03-12)
-- =============================================================================
-- 목적: 중복 인덱스 제거 + 신규 성능 인덱스 추가
-- 실행: docker compose exec -T postgres psql -U postgres -d equipment_management < 20260312_index_optimization.sql
-- 참고: CONCURRENTLY 사용 → 트랜잭션 외부에서 실행 필요
-- =============================================================================

-- ─── 1. 중복 인덱스 제거 ────────────────────────────────────────────────────

-- calibrations_equipment_id_idx: calibrations_equipment_approval_idx(equipment_id, approval_status) leading prefix
DROP INDEX IF EXISTS calibrations_equipment_id_idx;

-- users_role_idx: users_role_site_idx(role, site) leading prefix
DROP INDEX IF EXISTS users_role_idx;

-- condition_checks_step_idx: 4값 저선택도, 단독 쿼리 없음
DROP INDEX IF EXISTS condition_checks_step_idx;

-- ─── 2. 신규 인덱스 추가 (스키마에 이미 정의되어 있으나 DB에 없는 경우) ──────

-- calibrations 테이블
CREATE INDEX CONCURRENTLY IF NOT EXISTS calibrations_status_idx ON calibrations(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS calibrations_approval_status_idx ON calibrations(approval_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS calibrations_next_calibration_date_idx ON calibrations(next_calibration_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS calibrations_calibration_date_idx ON calibrations(calibration_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS calibrations_registered_by_idx ON calibrations(registered_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS calibrations_equipment_approval_idx ON calibrations(equipment_id, approval_status);

-- condition_checks 테이블
CREATE INDEX CONCURRENTLY IF NOT EXISTS condition_checks_checkout_id_idx ON condition_checks(checkout_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS condition_checks_checked_by_idx ON condition_checks(checked_by);

-- users 테이블
CREATE INDEX CONCURRENTLY IF NOT EXISTS users_site_idx ON users(site);
CREATE INDEX CONCURRENTLY IF NOT EXISTS users_team_id_idx ON users(team_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS users_role_site_idx ON users(role, site);
