-- 테스트 사용자 데이터 시드
-- 테스트 및 개발 환경에서 사용되는 초기 사용자 데이터

-- 기존 데이터 확인 후 삽입 (중복 방지)
INSERT INTO users (id, email, name, role, site, location, created_at, updated_at)
VALUES
  -- AuthService의 테스트 사용자와 동일한 ID 사용
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'admin@example.com', '관리자', 'lab_manager', 'suwon', '수원랩', NOW(), NOW()),
  ('a1b2c3d4-e5f6-4789-abcd-ef0123456789', 'manager@example.com', 'RF팀 관리자', 'technical_manager', 'suwon', '수원랩', NOW(), NOW()),
  ('12345678-1234-4567-8901-234567890abc', 'user@example.com', '시험실무자', 'test_engineer', 'suwon', '수원랩', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'user1@example.com', '김사용', 'test_engineer', 'suwon', '수원랩', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'inactive@example.com', '퇴사자', 'test_engineer', 'suwon', '수원랩', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 확인 쿼리 (실행할 필요 없음, 마이그레이션 테스트용)
-- SELECT id, email, name, role FROM users WHERE email LIKE '%example.com%';
