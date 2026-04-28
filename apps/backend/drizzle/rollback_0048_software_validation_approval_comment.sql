-- Rollback: 0048_add_software_validation_approval_comment
-- Note: 컬럼 DROP은 영속화된 코멘트 데이터 영구 손실. 운영 환경에서는 신중 검토 후 실행.
--       임시 무력화가 필요한 경우 service 코드만 revert (`approvalComment: null` 강제) →
--       컬럼은 남기되 신규 write 차단하는 전략을 우선 검토 권장.
-- 무손실 회귀 안전망: audit_logs metadata에 동일 정보가 이중 기록되어 있으므로
--                   컬럼 DROP 후에도 audit_logs에서 코멘트 복원 가능.

ALTER TABLE "software_validations"
  DROP COLUMN IF EXISTS "approval_comment";

--> statement-breakpoint
