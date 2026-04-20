-- Migration 0033: Backfill calibrations.certificate_path → documents table
-- Phase 4a of certificatePath deprecation (4-stage rolling migration)
--
-- Inserts a documents row for every calibration that has certificate_path set
-- but no corresponding calibration_certificate document yet.
-- Backfilled rows are marked with description '[migrated from calibrations.certificate_path]'
-- so they can be identified and cleaned up if needed.

INSERT INTO documents (
  calibration_id,
  document_type,
  description,
  file_path,
  file_name,
  original_file_name,
  file_size,
  mime_type,
  file_hash,
  uploaded_by,
  is_latest,
  parent_document_id,
  revision_number,
  status,
  created_at,
  updated_at
)
SELECT
  c.id,
  'calibration_certificate',
  '[migrated from calibrations.certificate_path]',
  c.certificate_path,
  regexp_replace(c.certificate_path, '^.*/', ''),
  regexp_replace(c.certificate_path, '^.*/', ''),
  0,
  'application/octet-stream',
  NULL,
  NULL,
  true,
  NULL,
  1,
  'active',
  c.created_at,
  NOW()
FROM calibrations c
WHERE c.certificate_path IS NOT NULL
  AND c.certificate_path <> ''
  AND NOT EXISTS (
    SELECT 1 FROM documents d
    WHERE d.calibration_id = c.id
      AND d.document_type = 'calibration_certificate'
  );
