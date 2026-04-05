-- 문서 테이블에 소프트웨어 유효성확인 FK 추가
-- documents.software_validation_id → software_validations.id (cascade delete)

ALTER TABLE documents
  ADD COLUMN software_validation_id UUID
    REFERENCES software_validations(id)
    ON DELETE CASCADE;

-- 단일 컬럼 인덱스
CREATE INDEX IF NOT EXISTS documents_software_validation_id_idx
  ON documents (software_validation_id);

-- 복합 인덱스 (유효성확인 + 문서유형)
CREATE INDEX IF NOT EXISTS documents_software_validation_type_idx
  ON documents (software_validation_id, document_type);
