-- equipment_maintenance_history 인덱스 추가
--
-- 장비 상세 페이지 수리이력 조회 성능 최적화
-- 고빈도 쿼리 패턴: WHERE equipment_id = ? ORDER BY performed_at DESC
--
-- 설계 원칙:
-- 1. (equipment_id, performed_at) 복합 인덱스 — leading prefix가 단일 equipment_id 인덱스를 커버
--    @see calibrations: calibrations_equipment_approval_idx 패턴과 동일 (별도 equipment_id 인덱스 불필요)
-- 2. performed_at 단독 인덱스 — equipment_id 없는 날짜 범위 쿼리용
--
-- CONCURRENTLY: 운영 중 테이블 잠금 없이 인덱스 생성 (zero-downtime)

CREATE INDEX CONCURRENTLY IF NOT EXISTS
  maintenance_history_equipment_performed_at_idx
ON equipment_maintenance_history (equipment_id, performed_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS
  maintenance_history_performed_at_idx
ON equipment_maintenance_history (performed_at);
