-- calibrations.certificate_path 컬럼 제거
--
-- Phase 4d: write-stop(4c) 이후 완전 제거.
-- 기존 데이터는 Phase 4a(0033_calibration_certificate_path_backfill) 에서
-- documents 테이블로 이미 이관됨.
-- 이후 certificatePath는 documents.file_path에서만 읽힌다.

ALTER TABLE "calibrations" DROP COLUMN IF EXISTS "certificate_path";
