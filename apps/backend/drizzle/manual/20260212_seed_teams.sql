-- 팀 시드 데이터 (기존 인메모리 서비스의 6개 팀과 동일한 UUID)
-- ON CONFLICT: 이미 존재하는 팀은 건너뜀 (멱등성 보장)

INSERT INTO teams (id, name, type, site, classification_code, description, created_at, updated_at)
VALUES
  -- 수원 사이트 (SUW)
  ('7dc3b94c-82b8-488e-9ea5-4fe71bb086e1', 'FCC EMC/RF', 'FCC_EMC_RF', 'suwon', 'E',
   'FCC EMC/RF 시험 장비 관리 - 수원', '2023-01-01', NOW()),
  ('bb6c860d-9d7c-4e2d-b289-2b2e416ec289', 'General EMC', 'GENERAL_EMC', 'suwon', 'R',
   'General EMC 시험 장비 관리 - 수원', '2023-01-01', NOW()),
  ('7fd28076-fd5e-4d36-b051-bbf8a97b82db', 'SAR', 'SAR', 'suwon', 'S',
   'SAR(비흡수율) 시험 장비 관리 - 수원', '2023-01-01', NOW()),
  ('f0a32655-00f9-4ecd-b43c-af4faed499b6', 'Automotive EMC', 'AUTOMOTIVE_EMC', 'suwon', 'A',
   'Automotive EMC 시험 장비 관리 - 수원', '2023-01-01', NOW()),
  -- 의왕 사이트 (UIW)
  ('a1b2c3d4-e5f6-4789-abcd-ef0123456789', 'General RF', 'GENERAL_RF', 'uiwang', 'W',
   'General RF 시험 장비 관리 - 의왕', '2023-01-01', NOW()),
  -- 평택 사이트 (PYT)
  ('b2c3d4e5-f6a7-4890-bcde-f01234567890', 'Automotive EMC', 'AUTOMOTIVE_EMC', 'pyeongtaek', 'A',
   'Automotive EMC 시험 장비 관리 - 평택', '2023-01-01', NOW())
ON CONFLICT (id) DO NOTHING;
