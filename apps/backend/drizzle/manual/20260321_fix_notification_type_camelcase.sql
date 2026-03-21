-- Migration: 알림 type 컬럼 camelCase → snake_case 정규화
-- Date: 2026-03-21
-- Purpose: 기존 eventName.replace('.', '_')만 적용되어 camelCase가 보존된 레코드를
--          NOTIFICATION_TYPE_VALUES SSOT에 맞는 snake_case로 변환
--
-- 영향 범위:
--   camelCase가 포함된 이벤트 (~60%):
--   checkout_returnApproved → checkout_return_approved
--   calibrationPlan_submitted → calibration_plan_submitted
--   nonConformance_created → non_conformance_created
--   equipmentImport_created → equipment_import_created
--   intermediateCheck_completed → intermediate_check_completed
--   calibrationFactor_approved → calibration_factor_approved
--   등
--
-- 안전성:
--   - 멱등: 이미 snake_case인 레코드는 WHERE 조건에 매칭되지 않음
--   - regexp_replace는 camelCase 경계만 대상 (소문자→대문자 전이)
--   - 롤백: rollback_20260321_fix_notification_type_camelcase.sql

-- camelCase가 포함된 type 값을 snake_case로 변환
-- regexp_replace(type, '([a-z])([A-Z])', '\1_\2', 'g')는 camelCase 경계에 '_' 삽입
UPDATE notifications
SET type = lower(regexp_replace(type, '([a-z])([A-Z])', '\1_\2', 'g'))
WHERE type ~ '[a-z][A-Z]';
