-- Migration: Make non_conformances.discovered_by nullable
-- Date: 2026-02-02
-- Description:
--   시스템 자동 생성 부적합(교정 기한 초과 등)을 지원하기 위해
--   discovered_by 컬럼을 nullable로 변경합니다.
--
--   변경 이유:
--   - CalibrationOverdueScheduler가 자동으로 부적합을 생성할 때
--     발견자(discoveredBy)가 null이어야 함 (시스템 자동 생성)
--   - NOT NULL → NULL 변경은 기존 데이터에 영향 없음 (안전한 변경)

-- discovered_by 컬럼을 nullable로 변경
ALTER TABLE non_conformances
  ALTER COLUMN discovered_by DROP NOT NULL;

-- 변경 확인 (선택사항)
-- SELECT column_name, is_nullable, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'non_conformances' AND column_name = 'discovered_by';
