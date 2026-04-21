-- line_number 컬럼을 varchar(20) → integer로 변경.
-- CSP spec (legacy: line-number unsigned long, Reporting API: lineNumber number) 모두 정수.
-- 빈 문자열이나 NULL은 NULL로, 유효한 숫자 문자열은 정수로 변환.
ALTER TABLE "csp_reports"
  ALTER COLUMN "line_number" TYPE integer
  USING CASE
    WHEN "line_number" IS NULL OR "line_number" = '' THEN NULL
    ELSE "line_number"::integer
  END;
