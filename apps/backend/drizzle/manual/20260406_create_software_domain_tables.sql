-- Software domain tables creation (UL-QP-18-07/09)
-- Creates: test_software, software_validations, equipment_test_software
-- Reason: Drizzle schema defines these tables but they were never migrated to DB
-- Related: rollback_20260404_software_domain_redesign.sql (rollback reference)

BEGIN;

-- ============================================================================
-- 1. test_software — 시험용 소프트웨어 관리대장 (UL-QP-18-07)
-- ============================================================================
CREATE TABLE IF NOT EXISTS test_software (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  management_number VARCHAR(20) NOT NULL,
  name            VARCHAR(200) NOT NULL,
  software_version VARCHAR(100),
  test_field      VARCHAR(10) NOT NULL,
  manufacturer    VARCHAR(200),
  location        VARCHAR(50),
  primary_manager_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  secondary_manager_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  installed_at    TIMESTAMP,
  availability    VARCHAR(20) NOT NULL DEFAULT 'available',
  requires_validation BOOLEAN NOT NULL DEFAULT true,
  site            VARCHAR(10),
  created_by      UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP NOT NULL DEFAULT now(),
  version         INTEGER NOT NULL DEFAULT 1
);

-- test_software indexes
CREATE INDEX IF NOT EXISTS test_software_management_number_idx ON test_software (management_number);
CREATE INDEX IF NOT EXISTS test_software_test_field_idx ON test_software (test_field);
CREATE INDEX IF NOT EXISTS test_software_availability_idx ON test_software (availability);
CREATE INDEX IF NOT EXISTS test_software_site_idx ON test_software (site);

-- ============================================================================
-- 2. software_validations — 소프트웨어 유효성 확인 (UL-QP-18-09)
-- ============================================================================
CREATE TABLE IF NOT EXISTS software_validations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  test_software_id    UUID NOT NULL REFERENCES test_software(id) ON DELETE RESTRICT,
  validation_type     VARCHAR(20) NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'draft',

  -- 검증 대상 버전 및 공통 필드
  software_version    VARCHAR(100),
  test_date           TIMESTAMP,
  info_date           TIMESTAMP,
  software_author     VARCHAR(200),

  -- 방법 1: 공급자 시연 (vendor)
  vendor_name         VARCHAR(200),
  vendor_summary      TEXT,
  received_by         UUID REFERENCES users(id) ON DELETE RESTRICT,
  received_date       TIMESTAMP,
  attachment_note     TEXT,

  -- 방법 2: UL 자체 시험 (self)
  reference_documents TEXT,
  operating_unit_description TEXT,
  software_components TEXT,
  hardware_components TEXT,
  acquisition_functions JSONB,
  processing_functions  JSONB,
  control_functions     JSONB,
  performed_by        UUID REFERENCES users(id) ON DELETE RESTRICT,

  -- 승인 프로세스
  submitted_at        TIMESTAMP,
  submitted_by        UUID REFERENCES users(id) ON DELETE RESTRICT,
  technical_approver_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  technical_approved_at TIMESTAMP,
  quality_approver_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  quality_approved_at TIMESTAMP,
  rejected_by         UUID REFERENCES users(id) ON DELETE RESTRICT,
  rejected_at         TIMESTAMP,
  rejection_reason    TEXT,

  -- 생성자 및 시스템 필드
  created_by          UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at          TIMESTAMP NOT NULL DEFAULT now(),
  updated_at          TIMESTAMP NOT NULL DEFAULT now(),
  version             INTEGER NOT NULL DEFAULT 1
);

-- software_validations indexes
CREATE INDEX IF NOT EXISTS software_validations_test_software_id_idx ON software_validations (test_software_id);
CREATE INDEX IF NOT EXISTS software_validations_status_idx ON software_validations (status);
CREATE INDEX IF NOT EXISTS software_validations_validation_type_idx ON software_validations (validation_type);

-- ============================================================================
-- 3. equipment_test_software — 장비 ↔ 시험용 소프트웨어 M:N 중간 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS equipment_test_software (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  equipment_id      UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  test_software_id  UUID NOT NULL REFERENCES test_software(id) ON DELETE CASCADE,
  notes             TEXT,
  created_at        TIMESTAMP NOT NULL DEFAULT now()
);

-- equipment_test_software unique index (M:N 중복 방지)
CREATE UNIQUE INDEX IF NOT EXISTS equipment_test_software_unique_idx
  ON equipment_test_software (equipment_id, test_software_id);

-- ============================================================================
-- 4. documents 테이블에 software_validation FK 추가
-- ============================================================================
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS software_validation_id UUID
    REFERENCES software_validations(id)
    ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS documents_software_validation_id_idx
  ON documents (software_validation_id);

CREATE INDEX IF NOT EXISTS documents_software_validation_type_idx
  ON documents (software_validation_id, document_type);

COMMIT;
