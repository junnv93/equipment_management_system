-- 기존 자체점검 고정 4컬럼 데이터를 self_inspection_items 자식 테이블로 마이그레이션
-- 기존 컬럼(appearance, functionality, safety, calibration_status)은 하위 호환을 위해 유지

INSERT INTO self_inspection_items (inspection_id, item_number, check_item, check_result)
SELECT id, 1, '외관검사', appearance
FROM equipment_self_inspections
WHERE appearance IS NOT NULL

UNION ALL

SELECT id, 2, '기능 점검', functionality
FROM equipment_self_inspections
WHERE functionality IS NOT NULL

UNION ALL

SELECT id, 3, '안전 점검', safety
FROM equipment_self_inspections
WHERE safety IS NOT NULL

UNION ALL

SELECT id, 4, '교정 상태 점검', calibration_status
FROM equipment_self_inspections
WHERE calibration_status IS NOT NULL

ORDER BY 1, 2;
