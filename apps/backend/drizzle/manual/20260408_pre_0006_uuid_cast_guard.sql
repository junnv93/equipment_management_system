-- =============================================================================
-- 운영 사전 가드: 0006_gray_sersi.sql 의 text→uuid USING 캐스트 안전 검증
-- =============================================================================
-- 적용 시점:  drizzle-kit migrate (0006 first-apply on production) 직전 1회
-- 실행 방법:  psql -f apps/backend/drizzle/manual/20260408_pre_0006_uuid_cast_guard.sql
-- 권한 필요:  equipment_management DB owner
--
-- 배경:
--   0006_gray_sersi.sql 19~20 라인의
--     ALTER TABLE equipment ALTER COLUMN requested_by SET DATA TYPE uuid
--       USING requested_by::uuid;
--   는 컬럼에 비-UUID 형식 string 이 1건이라도 잔존하면 트랜잭션 abort.
--   0006 의 backfill UPDATE 는 'NOT IN (SELECT id::text FROM users)' 만 NULL
--   처리하므로 ── 다음 두 케이스가 통과되어 cast 단계에서 실패할 수 있음:
--     (1) UUID 포맷이지만 users 에 존재하는 유효 ID  → cast OK
--     (2) UUID 포맷도 아닌 임의 string (e.g. 레거시 사번/이름) → ★ cast 실패 ★
--
--   dev 에서는 20행 모두 케이스(2) 0건이라 통과했으나, 운영 데이터는 검증 안됨.
--
-- 본 가드:
--   1. 정규식으로 UUID v1~v5 형식이 아닌 모든 값을 NULL 로 backfill
--   2. backfill 결과를 RAISE NOTICE 로 출력 (감사 로그 대체)
--   3. 실행 후에도 0006 의 기존 NOT IN 백필이 그대로 동작 (멱등)
--
-- 멱등성:
--   본 스크립트는 UPDATE 만 수행하며 SET 대상이 이미 NULL 이면 no-op.
--   반복 실행 안전. 0006 적용 후에는 컬럼이 uuid 타입이라 자연 차단됨.
-- =============================================================================

\set ON_ERROR_STOP on

BEGIN;

-- UUID v1~v5 정규식 (8-4-4-4-12, hex, version nibble 1~5)
-- ::text 캐스트로 컬럼 타입에 무관하게 검증 (이미 uuid 타입이면 안전 통과)
DO $$
DECLARE
  v_eq_requested int;
  v_eq_approved  int;
  v_uuid_re      text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$';
BEGIN
  -- equipment.requested_by
  EXECUTE format(
    'UPDATE equipment SET requested_by = NULL
       WHERE requested_by IS NOT NULL
         AND requested_by::text !~ %L',
    v_uuid_re
  );
  GET DIAGNOSTICS v_eq_requested = ROW_COUNT;

  -- equipment.approved_by
  EXECUTE format(
    'UPDATE equipment SET approved_by = NULL
       WHERE approved_by IS NOT NULL
         AND approved_by::text !~ %L',
    v_uuid_re
  );
  GET DIAGNOSTICS v_eq_approved = ROW_COUNT;

  RAISE NOTICE '[pre_0006_guard] equipment.requested_by sanitized: % rows', v_eq_requested;
  RAISE NOTICE '[pre_0006_guard] equipment.approved_by  sanitized: % rows', v_eq_approved;
END $$;

COMMIT;
