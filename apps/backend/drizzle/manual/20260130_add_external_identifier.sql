-- Migration: Add external_identifier field for temporary equipment (UI-14)
-- Date: 2026-01-30
-- Description: 공용/렌탈 장비의 소유처 원본 식별번호를 저장하기 위한 필드 추가

-- Add external_identifier column to equipment table
ALTER TABLE equipment
ADD COLUMN external_identifier VARCHAR(100);

-- Add comment for documentation
COMMENT ON COLUMN equipment.external_identifier IS '소유처 원본 식별번호 (공용장비: 예: SAF-EQ-1234, 렌탈장비: 예: RNT-2024-001)';

-- Create index for faster searches on external identifier
CREATE INDEX idx_equipment_external_identifier ON equipment(external_identifier)
WHERE external_identifier IS NOT NULL;
