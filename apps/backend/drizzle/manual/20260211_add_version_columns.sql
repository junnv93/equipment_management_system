-- Optimistic Locking: 4개 승인 모듈에 version 컬럼 추가
-- CAS(Compare-And-Swap) 패턴으로 동시 승인/반려 방지
-- 기존 행은 version=1 (기본값)로 시작

-- Calibrations
ALTER TABLE calibrations ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Non-Conformances
ALTER TABLE non_conformances ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Equipment-Imports (actual table name: rental_imports)
ALTER TABLE rental_imports ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Disposal-Requests
ALTER TABLE disposal_requests ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
