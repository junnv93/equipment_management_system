-- Migration: FK 참조 무결성 + CAS 인덱스 + 조회 최적화 인덱스 추가
-- Date: 2026-03-19
-- Purpose: 아키텍처 리뷰에서 발견된 DB 무결성/성능 이슈 일괄 수정
--
-- 변경 사항:
-- 1. FK 제약조건 추가 (calibrations, non_conformances, software_history, equipment)
-- 2. CAS 복합 인덱스 추가 (disposal_requests)
-- 3. 조회 최적화 인덱스 추가 (non_conformances, audit_logs)
-- 4. equipment.manager_id 컬럼 타입 변경 (varchar → uuid + FK)

-- ============================================================================
-- 1. FK 제약조건 추가
-- ============================================================================

-- calibrations.equipment_id → equipment.id (교정 기록은 장비 삭제 시 보존)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'calibrations_equipment_id_equipment_id_fk'
      AND table_name = 'calibrations'
  ) THEN
    ALTER TABLE calibrations
      ADD CONSTRAINT calibrations_equipment_id_equipment_id_fk
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- non_conformances.equipment_id → equipment.id (부적합 기록은 영구 보관)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'non_conformances_equipment_id_equipment_id_fk'
      AND table_name = 'non_conformances'
  ) THEN
    ALTER TABLE non_conformances
      ADD CONSTRAINT non_conformances_equipment_id_equipment_id_fk
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- software_history.equipment_id → equipment.id (소프트웨어 이력은 영구 보관)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'software_history_equipment_id_equipment_id_fk'
      AND table_name = 'software_history'
  ) THEN
    ALTER TABLE software_history
      ADD CONSTRAINT software_history_equipment_id_equipment_id_fk
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- equipment.manager_id → users.id (관리자 삭제 시 null로 설정)
-- ⚠️ 기존 manager_id는 varchar(36)이므로 타입 변환 필요
-- 먼저 orphan 데이터 정리 (존재하지 않는 user 참조 → null)
UPDATE equipment
SET manager_id = NULL
WHERE manager_id IS NOT NULL
  AND manager_id::uuid NOT IN (SELECT id FROM users);

-- varchar → uuid 타입 변환 (FK 추가를 위한 선행 조건)
ALTER TABLE equipment
  ALTER COLUMN manager_id TYPE uuid USING manager_id::uuid;

-- FK 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'equipment_manager_id_users_id_fk'
      AND table_name = 'equipment'
  ) THEN
    ALTER TABLE equipment
      ADD CONSTRAINT equipment_manager_id_users_id_fk
      FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- calibrations.technician_id → users.id (교정 담당자 삭제 시 null)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'calibrations_technician_id_users_id_fk'
      AND table_name = 'calibrations'
  ) THEN
    ALTER TABLE calibrations
      ADD CONSTRAINT calibrations_technician_id_users_id_fk
      FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- calibration_factors.equipment_id → equipment.id (교정인자는 장비 삭제 시 보존)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'calibration_factors_equipment_id_equipment_id_fk'
      AND table_name = 'calibration_factors'
  ) THEN
    ALTER TABLE calibration_factors
      ADD CONSTRAINT calibration_factors_equipment_id_equipment_id_fk
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- calibration_factors.calibration_id → calibrations.id (교정 기록 연결)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'calibration_factors_calibration_id_calibrations_id_fk'
      AND table_name = 'calibration_factors'
  ) THEN
    ALTER TABLE calibration_factors
      ADD CONSTRAINT calibration_factors_calibration_id_calibrations_id_fk
      FOREIGN KEY (calibration_id) REFERENCES calibrations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- teams.leader_id → users.id (팀장 삭제 시 null)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'teams_leader_id_users_id_fk'
      AND table_name = 'teams'
  ) THEN
    ALTER TABLE teams
      ADD CONSTRAINT teams_leader_id_users_id_fk
      FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- 2. CAS 복합 인덱스 (WHERE id = ? AND version = ? 최적화)
-- ============================================================================

CREATE INDEX IF NOT EXISTS disposal_requests_id_version_idx
  ON disposal_requests(id, version);

-- ============================================================================
-- 3. 조회 최적화 인덱스
-- ============================================================================

-- non_conformances: ORDER BY created_at DESC 최적화
CREATE INDEX IF NOT EXISTS non_conformances_created_at_idx
  ON non_conformances(created_at);

-- audit_logs: WHERE entity_type = ? AND entity_id = ? 복합 조회 최적화
CREATE INDEX IF NOT EXISTS audit_logs_entity_type_entity_id_idx
  ON audit_logs(entity_type, entity_id);

-- ============================================================================
-- 4. equipment_location_history 인덱스 (전무 → 추가)
-- ============================================================================

-- 장비별 위치 이력 조회 최적화
CREATE INDEX IF NOT EXISTS equipment_location_history_equipment_id_idx
  ON equipment_location_history(equipment_id);

-- 시간순 정렬 최적화
CREATE INDEX IF NOT EXISTS equipment_location_history_changed_at_idx
  ON equipment_location_history(changed_at);

-- 장비별 + 시간순 복합 인덱스 (가장 빈번한 쿼리 패턴)
CREATE INDEX IF NOT EXISTS equipment_location_history_equipment_changed_at_idx
  ON equipment_location_history(equipment_id, changed_at);
