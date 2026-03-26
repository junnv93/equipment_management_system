-- 사용자 마지막 로그인 시간 컬럼 추가
-- audit.auth.success 이벤트 리스너에서 비동기로 갱신됨
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
