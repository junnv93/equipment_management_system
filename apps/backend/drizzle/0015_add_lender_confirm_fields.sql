-- 시험소간 대여 반입 시 빌려준 측 확인 필드 추가
-- lender_confirmed_by: 빌려준 측 확인자 UUID
-- lender_confirmed_at: 빌려준 측 확인 일시
-- lender_confirm_notes: 빌려준 측 확인 메모

-- 빌려준 측 확인자 필드 추가
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS lender_confirmed_by UUID REFERENCES users(id);

-- 빌려준 측 확인 일시 필드 추가
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS lender_confirmed_at TIMESTAMP;

-- 빌려준 측 확인 메모 필드 추가
ALTER TABLE checkouts ADD COLUMN IF NOT EXISTS lender_confirm_notes TEXT;

-- 코멘트 추가
COMMENT ON COLUMN checkouts.lender_confirmed_by IS '시험소간 대여 반입 시 빌려준 측 확인자 UUID';
COMMENT ON COLUMN checkouts.lender_confirmed_at IS '시험소간 대여 반입 시 빌려준 측 확인 일시';
COMMENT ON COLUMN checkouts.lender_confirm_notes IS '시험소간 대여 반입 시 빌려준 측 확인 메모';
