-- 0052_add_checkout_calibration_certificate_exception
-- 교정 목적 반출 반입 시 교정성적서가 아직 등록되지 않은 예외 사유를 감사 추적합니다.
-- 성적서 자체는 documents(calibration_id + calibration_certificate)가 SSOT입니다.
ALTER TABLE "checkouts" ADD COLUMN "calibration_certificate_exception_reason" text;
