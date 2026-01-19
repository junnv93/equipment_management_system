-- 대여 승인 관련 필드 추가 마이그레이션
-- approver_comment: 승인자 코멘트
-- auto_approved: 동일 팀 자동 승인 여부

-- 승인자 코멘트 필드 추가
ALTER TABLE loans ADD COLUMN IF NOT EXISTS approver_comment TEXT;

-- 자동 승인 여부 필드 추가 (기본값: false)
ALTER TABLE loans ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE;

-- 코멘트 추가
COMMENT ON COLUMN loans.approver_comment IS '승인자 코멘트';
COMMENT ON COLUMN loans.auto_approved IS '동일 팀 자동 승인 여부 (true: 자동 승인, false: 수동 승인)';
