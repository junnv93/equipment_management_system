-- 0055_widen_system_error_events_error_code
-- error_code 컬럼을 varchar(50) → varchar(100) 으로 확장.
--
-- 이유: ErrorCode enum 최장 값이 53자 (`SOFTWARE_VALIDATION_ONLY_APPROVED_CAN_QUALITY_APPROVE`).
--       원래 0054 의 50자 제한은 DB INSERT 실패 → catch swallow → 데이터 유실 위험.
--       100자로 확장하여 future-proof 마진 확보.
ALTER TABLE "system_error_events"
  ALTER COLUMN "error_code" TYPE varchar(100);
