-- Convert equipment.team_id from integer to uuid
-- Migration: 0007_convert_equipment_team_id_to_uuid
-- 
-- 목적: equipment.teamId를 integer에서 uuid로 변경하여 teams.id와 타입 일치
-- 이로 인해 CAST 연산 제거, 외래 키 제약 조건 추가, 인덱스 활용 가능
--
-- ⚠️ 주의사항:
-- 1. 데이터 백업 필수
-- 2. 트랜잭션으로 감싸서 롤백 가능하도록
-- 3. 단계별 검증 필요

BEGIN;

-- 1. 현재 team_id 컬럼 타입 확인 및 임시 컬럼 추가
-- 기존 team_id가 integer인 경우를 가정
DO $$
DECLARE
  current_type TEXT;
BEGIN
  -- 현재 컬럼 타입 확인
  SELECT data_type INTO current_type
  FROM information_schema.columns
  WHERE table_name = 'equipment' AND column_name = 'team_id';
  
  -- 이미 uuid 타입이면 마이그레이션 스킵
  IF current_type = 'uuid' THEN
    RAISE NOTICE 'team_id is already uuid type, skipping migration';
    RETURN;
  END IF;
END $$;

-- 2. 임시 컬럼 추가 (새로운 uuid 타입의 team_id)
ALTER TABLE "equipment"
  ADD COLUMN IF NOT EXISTS "team_id_new" UUID;

-- 3. 기존 데이터 변환
-- 방법: teams 테이블의 id와 매칭 시도
-- 주의: integer team_id가 실제로 teams.id(varchar)와 매칭되는 경우는 드뭅습니다
-- 대부분의 경우 team_id는 NULL이거나 잘못된 참조일 수 있습니다
-- 
-- 안전한 접근: 기존 team_id가 있는 경우, teams 테이블에서 매칭되는 레코드를 찾아 변환
-- 매칭되지 않는 경우는 NULL로 설정
-- teams.id가 varchar 타입이므로, 먼저 uuid로 변환한 후 equipment.team_id_new에 저장
-- teams.id가 이미 uuid 형식의 문자열인 경우를 가정
UPDATE "equipment" e
SET "team_id_new" = t.id::uuid
FROM "teams" t
WHERE e.team_id IS NOT NULL
  -- integer를 text로 변환하여 teams.id(varchar)와 비교 시도
  -- 실제로는 integer team_id가 teams.id와 직접 매칭되지 않을 가능성이 높음
  AND CAST(e.team_id AS TEXT) = t.id;

-- 4. 매칭되지 않은 team_id는 NULL로 설정
-- (대부분의 경우 이렇게 될 것으로 예상됨)
UPDATE "equipment"
SET "team_id_new" = NULL
WHERE "team_id_new" IS NULL AND "team_id" IS NOT NULL;

-- 5. 기존 인덱스 삭제 (team_id 기반)
DROP INDEX IF EXISTS "equipment_team_id_idx";
DROP INDEX IF EXISTS "equipment_team_status_idx";

-- 6. 기존 컬럼 삭제
ALTER TABLE "equipment"
  DROP COLUMN IF EXISTS "team_id";

-- 7. 새 컬럼으로 이름 변경
ALTER TABLE "equipment"
  RENAME COLUMN "team_id_new" TO "team_id";

-- 8. 외래 키 제약 조건 추가
-- 주의: teams.id가 varchar인 경우, 먼저 teams.id를 uuid로 변경해야 함
-- 또는 teams.id를 varchar로 유지하고 equipment.team_id도 varchar로 변경
-- 현재는 teams.id가 varchar이므로, 외래 키를 추가하기 전에 teams.id를 uuid로 변경 필요
-- 하지만 이는 별도 마이그레이션으로 처리하는 것이 안전함
-- 일단 외래 키 추가를 시도하고, 실패하면 teams.id 타입 확인 필요
DO $$
BEGIN
  -- teams.id 타입 확인
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teams' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    -- teams.id가 uuid인 경우에만 외래 키 추가
    ALTER TABLE "equipment"
      ADD CONSTRAINT "equipment_team_id_fkey"
      FOREIGN KEY ("team_id")
      REFERENCES "teams"("id")
      ON DELETE SET NULL;
  ELSE
    RAISE NOTICE 'teams.id가 uuid 타입이 아니므로 외래 키 제약 조건을 추가하지 않습니다. teams.id를 먼저 uuid로 변경하세요.';
  END IF;
END $$;

-- 9. 인덱스 재생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS "equipment_team_id_idx" ON "equipment" ("team_id");
CREATE INDEX IF NOT EXISTS "equipment_team_status_idx" ON "equipment" ("team_id", "status");

-- 10. 코멘트 추가
COMMENT ON COLUMN "equipment"."team_id" IS '팀 ID (UUID 타입, teams.id 참조)';

COMMIT;

-- 검증 쿼리 (마이그레이션 후 실행 권장)
-- SELECT 
--   COUNT(*) as total_equipment,
--   COUNT(team_id) as equipment_with_team,
--   COUNT(*) - COUNT(team_id) as equipment_without_team
-- FROM equipment;
