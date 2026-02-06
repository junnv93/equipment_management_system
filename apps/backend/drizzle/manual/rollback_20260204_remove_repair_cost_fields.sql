-- =====================================================
-- 수리 이력 비용/담당자 필드 복구 (데이터는 복구 불가)
-- ⚠️ 주의: 컬럼만 재생성, 데이터는 복구되지 않음
-- =====================================================

ALTER TABLE repair_history ADD COLUMN repaired_by VARCHAR(100);
ALTER TABLE repair_history ADD COLUMN repair_company VARCHAR(200);
ALTER TABLE repair_history ADD COLUMN cost INTEGER;

-- ⚠️ 경고 메시지
DO $$
BEGIN
  RAISE WARNING '⚠️ 컬럼은 복구되었으나 데이터는 복구되지 않았습니다';
END $$;
