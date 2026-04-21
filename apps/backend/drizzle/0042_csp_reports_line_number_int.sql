-- line_number 컬럼을 varchar(20) → integer로 변경.
-- CSP spec (legacy: line-number unsigned long, Reporting API: lineNumber number) 모두 정수.
--
-- USING 절 처리 규칙:
--   NULL / 빈 문자열  → NULL
--   숫자 문자열       → integer 변환
--   비숫자 문자열     → NULL (파싱 불가 값 강등, migration 안전 보장)
ALTER TABLE "csp_reports"
  ALTER COLUMN "line_number" TYPE integer
  USING CASE
    WHEN "line_number" IS NULL OR "line_number" = '' THEN NULL
    WHEN "line_number" ~ '^\d+$' THEN "line_number"::integer
    ELSE NULL
  END;
