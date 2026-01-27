-- 장비 데이터 팀/분류코드 마이그레이션
-- 날짜: 2026-01-27
-- 목적: 모든 장비에 site, team_id, classification_code 속성 채우기

-- 1. 먼저 팀 테이블 업데이트 실행 (20260127_team_classification_mapping.sql)

-- 2. 표준 관리번호 형식(XXX-XYYYY)을 가진 장비의 분류코드 추출 및 업데이트
-- SUW-E0001 → classification_code = 'E'
UPDATE equipment
SET classification_code = SUBSTRING(management_number FROM 5 FOR 1)
WHERE management_number ~ '^(SUW|UIW|PYT)-[ERSAP]\d{4}$'
  AND classification_code IS NULL;

-- 3. 분류코드 기반으로 팀 할당
-- 수원 장비 (site = 'suwon')
UPDATE equipment e
SET team_id = t.id
FROM teams t
WHERE e.site = 'suwon'
  AND e.team_id IS NULL
  AND t.site = 'suwon'
  AND t.classification_code = e.classification_code;

-- 의왕 장비 (site = 'uiwang')
UPDATE equipment e
SET team_id = t.id
FROM teams t
WHERE e.site = 'uiwang'
  AND e.team_id IS NULL
  AND t.site = 'uiwang'
  AND t.classification_code = e.classification_code;

-- 4. 분류코드가 없는 장비에 기본값 할당 (사이트별 RF팀 기본값)
-- 수원: RF팀 (E) 기본값
UPDATE equipment
SET classification_code = 'E',
    team_id = '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1'
WHERE site = 'suwon'
  AND (classification_code IS NULL OR team_id IS NULL);

-- 의왕: RF팀 (E) 기본값
UPDATE equipment
SET classification_code = 'E',
    team_id = '55555555-5555-5555-5555-555555555555'
WHERE site = 'uiwang'
  AND (classification_code IS NULL OR team_id IS NULL);

-- 5. 결과 확인
SELECT
  site,
  classification_code,
  COUNT(*) as count,
  COUNT(team_id) as with_team
FROM equipment
GROUP BY site, classification_code
ORDER BY site, classification_code;

-- 6. team_id가 여전히 null인 장비 확인
SELECT id, name, site, classification_code, team_id
FROM equipment
WHERE team_id IS NULL;
