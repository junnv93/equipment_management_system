-- 장비 상태에 'non_conforming' 추가
-- 프롬프트 7-1: 부적합 장비 스키마
--
-- 참고: equipment.status는 varchar 타입이므로 데이터베이스 수준의
-- enum 변경이 필요하지 않습니다.
-- 애플리케이션 레벨에서 packages/schemas/src/enums.ts의
-- EquipmentStatusEnum에 'non_conforming'이 추가되었습니다.
--
-- 이 파일은 문서 요구사항에 따라 생성되었으며,
-- non_conforming 상태 추가에 대한 기록 목적입니다.

-- 상태값 검증을 위한 코멘트 업데이트
COMMENT ON COLUMN "equipment"."status" IS '장비 상태: available, in_use, checked_out, calibration_scheduled, calibration_overdue, under_maintenance, non_conforming, retired';
