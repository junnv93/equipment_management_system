-- audit_logs 테이블 append-only 트리거
--
-- ISO/IEC 17025 §7.11.3 — 전자 기록 무결성·변경 방지
-- FDA 21 CFR Part 11 §11.10(e) — 감사 추적 완결성
--
-- UPDATE, DELETE 시 RAISE EXCEPTION으로 차단.
-- 기록 수정이 필요한 경우 새 레코드를 추가하는 방식만 허용.

CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only: % operation denied (ISO 17025 §7.11.3)', TG_OP;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS "audit_log_no_mutation" ON "audit_logs";

CREATE TRIGGER "audit_log_no_mutation"
  BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_mutation();
