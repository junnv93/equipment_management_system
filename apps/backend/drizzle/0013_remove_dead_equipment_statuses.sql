-- Migration: Remove dead equipment statuses
-- retired → disposed, calibration_scheduled → available, calibration_overdue → non_conforming
--
-- PostgreSQL enum 값은 제거 불가하므로 DB enum 타입은 그대로 유지.
-- 앱 레벨 Zod 검증이 제거된 상태값의 신규 유입을 차단함.

UPDATE equipment SET status = 'disposed' WHERE status = 'retired';
UPDATE equipment SET status = 'available' WHERE status = 'calibration_scheduled';
UPDATE equipment SET status = 'non_conforming' WHERE status = 'calibration_overdue';
