-- 교정성적서 파일 경로 컬럼 추가
-- 교정 기록에 교정성적서 파일을 첨부할 수 있도록 함

-- 1. certificate_path 컬럼 추가
ALTER TABLE calibrations
ADD COLUMN IF NOT EXISTS certificate_path VARCHAR(500);

COMMENT ON COLUMN calibrations.certificate_path IS '교정성적서 파일 경로';

-- 2. result 컬럼이 없으면 추가 (SSOT: pass, fail, conditional)
-- 참고: 기존 result 컬럼이 있으면 이 명령은 무시됨
ALTER TABLE calibrations
ADD COLUMN IF NOT EXISTS result VARCHAR(100);

COMMENT ON COLUMN calibrations.result IS '교정 결과 (pass: 적합, fail: 부적합, conditional: 조건부 적합)';

-- 확인 쿼리: 마이그레이션 후 컬럼 확인
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'calibrations'
-- ORDER BY ordinal_position;
