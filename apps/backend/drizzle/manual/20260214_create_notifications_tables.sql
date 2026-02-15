-- 알림 시스템 프로덕션 마이그레이션
-- Phase 1: notifications + notification_preferences 테이블 생성

-- ============================================================================
-- 1. notifications 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 알림 내용
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(10) NOT NULL DEFAULT 'medium',

  -- 수신 대상 (3가지 전략)
  recipient_id UUID,           -- 특정 사용자
  team_id UUID,                -- 팀 전체 (단일 레코드)
  is_system_wide BOOLEAN NOT NULL DEFAULT false,  -- 전체 사용자

  -- 관련 엔티티
  equipment_id UUID,
  entity_type VARCHAR(50),
  entity_id UUID,
  link_url VARCHAR(300),

  -- 읽음 상태
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP,

  -- 이벤트 발생자
  actor_id UUID,
  actor_name VARCHAR(100),

  -- 만료
  expires_at TIMESTAMP,

  -- 시스템 필드
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 인덱스: "내 미읽은 알림" 메인 쿼리
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read_created
  ON notifications (recipient_id, is_read, created_at DESC);

-- 인덱스: 팀 알림 조회
CREATE INDEX IF NOT EXISTS idx_notifications_team_created
  ON notifications (team_id, created_at DESC);

-- 인덱스: 시스템 공지 조회
CREATE INDEX IF NOT EXISTS idx_notifications_system_created
  ON notifications (is_system_wide, created_at DESC);

-- 인덱스: 엔티티별 알림 조회
CREATE INDEX IF NOT EXISTS idx_notifications_entity
  ON notifications (entity_type, entity_id);

-- 인덱스: 만료 알림 정리 스케줄러
CREATE INDEX IF NOT EXISTS idx_notifications_expires
  ON notifications (expires_at);

-- ============================================================================
-- 2. notification_preferences 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,

  -- 전체 토글
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT false,

  -- 카테고리별 토글 (7개)
  checkout_enabled BOOLEAN NOT NULL DEFAULT true,
  calibration_enabled BOOLEAN NOT NULL DEFAULT true,
  non_conformance_enabled BOOLEAN NOT NULL DEFAULT true,
  disposal_enabled BOOLEAN NOT NULL DEFAULT true,
  equipment_import_enabled BOOLEAN NOT NULL DEFAULT true,
  equipment_enabled BOOLEAN NOT NULL DEFAULT true,
  system_enabled BOOLEAN NOT NULL DEFAULT true,

  -- 수신 빈도
  frequency VARCHAR(20) NOT NULL DEFAULT 'immediate',
  digest_time VARCHAR(5) NOT NULL DEFAULT '09:00',

  -- 시스템 필드
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 인덱스: userId 조회 최적화
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user
  ON notification_preferences (user_id);
