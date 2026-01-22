-- 장비 등록/수정 페이지 대대적 수정 마이그레이션
-- 작성일: 2026-01-21

-- ============================================
-- 1. Equipment 테이블 필드 추가
-- ============================================

-- 제조사 연락처
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS manufacturer_contact VARCHAR(100);

-- 최초 설치 위치
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS initial_location VARCHAR(100);

-- 설치 일시
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS installation_date TIMESTAMP;

-- 중간점검 정보 (3개 필드로 분리)
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS last_intermediate_check_date TIMESTAMP;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS intermediate_check_cycle INTEGER;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS next_intermediate_check_date TIMESTAMP;

-- ============================================
-- 2. 위치 변동 이력 테이블 생성
-- ============================================

CREATE TABLE IF NOT EXISTS equipment_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id VARCHAR(36) NOT NULL,
  changed_at TIMESTAMP NOT NULL,
  new_location VARCHAR(100) NOT NULL,
  notes TEXT,
  changed_by VARCHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_location_history_equipment
    FOREIGN KEY (equipment_id)
    REFERENCES equipment(uuid)
    ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_location_history_equipment_id ON equipment_location_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_location_history_changed_at ON equipment_location_history(changed_at DESC);

-- ============================================
-- 3. 유지보수 내역 테이블 생성
-- ============================================

CREATE TABLE IF NOT EXISTS equipment_maintenance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id VARCHAR(36) NOT NULL,
  performed_at TIMESTAMP NOT NULL,
  content TEXT NOT NULL,
  performed_by VARCHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_maintenance_history_equipment
    FOREIGN KEY (equipment_id)
    REFERENCES equipment(uuid)
    ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_maintenance_history_equipment_id ON equipment_maintenance_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_performed_at ON equipment_maintenance_history(performed_at DESC);

-- ============================================
-- 4. 손상/오작동/변경/수리 내역 테이블 생성
-- ============================================

CREATE TABLE IF NOT EXISTS equipment_incident_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id VARCHAR(36) NOT NULL,
  occurred_at TIMESTAMP NOT NULL,
  incident_type VARCHAR(50) NOT NULL, -- damage, malfunction, change, repair
  content TEXT NOT NULL,
  reported_by VARCHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_incident_history_equipment
    FOREIGN KEY (equipment_id)
    REFERENCES equipment(uuid)
    ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_incident_history_equipment_id ON equipment_incident_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_incident_history_occurred_at ON equipment_incident_history(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_history_type ON equipment_incident_history(incident_type);

-- ============================================
-- 5. 코멘트 추가
-- ============================================

COMMENT ON TABLE equipment_location_history IS '장비 위치 변동 이력';
COMMENT ON TABLE equipment_maintenance_history IS '장비 유지보수 내역';
COMMENT ON TABLE equipment_incident_history IS '장비 손상/오작동/변경/수리 내역';

COMMENT ON COLUMN equipment.manufacturer_contact IS '제조사 연락처';
COMMENT ON COLUMN equipment.initial_location IS '최초 설치 위치';
COMMENT ON COLUMN equipment.installation_date IS '설치 일시';
COMMENT ON COLUMN equipment.last_intermediate_check_date IS '최종 중간 점검일';
COMMENT ON COLUMN equipment.intermediate_check_cycle IS '중간점검 주기 (개월)';
COMMENT ON COLUMN equipment.next_intermediate_check_date IS '차기 중간 점검일';
