-- 20260212_add_equipment_requests_version.sql
-- A-1: equipment_requests 테이블에 version 컬럼 추가 (Optimistic Locking / CAS)
-- 다른 8개 승인 테이블과 동일한 패턴 적용

-- 1. version 컬럼 추가 (기존 행은 version=1로 초기화)
ALTER TABLE equipment_requests
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- 2. CAS 복합 인덱스 추가 (id + version)
CREATE INDEX IF NOT EXISTS equipment_requests_id_version_idx
  ON equipment_requests (id, version);
