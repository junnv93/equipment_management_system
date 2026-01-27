-- 팀-분류코드 매핑 마이그레이션
-- 날짜: 2026-01-27
-- 목적: 팀이 장비 분류코드를 결정하도록 업데이트

-- 1. 팀 테이블에 classification_code 컬럼 추가 (없으면)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS classification_code VARCHAR(1);

-- 2. 기존 팀 데이터 삭제 (새 UUID로 재생성)
DELETE FROM teams;

-- 3. 수원 팀 삽입 (Azure AD 그룹 Object ID 기반)
INSERT INTO teams (id, name, type, site, classification_code, description, created_at, updated_at)
VALUES
  -- LST.SUW.RF → FCC EMC/RF (E)
  ('7dc3b94c-82b8-488e-9ea5-4fe71bb086e1', 'RF팀(수원)', 'RF', 'suwon', 'E', 'FCC EMC/RF 시험 장비 관리', NOW(), NOW()),
  -- LST.SUW.SAR → SAR (S)
  ('7fd28076-fd5e-4d36-b051-bbf8a97b82db', 'SAR팀(수원)', 'SAR', 'suwon', 'S', 'SAR 시험 장비 관리', NOW(), NOW()),
  -- LST.SUW.EMC → General EMC (R)
  ('bb6c860d-9d7c-4e2d-b289-2b2e416ec289', 'EMC팀(수원)', 'EMC', 'suwon', 'R', 'General EMC 시험 장비 관리', NOW(), NOW()),
  -- LST.SUW.Automotive → Automotive EMC (A)
  ('f0a32655-00f9-4ecd-b43c-af4faed499b6', 'Automotive팀(수원)', 'AUTO', 'suwon', 'A', 'Automotive EMC 시험 장비 관리', NOW(), NOW());

-- 4. 의왕 팀 삽입 (placeholder UUID - 추후 Azure AD 그룹 추가 시 업데이트)
INSERT INTO teams (id, name, type, site, classification_code, description, created_at, updated_at)
VALUES
  ('55555555-5555-5555-5555-555555555555', 'RF팀(의왕)', 'RF', 'uiwang', 'E', 'FCC EMC/RF 시험 장비 관리', NOW(), NOW()),
  ('77777777-7777-7777-7777-777777777777', 'SAR팀(의왕)', 'SAR', 'uiwang', 'S', 'SAR 시험 장비 관리', NOW(), NOW()),
  ('66666666-6666-6666-6666-666666666666', 'EMC팀(의왕)', 'EMC', 'uiwang', 'R', 'General EMC 시험 장비 관리', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', '환경시험팀(의왕)', 'AUTO', 'uiwang', 'A', 'Automotive EMC 시험 장비 관리', NOW(), NOW());

-- 5. 팀 삽입 결과 확인
SELECT id, name, type, site, classification_code FROM teams ORDER BY site, type;
