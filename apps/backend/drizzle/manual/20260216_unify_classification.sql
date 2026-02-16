-- ============================================================================
-- Migration: Unify Team Type and Equipment Classification (SSOT)
-- Date: 2026-02-16
-- Purpose:
--   1. 팀 타입을 대문자 → 소문자로 변환 (API 일관성)
--   2. team.type → team.classification으로 컬럼명 변경
--   3. 인덱스 추가 (성능 최적화)
-- ============================================================================

BEGIN;

-- Step 1: 기존 데이터 백업 (롤백용)
CREATE TABLE IF NOT EXISTS teams_backup_20260216 AS
SELECT * FROM teams;

-- Step 2: team.type을 소문자로 변환
-- 대문자_언더스코어 → 소문자_언더스코어
UPDATE teams SET type = LOWER(type);

-- Step 3: 레거시 값 정규화
UPDATE teams SET type = 'fcc_emc_rf' WHERE type = 'rf';
UPDATE teams SET type = 'general_emc' WHERE type = 'emc';
UPDATE teams SET type = 'automotive_emc' WHERE type = 'auto';

-- Step 4: team.type 컬럼명을 classification으로 변경
ALTER TABLE teams RENAME COLUMN type TO classification;

-- Step 5: 새 인덱스 추가 (classification 검색 최적화)
CREATE INDEX IF NOT EXISTS teams_classification_idx ON teams(classification);

-- Step 6: 데이터 검증
DO $$
DECLARE
  invalid_count INTEGER;
  valid_classifications TEXT[] := ARRAY['fcc_emc_rf', 'general_emc', 'general_rf', 'sar', 'automotive_emc', 'software'];
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM teams
  WHERE classification NOT IN (SELECT unnest(valid_classifications));

  IF invalid_count > 0 THEN
    RAISE EXCEPTION '검증 실패: % 개의 잘못된 classification 값 발견', invalid_count;
  END IF;

  RAISE NOTICE '✅ 검증 성공: 모든 classification 값이 유효함';
END $$;

-- Step 7: 결과 확인 (로그 출력)
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '=== 마이그레이션 결과 ===';
  FOR r IN
    SELECT
      classification,
      classification_code,
      COUNT(*) as count
    FROM teams
    GROUP BY classification, classification_code
    ORDER BY classification
  LOOP
    RAISE NOTICE '분류: % (코드: %) - %개 팀', r.classification, r.classification_code, r.count;
  END LOOP;
END $$;

COMMIT;

-- ============================================================================
-- 롤백 스크립트 (필요 시 실행)
-- ============================================================================
-- BEGIN;
-- DROP INDEX IF EXISTS teams_classification_idx;
-- ALTER TABLE teams RENAME COLUMN classification TO type;
-- TRUNCATE teams;
-- INSERT INTO teams SELECT * FROM teams_backup_20260216;
-- DROP TABLE teams_backup_20260216;
-- COMMIT;
