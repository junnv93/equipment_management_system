-- Migration: Add temporary equipment fields (usage period and owner)
-- Created: 2026-01-30
-- Purpose: Support temporary equipment registration for shared/rental equipment

-- Add owner column (공용장비: 팀명, 렌탈장비: 업체명)
ALTER TABLE equipment
ADD COLUMN IF NOT EXISTS owner VARCHAR(100);

-- Add usage period columns (임시등록 장비 전용)
ALTER TABLE equipment
ADD COLUMN IF NOT EXISTS usage_period_start TIMESTAMP;

ALTER TABLE equipment
ADD COLUMN IF NOT EXISTS usage_period_end TIMESTAMP;

-- Add index for usage period queries (find expiring equipment)
CREATE INDEX IF NOT EXISTS equipment_usage_period_end_idx
ON equipment(usage_period_end)
WHERE usage_period_end IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN equipment.owner IS '소유처 (공용장비: Safety팀/Battery팀, 렌탈장비: 업체명)';
COMMENT ON COLUMN equipment.usage_period_start IS '사용 시작일 (임시등록 전용, status=temporary)';
COMMENT ON COLUMN equipment.usage_period_end IS '사용 종료일 (임시등록 전용, status=temporary, 만료 시 status=inactive 전환)';
