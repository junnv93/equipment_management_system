-- 알림 테이블에 수신자 사이트 컬럼 추가 (감사 추적 + 관리자 통계)
-- nullable: 기존 데이터 호환 + isSystemWide 알림은 단일 사이트 없음

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_site VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_notifications_site_created
  ON notifications (recipient_site, created_at);

-- 기존 데이터 백필: users 테이블에서 site 조회
UPDATE notifications n
SET recipient_site = u.site
FROM users u
WHERE n.recipient_id = u.id AND n.recipient_site IS NULL;
