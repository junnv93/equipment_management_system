-- Update user roles system and add site/location fields
-- Migration: 0005_update_user_roles_and_add_site_location

-- 1. Add new columns to users table
ALTER TABLE "users" 
  ADD COLUMN IF NOT EXISTS "site" VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "location" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "position" VARCHAR(100);

-- 2. Update existing roles to new role system
-- admin → site_admin
UPDATE "users" SET "role" = 'site_admin' WHERE "role" = 'admin';

-- manager → technical_manager
UPDATE "users" SET "role" = 'technical_manager' WHERE "role" = 'manager';

-- user → test_operator
UPDATE "users" SET "role" = 'test_operator' WHERE "role" = 'user';

-- approver → technical_manager (승인 권한이 있으므로)
UPDATE "users" SET "role" = 'technical_manager' WHERE "role" = 'approver';

-- 3. Update default role value
ALTER TABLE "users" 
  ALTER COLUMN "role" SET DEFAULT 'test_operator';

-- 4. Add comments for documentation
COMMENT ON COLUMN "users"."site" IS '사이트 정보: suwon 또는 uiwang';
COMMENT ON COLUMN "users"."location" IS '위치 정보: 수원랩 또는 의왕랩';
COMMENT ON COLUMN "users"."position" IS '직위/직책 정보';
COMMENT ON COLUMN "users"."role" IS '사용자 역할: test_operator(시험실무자), technical_manager(기술책임자), site_admin(시험소별 관리자)';
