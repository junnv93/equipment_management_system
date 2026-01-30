-- 장비 필터 데이터 진단 쿼리
-- 목적: 필터가 작동하지 않는 원인을 데이터 관점에서 분석

-- ==============================================================
-- 1. classificationCode 분포 확인
-- ==============================================================
SELECT
    'classificationCode 분포' AS category,
    classification_code AS value,
    COUNT(*) AS count
FROM equipment
WHERE is_active = true
GROUP BY classification_code
ORDER BY classification_code;

-- classificationCode NULL 확인
SELECT
    'classificationCode NULL 확인' AS category,
    COUNT(*) AS total,
    COUNT(classification_code) AS with_code,
    COUNT(*) FILTER (WHERE classification_code IS NULL) AS missing_code
FROM equipment
WHERE is_active = true;

-- ==============================================================
-- 2. isShared 분포 확인
-- ==============================================================
SELECT
    'isShared 분포' AS category,
    is_shared AS value,
    COUNT(*) AS count
FROM equipment
WHERE is_active = true
GROUP BY is_shared;

-- ==============================================================
-- 3. 교정 기한 분포 확인
-- ==============================================================
SELECT
    '교정 기한 분포' AS category,
    CASE
        WHEN next_calibration_date IS NULL THEN 'no_date'
        WHEN next_calibration_date < NOW() THEN 'overdue'
        WHEN next_calibration_date BETWEEN NOW() AND NOW() + INTERVAL '30 days' THEN 'due_soon'
        ELSE 'normal'
    END AS value,
    COUNT(*) AS count
FROM equipment
WHERE is_active = true
GROUP BY
    CASE
        WHEN next_calibration_date IS NULL THEN 'no_date'
        WHEN next_calibration_date < NOW() THEN 'overdue'
        WHEN next_calibration_date BETWEEN NOW() AND NOW() + INTERVAL '30 days' THEN 'due_soon'
        ELSE 'normal'
    END;

-- 상세: 교정 기한별 장비 목록
SELECT
    management_number,
    name,
    next_calibration_date,
    CASE
        WHEN next_calibration_date IS NULL THEN 'no_date'
        WHEN next_calibration_date < NOW() THEN 'overdue'
        WHEN next_calibration_date BETWEEN NOW() AND NOW() + INTERVAL '30 days' THEN 'due_soon'
        ELSE 'normal'
    END AS calibration_status
FROM equipment
WHERE is_active = true
ORDER BY next_calibration_date NULLS LAST;

-- ==============================================================
-- 4. 교정 방법 분포 확인
-- ==============================================================
SELECT
    'calibrationMethod 분포' AS category,
    calibration_method AS value,
    COUNT(*) AS count
FROM equipment
WHERE is_active = true
GROUP BY calibration_method;

-- ==============================================================
-- 5. 상태 분포 확인
-- ==============================================================
SELECT
    'status 분포' AS category,
    status AS value,
    COUNT(*) AS count
FROM equipment
WHERE is_active = true
GROUP BY status
ORDER BY status;

-- ==============================================================
-- 6. 필터 조합별 데이터 존재 확인
-- ==============================================================

-- classification=fcc_emc_rf (E코드) + available
SELECT
    'classification=fcc_emc_rf + available' AS filter_combo,
    COUNT(*) AS count
FROM equipment
WHERE is_active = true
  AND classification_code = 'E'
  AND status = 'available';

-- isShared=true
SELECT
    'isShared=true' AS filter_combo,
    COUNT(*) AS count
FROM equipment
WHERE is_active = true
  AND is_shared = true;

-- calibrationOverdue (next_calibration_date < NOW())
SELECT
    'calibrationOverdue' AS filter_combo,
    COUNT(*) AS count
FROM equipment
WHERE is_active = true
  AND next_calibration_date IS NOT NULL
  AND next_calibration_date < NOW();

-- calibrationMethod=external_calibration
SELECT
    'calibrationMethod=external_calibration' AS filter_combo,
    COUNT(*) AS count
FROM equipment
WHERE is_active = true
  AND calibration_method = 'external_calibration';

-- calibrationMethod=not_applicable
SELECT
    'calibrationMethod=not_applicable' AS filter_combo,
    COUNT(*) AS count
FROM equipment
WHERE is_active = true
  AND calibration_method = 'not_applicable';

-- ==============================================================
-- 7. 공용장비 상세 목록
-- ==============================================================
SELECT
    management_number,
    name,
    is_shared,
    shared_source,
    status
FROM equipment
WHERE is_active = true AND is_shared = true;
