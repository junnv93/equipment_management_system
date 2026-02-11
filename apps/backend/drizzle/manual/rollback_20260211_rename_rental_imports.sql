-- rollback: equipment_imports → rental_imports + 신규 컬럼 제거

-- Step 1: 인덱스 제거
DROP INDEX IF EXISTS equipment_imports_status_source_type_idx;
DROP INDEX IF EXISTS equipment_imports_source_type_idx;

-- Step 2: 신규 컬럼 제거
ALTER TABLE equipment_imports DROP COLUMN IF EXISTS borrowing_justification;
ALTER TABLE equipment_imports DROP COLUMN IF EXISTS internal_contact;
ALTER TABLE equipment_imports DROP COLUMN IF EXISTS owner_department;
ALTER TABLE equipment_imports DROP COLUMN IF EXISTS source_type;

-- Step 3: 테이블 리네임 롤백
ALTER TABLE equipment_imports RENAME TO rental_imports;
