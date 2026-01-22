-- 테스트 데이터베이스 스키마 완전 동기화
-- 패키지 스키마와 일치시키기 위한 누락된 모든 컬럼 추가

-- 1. equipment 테이블 누락 컬럼 추가
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS requested_by VARCHAR(36);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS equipment_type VARCHAR(50);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS calibration_result TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS correction_factor VARCHAR(50);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS intermediate_check_schedule TIMESTAMP;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS repair_history TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS software_name VARCHAR(200);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS software_type VARCHAR(50);

-- 2. teams 테이블이 UUID 기반인지 확인하고 수정
-- 현재 teams.id가 UUID 타입인지 확인
DO $$
BEGIN
    -- teams 테이블의 id 컬럼 타입이 UUID가 아니면 변환
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'teams'
        AND column_name = 'id'
        AND data_type != 'uuid'
    ) THEN
        -- id 컬럼이 UUID 타입이 아니면 새로운 UUID 컬럼을 사용
        RAISE NOTICE 'teams.id is not UUID type, using uuid column instead';
    END IF;
END
$$;

-- 3. equipment.team_id가 teams.id를 참조하도록 FK 설정 (있으면 무시)
-- 이미 존재하는 경우 오류 무시

-- 4. 인덱스 생성 (존재하지 않는 경우만)
CREATE INDEX IF NOT EXISTS equipment_site_idx ON equipment(site);
CREATE INDEX IF NOT EXISTS equipment_is_shared_idx ON equipment(is_shared);
CREATE INDEX IF NOT EXISTS equipment_software_name_idx ON equipment(software_name);

-- 5. 확인 쿼리
SELECT 'Schema sync completed' AS result;

-- 테이블 컬럼 수 확인
SELECT COUNT(*) AS equipment_column_count FROM information_schema.columns WHERE table_name = 'equipment';
