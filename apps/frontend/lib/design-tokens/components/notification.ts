/**
 * Notification Component Tokens (Architecture v3)
 *
 * SSOT: Visual Feedback System 기반 알림 디자인
 * - Count → Urgency Level → Visual Feedback (명시적 매핑)
 * - 하드코딩 제거, Design Token 참조
 *
 * @see ../visual-feedback.ts - SSOT for urgency-based feedback
 */

import { MOTION_TOKENS, ELEVATION_TOKENS } from '../semantic';
import { getStaggerDelay, ANIMATION_PRESETS } from '../motion';
import { getCountBasedUrgency, getUrgencyFeedbackClasses } from '../visual-feedback';

/**
 * 배지 시각적 강조 레벨 (DEPRECATED)
 *
 * @deprecated Use getCountBasedUrgency() + getUrgencyFeedbackClasses() instead
 *
 * 마이그레이션 예시:
 * ```tsx
 * // Before
 * const variant = NOTIFICATION_BADGE_VARIANTS[getNotificationBadgeVariant(count)];
 *
 * // After
 * const urgency = getCountBasedUrgency(count);
 * const classes = getUrgencyFeedbackClasses(urgency);
 * ```
 */
export const NOTIFICATION_BADGE_VARIANTS = {
  default: { scale: 'scale-100', animation: '', ring: '' },
  attention: {
    scale: 'scale-105',
    animation: '',
    ring: 'ring-1 ring-destructive/30 ring-offset-1',
  },
  urgent: { scale: 'scale-110', animation: '', ring: 'ring-2 ring-destructive/50 ring-offset-2' },
} as const;

/**
 * 알림 개수에 따른 배지 variant 결정 (DEPRECATED)
 *
 * @deprecated Use getCountBasedUrgency() instead
 */
export function getNotificationBadgeVariant(
  count: number
): keyof typeof NOTIFICATION_BADGE_VARIANTS {
  if (count >= 10) return 'urgent';
  if (count >= 6) return 'attention';
  return 'default';
}

/**
 * 배지 스타일 클래스 조합 (Architecture v3)
 *
 * SSOT: Visual Feedback System 위임
 * - Count → Urgency Level → Feedback Classes
 * - 애니메이션 제어 옵션 추가 (기본: 애니메이션 없음)
 *
 * @param count - 읽지 않은 알림 개수
 * @param includeAnimation - pulse 애니메이션 포함 여부 (기본: false)
 * @returns Tailwind 클래스 문자열
 *
 * @example
 * ```tsx
 * // 기본 (애니메이션 없음) - 권장
 * <Badge className={getNotificationBadgeClasses(15)}>15</Badge>
 *
 * // 긴급 상황에만 애니메이션 포함
 * <Badge className={getNotificationBadgeClasses(25, true)}>25</Badge>
 * ```
 */
export function getNotificationBadgeClasses(count: number, includeAnimation = false): string {
  const urgency = getCountBasedUrgency(count);
  const feedbackClasses = getUrgencyFeedbackClasses(urgency, includeAnimation);

  return [
    feedbackClasses,
    'font-bold', // 가독성 강조 (알림 전용)
    'tabular-nums', // 숫자 정렬 (모노스페이스)
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
