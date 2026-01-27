-- ============================================================================
-- 관리번호 체계 개선 마이그레이션
-- 관리번호 형식: XXX-XYYYY (시험소코드 3자리 - 분류코드 1자리 + 일련번호 4자리)
-- 예: SUW-E0001, UIW-R0002, PYT-S0001
-- ============================================================================

-- 1. 새 컬럼 추가 (존재하지 않는 경우에만)
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS site_code VARCHAR(3);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS classification_code VARCHAR(1);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS management_serial_number INTEGER;

-- 2. 기존 데이터 파싱하여 새 컬럼 채우기
-- 관리번호 형식이 맞는 데이터만 업데이트
UPDATE equipment SET
  site_code = SUBSTRING(management_number FROM 1 FOR 3),
  classification_code = SUBSTRING(management_number FROM 5 FOR 1),
  management_serial_number = CAST(SUBSTRING(management_number FROM 6) AS INTEGER)
WHERE management_number ~ '^(SUW|UIW|PYT)-[ERWSAP]\d{4}$'
  AND site_code IS NULL;

-- 3. 인덱스 생성 (존재하지 않는 경우에만)
CREATE INDEX IF NOT EXISTS idx_equipment_site_code ON equipment(site_code);
CREATE INDEX IF NOT EXISTS idx_equipment_classification_code ON equipment(classification_code);

-- 4. 복합 인덱스 (사이트코드 + 분류코드로 빠른 검색)
CREATE INDEX IF NOT EXISTS idx_equipment_site_classification ON equipment(site_code, classification_code);

-- 5. 제약 조건 추가 (선택적 - 새 데이터 입력 시 검증)
-- site_code는 SUW, UIW, PYT 중 하나여야 함
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS chk_site_code;
ALTER TABLE equipment ADD CONSTRAINT chk_site_code
  CHECK (site_code IS NULL OR site_code IN ('SUW', 'UIW', 'PYT'));

-- classification_code는 E, R, W, S, A, P 중 하나여야 함
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS chk_classification_code;
ALTER TABLE equipment ADD CONSTRAINT chk_classification_code
  CHECK (classification_code IS NULL OR classification_code IN ('E', 'R', 'W', 'S', 'A', 'P'));

-- management_serial_number는 1~9999 범위여야 함
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS chk_management_serial_number;
ALTER TABLE equipment ADD CONSTRAINT chk_management_serial_number
  CHECK (management_serial_number IS NULL OR (management_serial_number >= 1 AND management_serial_number <= 9999));

-- 6. 코멘트 추가
COMMENT ON COLUMN equipment.site_code IS '시험소코드: SUW(수원), UIW(의왕), PYT(평택)';
COMMENT ON COLUMN equipment.classification_code IS '분류코드: E(FCC EMC/RF), R(General EMC), W(General RF), S(SAR), A(Automotive EMC), P(Software)';
COMMENT ON COLUMN equipment.management_serial_number IS '일련번호: 1~9999';

-- ============================================================================
-- 검증 쿼리 (실행 후 확인용)
-- ============================================================================
-- SELECT
--   management_number,
--   site_code,
--   classification_code,
--   management_serial_number
-- FROM equipment
-- WHERE site_code IS NOT NULL
-- ORDER BY site_code, classification_code, management_serial_number;
