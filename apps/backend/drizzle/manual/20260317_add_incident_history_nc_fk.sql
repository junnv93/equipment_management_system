-- Migration: Add non_conformance_id FK to equipment_incident_history
-- Date: 2026-03-17
-- Purpose: 사고 이력과 부적합의 구조적 관계를 DB FK로 관리 (content 문자열에 UUID 끼워넣기 안티패턴 제거)

-- 1. FK 컬럼 추가
ALTER TABLE equipment_incident_history
  ADD COLUMN IF NOT EXISTS non_conformance_id UUID
  REFERENCES non_conformances(id) ON DELETE SET NULL;

-- 2. 인덱스 추가 (장비별 조회 + 부적합 연결 조회)
CREATE INDEX IF NOT EXISTS incident_history_equipment_id_idx
  ON equipment_incident_history(equipment_id);

CREATE INDEX IF NOT EXISTS incident_history_nc_id_idx
  ON equipment_incident_history(non_conformance_id);

-- 3. 기존 데이터 마이그레이션: content에서 UUID를 추출하여 FK 컬럼에 저장
-- 패턴: "교정 기한 초과로 인한 자동 부적합 전환 (부적합 ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"
UPDATE equipment_incident_history ih
SET non_conformance_id = (
  substring(ih.content FROM '부적합 ID: ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')
)::uuid
WHERE ih.incident_type = 'calibration_overdue'
  AND ih.non_conformance_id IS NULL
  AND ih.content LIKE '%부적합 ID:%';

-- 4. 마이그레이션된 레코드의 content에서 UUID 부분 제거 (깨끗한 메시지로 정리)
UPDATE equipment_incident_history
SET content = '교정 기한 초과로 인한 자동 부적합 전환'
WHERE incident_type = 'calibration_overdue'
  AND content LIKE '%부적합 ID:%';
