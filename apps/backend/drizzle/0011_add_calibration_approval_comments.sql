-- 교정 승인 프로세스를 위한 필드 추가
-- approval_status, registered_by, approved_by, registered_by_role, registrar_comment, rejection_reason, intermediate_check_date

-- approval_status 컬럼 추가
ALTER TABLE IF EXISTS "calibrations"
  ADD COLUMN IF NOT EXISTS "approval_status" VARCHAR(50) NOT NULL DEFAULT 'pending_approval';

-- registered_by 컬럼 추가 (등록자 ID)
ALTER TABLE IF EXISTS "calibrations"
  ADD COLUMN IF NOT EXISTS "registered_by" UUID;

-- approved_by 컬럼 추가 (승인자 ID)
ALTER TABLE IF EXISTS "calibrations"
  ADD COLUMN IF NOT EXISTS "approved_by" UUID;

-- registered_by_role 컬럼 추가 (등록자 역할)
ALTER TABLE IF EXISTS "calibrations"
  ADD COLUMN IF NOT EXISTS "registered_by_role" VARCHAR(50);

-- registrar_comment 컬럼 추가 (등록자 코멘트)
ALTER TABLE IF EXISTS "calibrations"
  ADD COLUMN IF NOT EXISTS "registrar_comment" TEXT;

-- approver_comment 컬럼이 이미 존재하므로 건너뜀

-- rejection_reason 컬럼 추가 (반려 사유)
ALTER TABLE IF EXISTS "calibrations"
  ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;

-- intermediate_check_date 컬럼 추가 (중간점검 일정)
ALTER TABLE IF EXISTS "calibrations"
  ADD COLUMN IF NOT EXISTS "intermediate_check_date" DATE;
