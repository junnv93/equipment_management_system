/**
 * Notification Component Tokens
 *
 * 알림 시스템 전용 디자인 토큰
 * - 배지 스타일 (기본/긴급)
 * - 드롭다운 애니메이션
 * - 알림 아이템 스타일
 */

import { MOTION_TOKENS, ELEVATION_TOKENS } from '../semantic';
import { getStaggerDelay, ANIMATION_PRESETS } from '../motion';

/**
 * 배지 시각적 강조 레벨
 *
 * 알림 개수에 따라 다른 시각적 강도 적용
 */
export const NOTIFICATION_BADGE_VARIANTS = {
  /** 기본 (1-5개) */
  default: {
    scale: 'scale-100',
    animation: '',
    ring: '',
  },

  /** 주의 (6-9개) */
  attention: {
    scale: 'scale-105',
    animation: '',
    ring: 'ring-1 ring-destructive/30 ring-offset-1',
  },

  /** 긴급 (10개 이상) */
  urgent: {
    scale: 'scale-110',
    animation: ANIMATION_PRESETS.pulse,
    ring: 'ring-2 ring-destructive/50 ring-offset-1',
  },
} as const;

/**
 * 알림 개수에 따른 배지 variant 결정
 *
 * @param count - 읽지 않은 알림 개수
 * @returns Variant 키
 */
export function getNotificationBadgeVariant(
  count: number
): keyof typeof NOTIFICATION_BADGE_VARIANTS {
  if (count >= 10) return 'urgent';
  if (count >= 6) return 'attention';
  return 'default';
}

/**
 * 배지 스타일 클래스 조합
 *
 * @param count - 읽지 않은 알림 개수
 * @returns Tailwind 클래스 문자열
 */
export function getNotificationBadgeClasses(count: number): string {
  const variant = NOTIFICATION_BADGE_VARIANTS[getNotificationBadgeVariant(count)];

  return [
    variant.scale,
    variant.animation,
    variant.ring,
    'font-bold', // 가독성 강조
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * 드롭다운 메뉴 애니메이션
 */
export const NOTIFICATION_DROPDOWN_ANIMATION = {
  /** 등장 애니메이션 */
  enter: [
    ANIMATION_PRESETS.fadeIn,
    ANIMATION_PRESETS.slideDown,
    `duration-${MOTION_TOKENS.entrance.slide.duration}`,
  ].join(' '),

  /** 퇴장 애니메이션 */
  exit: [ANIMATION_PRESETS.fadeOut, `duration-${MOTION_TOKENS.exit.fade.duration}`].join(' '),
} as const;

/**
 * 알림 아이템 애니메이션
 *
 * @param index - 아이템 인덱스
 * @returns CSS style 객체
 */
export function getNotificationItemAnimation(index: number) {
  return {
    animationDelay: getStaggerDelay(index, 'list'),
  };
}

/**
 * 드롭다운 Z-index
 */
export const NOTIFICATION_DROPDOWN_ELEVATION = ELEVATION_TOKENS.layer.floating;

/**
 * 드롭다운 그림자
 */
export const NOTIFICATION_DROPDOWN_SHADOW = ELEVATION_TOKENS.shadow.prominent;

/**
 * 읽지 않은 알림 강조
 */
export const UNREAD_NOTIFICATION_STYLES = {
  /** 배경색 */
  background: 'bg-card',

  /** 펄스 애니메이션 (주목) */
  animation: 'motion-safe:animate-[pulseGlow_3s_ease-in-out_infinite]',

  /** 인디케이터 점 */
  indicator: {
    size: 'h-2 w-2',
    color: 'bg-primary',
    position: 'absolute right-3 top-3',
    shape: 'rounded-full',
  },
} as const;

/**
 * 읽은 알림 스타일
 */
export const READ_NOTIFICATION_STYLES = {
  background: 'bg-muted/80',
  animation: '',
} as const;

/**
 * 알림 아이템 스타일 가져오기
 *
 * @param isRead - 읽음 여부
 * @returns 스타일 객체
 */
export function getNotificationItemStyles(isRead: boolean) {
  return isRead ? READ_NOTIFICATION_STYLES : UNREAD_NOTIFICATION_STYLES;
}

/**
 * Empty State (알림 없음)
 */
export const NOTIFICATION_EMPTY_STATE = {
  icon: {
    size: 'h-10 w-10',
    color: 'text-muted-foreground/30',
  },
  checkmark: {
    size: 'h-4 w-4',
    position: 'absolute -bottom-0.5 -right-0.5',
    background: 'bg-success',
    shape: 'rounded-full',
  },
} as const;
