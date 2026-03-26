-- ============================================================================
-- 통합 문서 관리 테이블 생성 + 기존 데이터 마이그레이션
-- ============================================================================
-- 목적: calibrations.certificate_path + equipment_attachments를
--        단일 documents 테이블로 통합하여 다운로드/해시/버전관리 SSOT 구현
-- ============================================================================

BEGIN;

-- 1. documents 테이블 생성
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 소유자 연결 (다형성 FK)
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  calibration_id UUID REFERENCES calibrations(id) ON DELETE CASCADE,
  request_id UUID REFERENCES equipment_requests(id) ON DELETE CASCADE,

  -- 문서 분류
  document_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',

  -- 파일 메타데이터
  file_name VARCHAR(255) NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,

  -- 무결성
  file_hash VARCHAR(64),

  -- 버전 관리
  revision_number INTEGER NOT NULL DEFAULT 1,
  parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  is_latest BOOLEAN NOT NULL DEFAULT true,

  -- 메타데이터
  description TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- 시스템 필드
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS documents_equipment_id_idx ON documents(equipment_id);
CREATE INDEX IF NOT EXISTS documents_calibration_id_idx ON documents(calibration_id);
CREATE INDEX IF NOT EXISTS documents_request_id_idx ON documents(request_id);
CREATE INDEX IF NOT EXISTS documents_document_type_idx ON documents(document_type);
CREATE INDEX IF NOT EXISTS documents_parent_document_id_idx ON documents(parent_document_id);
CREATE INDEX IF NOT EXISTS documents_calibration_type_idx ON documents(calibration_id, document_type);
CREATE INDEX IF NOT EXISTS documents_equipment_type_idx ON documents(equipment_id, document_type);
CREATE INDEX IF NOT EXISTS documents_status_idx ON documents(status);

-- 3. 기존 calibrations.certificate_path → documents 마이그레이션
INSERT INTO documents (
  calibration_id, document_type, status,
  file_name, original_file_name, file_path,
  file_size, mime_type, uploaded_at, created_at, updated_at
)
SELECT
  c.id,
  'calibration_certificate',
  'active',
  -- 경로에서 파일명 추출
  CASE
    WHEN c.certificate_path LIKE '%/%'
    THEN substring(c.certificate_path from '[^/]+$')
    ELSE c.certificate_path
  END,
  CASE
    WHEN c.certificate_path LIKE '%/%'
    THEN substring(c.certificate_path from '[^/]+$')
    ELSE c.certificate_path
  END,
  c.certificate_path,
  0,  -- file_size 복구 불가
  'application/pdf',  -- 대부분 PDF
  COALESCE(c.updated_at, c.created_at, NOW()),
  COALESCE(c.created_at, NOW()),
  COALESCE(c.updated_at, NOW())
FROM calibrations c
WHERE c.certificate_path IS NOT NULL
  AND c.certificate_path != '';

-- 4. 기존 equipment_attachments → documents 마이그레이션
INSERT INTO documents (
  equipment_id, request_id, document_type, status,
  file_name, original_file_name, file_path,
  file_size, mime_type, description,
  uploaded_at, created_at, updated_at
)
SELECT
  ea.equipment_id,
  ea.request_id,
  ea.attachment_type::text,  -- pgEnum → varchar
  'active',
  ea.file_name,
  ea.original_file_name,
  ea.file_path,
  ea.file_size,
  ea.mime_type,
  ea.description,
  ea.uploaded_at,
  COALESCE(ea.created_at, NOW()),
  COALESCE(ea.updated_at, NOW())
FROM equipment_attachments ea;

-- 5. deprecated 표시 (컬럼/테이블은 삭제하지 않음 — 하위 호환성)
COMMENT ON COLUMN calibrations.certificate_path IS 'DEPRECATED: Use documents table. Will be removed in future migration.';
COMMENT ON TABLE equipment_attachments IS 'DEPRECATED: Use documents table. Will be removed in future migration.';

-- 마이그레이션 결과 로그
DO $$
DECLARE
  cert_count INTEGER;
  attach_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO cert_count FROM documents WHERE document_type = 'calibration_certificate';
  SELECT COUNT(*) INTO attach_count FROM documents WHERE document_type IN ('inspection_report', 'history_card', 'other');
  SELECT COUNT(*) INTO total_count FROM documents;
  RAISE NOTICE 'Documents migration complete: % certificates, % attachments, % total',
    cert_count, attach_count, total_count;
END $$;

COMMIT;
