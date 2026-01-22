-- 테스트 데이터베이스 스키마 수정
-- 누락된 컬럼 추가

-- equipment 테이블에 누락된 컬럼 추가
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS asset_number VARCHAR(50);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS purchase_date TIMESTAMP;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS price INTEGER;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS supplier VARCHAR(100);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS contact_info VARCHAR(100);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS software_version VARCHAR(50);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS firmware_version VARCHAR(50);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS manual_location TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS accessories TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS main_features TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS technical_manager VARCHAR(100);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS manager_id VARCHAR(36);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS equipment_is_active_idx ON equipment(is_active);
CREATE INDEX IF NOT EXISTS equipment_team_status_idx ON equipment(team_id, status);

-- teams 테이블에 uuid 기본값 설정
UPDATE teams SET uuid = id::text WHERE uuid IS NULL;

-- 기존 데이터에 is_active 값 설정
UPDATE equipment SET is_active = TRUE WHERE is_active IS NULL;

SELECT 'Schema fix completed' AS result;
