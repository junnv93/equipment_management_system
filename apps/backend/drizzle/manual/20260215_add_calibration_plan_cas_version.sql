-- 교정계획서 CAS(Optimistic Locking) 지원을 위한 cas_version 컬럼 추가
-- 기존 version 필드는 계획서 개정 버전 관리용, cas_version은 동시 수정 방지용
ALTER TABLE calibration_plans ADD COLUMN IF NOT EXISTS cas_version INTEGER DEFAULT 1 NOT NULL;
