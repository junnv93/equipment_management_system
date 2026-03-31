-- TOCTOU 방지: 동일 장비 + 동일 NC 타입에 open 상태 중복 차단
-- CalibrationOverdueScheduler hot-reload 시 동시 실행으로 중복 NC 생성 방지
--
-- Partial unique index: status='open' AND deleted_at IS NULL 인 행에만 적용
-- → closed/corrected 이력은 제약 없이 다수 존재 가능
-- → 같은 장비에 같은 타입의 open NC는 최대 1건

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS
  non_conformances_equipment_nc_type_open_unique
ON non_conformances (equipment_id, nc_type)
WHERE status = 'open' AND deleted_at IS NULL;
