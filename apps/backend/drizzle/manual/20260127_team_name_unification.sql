-- ============================================================================
-- 팀 이름 통일 마이그레이션
-- 팀 이름 = 분류 이름 (Best Practice)
--
-- 실행: psql -U postgres -d equipment_management -f 20260127_team_name_unification.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. 수원 사이트 팀 업데이트
-- ============================================================================
UPDATE teams SET
  name = 'FCC EMC/RF',
  type = 'FCC_EMC_RF',
  classification_code = 'E',
  description = 'FCC EMC/RF 시험 장비 관리'
WHERE id = '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1';

UPDATE teams SET
  name = 'General EMC',
  type = 'GENERAL_EMC',
  classification_code = 'R',
  description = 'General EMC 시험 장비 관리'
WHERE id = 'bb6c860d-9d7c-4e2d-b289-2b2e416ec289';

UPDATE teams SET
  name = 'SAR',
  type = 'SAR',
  classification_code = 'S',
  description = 'SAR(전자파 흡수율) 시험 장비 관리'
WHERE id = '7fd28076-fd5e-4d36-b051-bbf8a97b82db';

UPDATE teams SET
  name = 'Automotive EMC',
  type = 'AUTOMOTIVE_EMC',
  classification_code = 'A',
  description = 'Automotive EMC 시험 장비 관리'
WHERE id = 'f0a32655-00f9-4ecd-b43c-af4faed499b6';

-- ============================================================================
-- 2. 의왕 사이트: 기존 팀 삭제 후 General RF 팀만 생성
-- ============================================================================
-- 기존 의왕 팀 삭제 (주의: FK 제약조건 확인 필요)
DELETE FROM teams WHERE site = 'uiwang';

-- General RF 팀 생성 (의왕 전용)
INSERT INTO teams (id, name, type, site, classification_code, description, created_at, updated_at)
VALUES (
  'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
  'General RF',
  'GENERAL_RF',
  'uiwang',
  'W',
  'General RF 시험 장비 관리 (의왕)',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  classification_code = EXCLUDED.classification_code,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================================
-- 3. 평택 사이트: 기존 팀 삭제 후 Automotive EMC 팀만 생성
-- ============================================================================
-- 기존 평택 팀 삭제
DELETE FROM teams WHERE site = 'pyeongtaek';

-- Automotive EMC 팀 생성 (평택 전용)
INSERT INTO teams (id, name, type, site, classification_code, description, created_at, updated_at)
VALUES (
  'b2c3d4e5-f6a7-4890-bcde-f01234567890',
  'Automotive EMC',
  'AUTOMOTIVE_EMC',
  'pyeongtaek',
  'A',
  'Automotive EMC 시험 장비 관리 (평택)',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  classification_code = EXCLUDED.classification_code,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================================
-- 4. 의왕/평택 장비의 team_id 업데이트
-- ============================================================================
-- 의왕 장비: 모두 General RF 팀으로
UPDATE equipment SET
  team_id = 'a1b2c3d4-e5f6-4789-abcd-ef0123456789'
WHERE site = 'uiwang';

-- 평택 장비: 모두 Automotive EMC 팀으로
UPDATE equipment SET
  team_id = 'b2c3d4e5-f6a7-4890-bcde-f01234567890'
WHERE site = 'pyeongtaek';

-- ============================================================================
-- 5. 의왕/평택 사용자의 team_id 업데이트
-- ============================================================================
-- 의왕 사용자: 모두 General RF 팀으로
UPDATE users SET
  team_id = 'a1b2c3d4-e5f6-4789-abcd-ef0123456789'
WHERE site = 'uiwang';

-- 평택 사용자: 모두 Automotive EMC 팀으로
UPDATE users SET
  team_id = 'b2c3d4e5-f6a7-4890-bcde-f01234567890'
WHERE site = 'pyeongtaek';

-- ============================================================================
-- 6. 의왕 장비 관리번호 업데이트 (UIW-W 형식으로 통일)
-- ============================================================================
-- 참고: 이 업데이트는 기존 관리번호를 변경하므로 주의 필요
-- 필요시 개별적으로 실행

-- ============================================================================
-- 검증 쿼리
-- ============================================================================
SELECT 'Teams' as entity, id, name, type, site, classification_code FROM teams ORDER BY site, name;

COMMIT;

-- ============================================================================
-- 롤백 (필요시)
-- ============================================================================
-- ROLLBACK;
