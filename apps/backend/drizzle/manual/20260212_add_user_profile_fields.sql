-- Users 테이블에 Azure AD 프로필 필드 및 앱 관리 필드 추가
-- 필드 소유권:
--   Azure AD 소유: department, phone_number, employee_id, manager_name (매 로그인 시 동기화)
--   앱 소유: is_active (관리자만 변경)

ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 활성 사용자 필터링 최적화 인덱스
CREATE INDEX IF NOT EXISTS users_is_active_idx ON users(is_active);
