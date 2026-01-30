-- 테스트 사용자 데이터 시드
-- 테스트 및 개발 환경에서 사용되는 초기 사용자 데이터

-- 기존 데이터 확인 후 삽입 (중복 방지)
-- ✅ test-login 엔드포인트와 동기화된 UUID 사용
INSERT INTO users (id, email, name, role, site, location, team_id, created_at, updated_at)
VALUES
  -- test-login 엔드포인트 사용자 (auth.controller.ts:81-127)
  ('00000000-0000-0000-0000-000000000001', 'test.engineer@example.com', '테스트 시험실무자', 'test_engineer', 'suwon', '수원랩', NULL, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', 'tech.manager@example.com', '테스트 기술책임자', 'technical_manager', 'suwon', '수원랩', NULL, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', 'lab.manager@example.com', '테스트 시험소장', 'lab_manager', 'suwon', '수원랩', NULL, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000004', 'system.admin@example.com', '테스트 시스템 관리자', 'system_admin', 'suwon', '수원랩', NULL, NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000005', 'quality.manager@example.com', '테스트 품질책임자', 'quality_manager', 'suwon', '수원랩', NULL, NOW(), NOW()),

  -- AuthService 개발용 사용자 (auth.service.ts:85-113)
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'admin@example.com', '관리자', 'lab_manager', 'suwon', '수원랩', NULL, NOW(), NOW()),
  ('a1b2c3d4-e5f6-4789-abcd-ef0123456789', 'manager@example.com', 'RF팀 관리자', 'technical_manager', 'suwon', '수원랩', '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1', NOW(), NOW()),
  ('12345678-1234-4567-8901-234567890abc', 'user@example.com', '시험실무자', 'test_engineer', 'suwon', '수원랩', '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  site = EXCLUDED.site,
  location = EXCLUDED.location,
  team_id = EXCLUDED.team_id,
  updated_at = NOW();

-- 확인 쿼리 (실행할 필요 없음, 마이그레이션 테스트용)
-- SELECT id, email, name, role FROM users WHERE email LIKE '%example.com%';
