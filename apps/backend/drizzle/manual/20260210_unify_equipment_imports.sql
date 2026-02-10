-- ============================================================================
-- Migration: Unify Equipment Imports (Rental + Internal Shared)
-- Date: 2026-02-10
-- Description:
--   통합 장비 반입 시스템 구현을 위한 테이블 구조 변경
--   - rental_imports → equipment_imports (테이블 이름 변경)
--   - source_type 필드 추가 (discriminator: 'rental' | 'internal_shared')
--   - 내부 공용장비 전용 필드 추가 (owner_department, internal_contact, borrowing_justification)
--   - Vendor 필드 nullable 변경 (internal_shared는 vendor 정보 불필요)
--   - 조건부 validation 제약조건 추가
-- ============================================================================

BEGIN;

-- Step 1: source_type 필드 추가 (discriminator)
ALTER TABLE rental_imports
ADD COLUMN source_type VARCHAR(30) NOT NULL DEFAULT 'rental';

-- Step 2: 기존 데이터 backfill (모든 기존 데이터는 'rental' 타입)
UPDATE rental_imports SET source_type = 'rental' WHERE source_type IS NULL;

-- Step 3: Vendor 필드 nullable 변경 (internal_shared는 vendor 불필요)
ALTER TABLE rental_imports
ALTER COLUMN vendor_name DROP NOT NULL;

-- Step 4: 내부 공용장비 전용 필드 추가
ALTER TABLE rental_imports
ADD COLUMN owner_department VARCHAR(100),      -- 소유 부서 (예: Safety Lab, Battery Lab)
ADD COLUMN internal_contact VARCHAR(100),       -- 내부 담당자 연락처
ADD COLUMN borrowing_justification TEXT;        -- 상세 반입 사유 (내부 공용장비용)

-- Step 5: 조건부 validation 제약조건 추가
-- rental: vendorName 필수
-- internal_shared: ownerDepartment 필수
ALTER TABLE rental_imports
ADD CONSTRAINT check_equipment_import_source_type_fields
  CHECK (
    (source_type = 'rental' AND vendor_name IS NOT NULL) OR
    (source_type = 'internal_shared' AND owner_department IS NOT NULL)
  );

-- Step 6: 테이블 이름 변경
ALTER TABLE rental_imports RENAME TO equipment_imports;

-- Step 7: 인덱스 이름 변경 (rental_imports_* → equipment_imports_*)
ALTER INDEX IF EXISTS rental_imports_status_idx RENAME TO equipment_imports_status_idx;
ALTER INDEX IF EXISTS rental_imports_requester_id_idx RENAME TO equipment_imports_requester_id_idx;
ALTER INDEX IF EXISTS rental_imports_team_id_idx RENAME TO equipment_imports_team_id_idx;
ALTER INDEX IF EXISTS rental_imports_site_idx RENAME TO equipment_imports_site_idx;
ALTER INDEX IF EXISTS rental_imports_created_at_idx RENAME TO equipment_imports_created_at_idx;

-- Step 8: source_type 인덱스 추가 (필터링 성능 향상)
CREATE INDEX equipment_imports_source_type_idx ON equipment_imports(source_type);

-- Step 9: 복합 인덱스 추가 (상태+출처 조합 필터링)
CREATE INDEX equipment_imports_status_source_type_idx ON equipment_imports(status, source_type);

COMMIT;

-- ============================================================================
-- Rollback Script (if needed)
-- ============================================================================
-- BEGIN;
-- DROP INDEX IF EXISTS equipment_imports_status_source_type_idx;
-- DROP INDEX IF EXISTS equipment_imports_source_type_idx;
-- ALTER INDEX IF EXISTS equipment_imports_created_at_idx RENAME TO rental_imports_created_at_idx;
-- ALTER INDEX IF EXISTS equipment_imports_site_idx RENAME TO rental_imports_site_idx;
-- ALTER INDEX IF EXISTS equipment_imports_team_id_idx RENAME TO rental_imports_team_id_idx;
-- ALTER INDEX IF EXISTS equipment_imports_requester_id_idx RENAME TO rental_imports_requester_id_idx;
-- ALTER INDEX IF EXISTS equipment_imports_status_idx RENAME TO rental_imports_status_idx;
-- ALTER TABLE equipment_imports RENAME TO rental_imports;
-- ALTER TABLE rental_imports DROP CONSTRAINT IF EXISTS check_equipment_import_source_type_fields;
-- ALTER TABLE rental_imports DROP COLUMN IF EXISTS borrowing_justification;
-- ALTER TABLE rental_imports DROP COLUMN IF EXISTS internal_contact;
-- ALTER TABLE rental_imports DROP COLUMN IF EXISTS owner_department;
-- ALTER TABLE rental_imports ALTER COLUMN vendor_name SET NOT NULL;
-- ALTER TABLE rental_imports DROP COLUMN IF EXISTS source_type;
-- COMMIT;
