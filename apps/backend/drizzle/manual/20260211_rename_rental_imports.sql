-- rental_imports → equipment_imports 테이블 리네임 + 신규 컬럼 추가
-- Schema(packages/db/src/schema/equipment-imports.ts)와 일치시킴
-- Drizzle ORM은 pgTable('equipment_imports', ...) 사용 중이나 실제 DB는 rental_imports

-- Step 1: 테이블 리네임
ALTER TABLE rental_imports RENAME TO equipment_imports;

-- Step 2: 통합 스키마 신규 컬럼 추가 (rental + internal_shared 지원)
ALTER TABLE equipment_imports ADD COLUMN IF NOT EXISTS source_type varchar(30) NOT NULL DEFAULT 'rental';
ALTER TABLE equipment_imports ADD COLUMN IF NOT EXISTS owner_department varchar(100);
ALTER TABLE equipment_imports ADD COLUMN IF NOT EXISTS internal_contact varchar(100);
ALTER TABLE equipment_imports ADD COLUMN IF NOT EXISTS borrowing_justification text;

-- Step 3: 인덱스 추가
CREATE INDEX IF NOT EXISTS equipment_imports_source_type_idx ON equipment_imports(source_type);
CREATE INDEX IF NOT EXISTS equipment_imports_status_source_type_idx ON equipment_imports(status, source_type);
