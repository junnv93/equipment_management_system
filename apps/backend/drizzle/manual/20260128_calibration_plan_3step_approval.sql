-- 교정계획서 3단계 승인 워크플로우 마이그레이션
-- 상태 전이: draft → pending_review → pending_approval → approved
--           (반려 시) → rejected

-- 1. 검토 요청 단계 컬럼 추가 (기술책임자 → 품질책임자)
ALTER TABLE calibration_plans
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;

COMMENT ON COLUMN calibration_plans.submitted_at IS '검토 요청 일시 (기술책임자가 품질책임자에게 요청)';

-- 2. 검토 단계 컬럼 추가 (품질책임자)
ALTER TABLE calibration_plans
ADD COLUMN IF NOT EXISTS reviewed_by UUID;

ALTER TABLE calibration_plans
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

ALTER TABLE calibration_plans
ADD COLUMN IF NOT EXISTS review_comment TEXT;

COMMENT ON COLUMN calibration_plans.reviewed_by IS '검토자 ID (품질책임자)';
COMMENT ON COLUMN calibration_plans.reviewed_at IS '검토 완료 일시';
COMMENT ON COLUMN calibration_plans.review_comment IS '검토 의견';

-- 3. 반려 정보 확장 컬럼 추가
ALTER TABLE calibration_plans
ADD COLUMN IF NOT EXISTS rejected_by UUID;

ALTER TABLE calibration_plans
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;

ALTER TABLE calibration_plans
ADD COLUMN IF NOT EXISTS rejection_stage VARCHAR(20);

COMMENT ON COLUMN calibration_plans.rejected_by IS '반려자 ID (품질책임자 또는 시험소장)';
COMMENT ON COLUMN calibration_plans.rejected_at IS '반려 일시';
COMMENT ON COLUMN calibration_plans.rejection_stage IS '반려 단계: review (검토 단계) 또는 approval (승인 단계)';

-- 4. 기존 rejected 데이터 호환성 처리
-- 기존에 반려된 계획서는 승인 단계에서 반려된 것으로 간주
UPDATE calibration_plans
SET rejection_stage = 'approval',
    rejected_by = approved_by,
    rejected_at = updated_at
WHERE status = 'rejected'
  AND rejection_stage IS NULL
  AND rejection_reason IS NOT NULL;

-- 5. 품질책임자 역할 추가 (users 테이블)
-- 참고: 실제 사용자 역할 변경은 관리자가 수동으로 수행해야 함
-- 이 마이그레이션은 스키마 변경만 포함

-- 확인 쿼리: 마이그레이션 후 컬럼 확인
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'calibration_plans'
-- ORDER BY ordinal_position;
