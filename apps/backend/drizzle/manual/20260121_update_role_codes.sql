-- 역할 코드 변경 마이그레이션
-- UL-QP-18 장비 관리 절차서 영문 명칭에 맞게 역할 코드 업데이트
--
-- 변경 내용:
-- - test_operator → test_engineer (시험실무자 / Test Engineer)
-- - site_admin → lab_manager (시험소장 / Lab Manager)
--
-- 실행 날짜: 2026-01-21

-- 1. users 테이블의 역할 코드 업데이트
UPDATE users SET role = 'test_engineer' WHERE role = 'test_operator';
UPDATE users SET role = 'lab_manager' WHERE role = 'site_admin';

-- 2. calibrations 테이블의 등록자 역할 업데이트 (registered_by_role 필드가 있는 경우)
UPDATE calibrations SET registered_by_role = 'test_engineer' WHERE registered_by_role = 'test_operator';

-- 3. 기본값 확인용 코멘트
-- users 테이블의 role 컬럼 기본값은 코드에서 'test_engineer'로 변경됨
-- 데이터베이스 레벨 기본값 변경이 필요한 경우:
-- ALTER TABLE users ALTER COLUMN role SET DEFAULT 'test_engineer';

-- 확인 쿼리
-- SELECT role, COUNT(*) FROM users GROUP BY role;
-- SELECT registered_by_role, COUNT(*) FROM calibrations GROUP BY registered_by_role;
