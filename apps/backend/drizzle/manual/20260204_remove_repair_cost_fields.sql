-- =====================================================
-- 수리 이력 비용/담당자 필드 제거
-- 작성일: 2026-02-04
-- ⚠️ 주의: 이 마이그레이션은 데이터를 영구 삭제합니다
-- =====================================================

-- Step 1: 기존 데이터 확인 (선택사항 - 로그용)
DO $$
DECLARE
  repaired_by_count INTEGER;
  repair_company_count INTEGER;
  cost_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO repaired_by_count FROM repair_history WHERE repaired_by IS NOT NULL;
  SELECT COUNT(*) INTO repair_company_count FROM repair_history WHERE repair_company IS NOT NULL;
  SELECT COUNT(*) INTO cost_count FROM repair_history WHERE cost IS NOT NULL;

  RAISE NOTICE '=== 제거될 데이터 통계 ===';
  RAISE NOTICE 'repaired_by 데이터: % 건', repaired_by_count;
  RAISE NOTICE 'repair_company 데이터: % 건', repair_company_count;
  RAISE NOTICE 'cost 데이터: % 건', cost_count;
END $$;

-- Step 2: 컬럼 제거 (영구 삭제)
ALTER TABLE repair_history DROP COLUMN IF EXISTS repaired_by;
ALTER TABLE repair_history DROP COLUMN IF EXISTS repair_company;
ALTER TABLE repair_history DROP COLUMN IF EXISTS cost;

-- Step 3: 변경 확인
-- \d repair_history;

-- ✅ 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 수리 이력 비용/담당자 필드 제거 완료';
END $$;
