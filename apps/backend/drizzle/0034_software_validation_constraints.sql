-- UL-QP-18-09 소프트웨어 유효성 확인 무결성 제약 및 인덱스
--
-- Phase 1 (zero-downtime): NOT VALID 선언 → 기존 데이터 영향 없음
-- Phase 2: VALIDATE CONSTRAINT 로 기존 행 검증 (별도 트랜잭션)
--
-- ISO/IEC 17025 §7.11 데이터 무결성 준수

-- ── vendor/self 상호 배제 제약 ──

ALTER TABLE "software_validations"
  ADD CONSTRAINT "swv_vendor_self_mutex_self"
  CHECK (
    validation_type <> 'vendor' OR (
      reference_documents IS NULL AND
      operating_unit_description IS NULL AND
      software_components IS NULL AND
      hardware_components IS NULL AND
      acquisition_functions IS NULL AND
      processing_functions IS NULL AND
      control_functions IS NULL AND
      performed_by IS NULL
    )
  )
  NOT VALID;

ALTER TABLE "software_validations"
  ADD CONSTRAINT "swv_vendor_self_mutex_vendor"
  CHECK (
    validation_type <> 'self' OR (
      vendor_name IS NULL AND
      vendor_summary IS NULL AND
      received_by IS NULL AND
      received_date IS NULL AND
      attachment_note IS NULL
    )
  )
  NOT VALID;

-- ── CAS version 양수 제약 ──

ALTER TABLE "software_validations"
  ADD CONSTRAINT "swv_version_positive"
  CHECK (version >= 1)
  NOT VALID;

-- ── 워크플로우 상태 불변식 ──

ALTER TABLE "software_validations"
  ADD CONSTRAINT "swv_status_invariants"
  CHECK (
    (status NOT IN ('submitted', 'approved', 'quality_approved', 'rejected') OR submitted_at IS NOT NULL) AND
    (status NOT IN ('approved', 'quality_approved') OR (technical_approver_id IS NOT NULL AND technical_approved_at IS NOT NULL)) AND
    (status <> 'quality_approved' OR (quality_approver_id IS NOT NULL AND quality_approved_at IS NOT NULL)) AND
    (status <> 'rejected' OR (rejected_by IS NOT NULL AND rejection_reason IS NOT NULL))
  )
  NOT VALID;

-- ── VALIDATE (기존 seed 데이터 검증) ──

ALTER TABLE "software_validations" VALIDATE CONSTRAINT "swv_vendor_self_mutex_self";
ALTER TABLE "software_validations" VALIDATE CONSTRAINT "swv_vendor_self_mutex_vendor";
ALTER TABLE "software_validations" VALIDATE CONSTRAINT "swv_version_positive";
ALTER TABLE "software_validations" VALIDATE CONSTRAINT "swv_status_invariants";

-- ── 복합 인덱스 (페이징 + 필터 성능) ──

CREATE INDEX IF NOT EXISTS "swv_status_type_idx"
  ON "software_validations" (status, validation_type);

CREATE INDEX IF NOT EXISTS "swv_submitted_at_idx"
  ON "software_validations" (submitted_at DESC)
  WHERE status = 'submitted';
