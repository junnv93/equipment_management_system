-- 교정계획 카테고리 알림 설정 컬럼 추가
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS calibration_plan_enabled BOOLEAN NOT NULL DEFAULT true;
