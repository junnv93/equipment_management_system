-- pg_trgm GIN 인덱스: LIKE/ILIKE 검색 성능 최적화
-- B-tree 인덱스는 %search% (contains) 패턴에서 sequential scan으로 폴백
-- GIN trigram 인덱스는 contains 패턴에서도 인덱스 스캔을 사용하여 10-100x 빠름
--
-- 대상: ilike() 검색이 사용되는 모든 텍스트 컬럼 (9개 서비스)

-- 1. pg_trgm 확장 활성화
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. 장비 (equipment) — 4개 컬럼, 가장 빈번한 검색 대상
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_name_gin
  ON equipment USING GIN (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_management_number_gin
  ON equipment USING GIN (management_number gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_serial_number_gin
  ON equipment USING GIN (serial_number gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_description_gin
  ON equipment USING GIN (description gin_trgm_ops);

-- 3. 사용자 (users) — 4개 컬럼
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_name_gin
  ON users USING GIN (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_gin
  ON users USING GIN (email gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_position_gin
  ON users USING GIN (position gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_department_gin
  ON users USING GIN (department gin_trgm_ops);

-- 4. 팀 (teams) — 2개 컬럼
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teams_name_gin
  ON teams USING GIN (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teams_description_gin
  ON teams USING GIN (description gin_trgm_ops);

-- 5. 알림 (notifications) — 2개 컬럼
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_title_gin
  ON notifications USING GIN (title gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_content_gin
  ON notifications USING GIN (content gin_trgm_ops);

-- 6. 반출 (checkouts) — 3개 컬럼
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_checkouts_destination_gin
  ON checkouts USING GIN (destination gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_checkouts_reason_gin
  ON checkouts USING GIN (reason gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_checkouts_address_gin
  ON checkouts USING GIN (address gin_trgm_ops);

-- 7. 교정 (calibrations) — 3개 컬럼
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calibrations_agency_name_gin
  ON calibrations USING GIN (agency_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calibrations_certificate_number_gin
  ON calibrations USING GIN (certificate_number gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calibrations_notes_gin
  ON calibrations USING GIN (notes gin_trgm_ops);

-- 8. 교정인자 (calibration_factors) — 1개 컬럼
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calibration_factors_factor_name_gin
  ON calibration_factors USING GIN (factor_name gin_trgm_ops);

-- 9. 소프트웨어 이력 (software_history) — 2개 컬럼
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_software_history_software_name_gin
  ON software_history USING GIN (software_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_software_history_verification_record_gin
  ON software_history USING GIN (verification_record gin_trgm_ops);

-- 10. 부적합 (non_conformances) — 1개 컬럼
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_non_conformances_cause_gin
  ON non_conformances USING GIN (cause gin_trgm_ops);

-- 11. 장비 반입 (equipment_imports) — 3개 컬럼
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_imports_equipment_name_gin
  ON equipment_imports USING GIN (equipment_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_imports_vendor_name_gin
  ON equipment_imports USING GIN (vendor_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_imports_owner_department_gin
  ON equipment_imports USING GIN (owner_department gin_trgm_ops);
