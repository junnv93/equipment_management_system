-- Convert teams.id from varchar to uuid
-- Migration: 0008_convert_teams_id_to_uuid
-- 
-- 목적: teams.id를 varchar에서 uuid로 변경하여 equipment.teamId와 타입 일치
-- 이로 인해 외래 키 제약 조건 추가 가능, CAST 연산 완전 제거
--
-- ⚠️ 주의사항:
-- 1. 데이터 백업 필수
-- 2. users.team_id도 함께 업데이트 필요
-- 3. 트랜잭션으로 감싸서 롤백 가능하도록

BEGIN;

-- 1. 현재 id 컬럼 타입 확인
DO $$
DECLARE
  current_type TEXT;
BEGIN
  SELECT data_type INTO current_type
  FROM information_schema.columns
  WHERE table_name = 'teams' AND column_name = 'id';
  
  -- 이미 uuid 타입이면 마이그레이션 스킵
  IF current_type = 'uuid' THEN
    RAISE NOTICE 'teams.id is already uuid type, skipping migration';
    RETURN;
  END IF;
END $$;

-- 2. users 테이블의 외래 키 제약 조건 임시 제거
ALTER TABLE "users"
  DROP CONSTRAINT IF EXISTS "users_team_id_fkey";

-- 3. equipment 테이블의 외래 키 제약 조건 임시 제거 (있는 경우)
ALTER TABLE "equipment"
  DROP CONSTRAINT IF EXISTS "equipment_team_id_fkey";

-- 4. 임시 컬럼 추가 (새로운 uuid 타입의 id)
ALTER TABLE "teams"
  ADD COLUMN IF NOT EXISTS "id_new" UUID DEFAULT gen_random_uuid();

-- 5. 기존 데이터 변환
-- varchar id가 이미 uuid 형식인 경우 그대로 사용, 아니면 새 uuid 생성
UPDATE "teams"
SET "id_new" = CASE 
  WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id::uuid
  ELSE gen_random_uuid()
END;

-- 6. users 테이블의 team_id를 uuid로 변환
-- 먼저 users.team_id를 uuid 타입으로 변경
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "team_id_new" UUID;

-- 기존 team_id를 uuid로 변환
UPDATE "users" u
SET "team_id_new" = t.id_new
FROM "teams" t
WHERE u.team_id = t.id;

-- 기존 team_id 컬럼 삭제 및 새 컬럼으로 교체
ALTER TABLE "users"
  DROP COLUMN IF EXISTS "team_id";

ALTER TABLE "users"
  RENAME COLUMN "team_id_new" TO "team_id";

-- 7. equipment 테이블의 team_id 업데이트
UPDATE "equipment" e
SET "team_id" = t.id_new
FROM "teams" t
WHERE e.team_id::text = t.id;

-- 8. 기존 primary key 제약 조건 제거
ALTER TABLE "teams"
  DROP CONSTRAINT IF EXISTS "teams_pkey";

-- 9. 기존 컬럼 삭제
ALTER TABLE "teams"
  DROP COLUMN IF EXISTS "id";

-- 10. 새 컬럼으로 이름 변경
ALTER TABLE "teams"
  RENAME COLUMN "id_new" TO "id";

-- 11. Primary key 재생성
ALTER TABLE "teams"
  ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");

-- 12. users 테이블의 외래 키 제약 조건 재추가
ALTER TABLE "users"
  ADD CONSTRAINT "users_team_id_fkey"
  FOREIGN KEY ("team_id")
  REFERENCES "teams"("id")
  ON DELETE SET NULL;

-- 13. equipment 테이블의 외래 키 제약 조건 추가
ALTER TABLE "equipment"
  ADD CONSTRAINT "equipment_team_id_fkey"
  FOREIGN KEY ("team_id")
  REFERENCES "teams"("id")
  ON DELETE SET NULL;

-- 14. 코멘트 추가
COMMENT ON COLUMN "teams"."id" IS '팀 ID (UUID 타입)';
COMMENT ON COLUMN "equipment"."team_id" IS '팀 ID (UUID 타입, teams.id 참조)';

COMMIT;

-- 검증 쿼리 (마이그레이션 후 실행 권장)
-- SELECT 
--   'teams.id 타입' as check_item,
--   data_type as result
-- FROM information_schema.columns 
-- WHERE table_name = 'teams' AND column_name = 'id';
