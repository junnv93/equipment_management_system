/**
 * Notification Component Tokens (Architecture v3)
 *
 * SSOT: Visual Feedback System 기반 알림 디자인
 * - Count → Urgency Level → Visual Feedback (명시적 매핑)
 * - 하드코딩 제거, Design Token 참조
 *
 * SSOT 역할:
 * - NOTIFICATION_LIST_HEADER_TOKENS: 리스트 페이지 헤더
 * - NOTIFICATION_LIST_FILTER_TOKENS: 탭 + 필터 바
 * - NOTIFICATION_LIST_ITEM_TOKENS: 알림 아이템 카드
 * - NOTIFICATION_LIST_SKELETON_TOKENS: 로딩 스켈레톤
 * - NOTIFICATION_LIST_EMPTY_TOKENS: 빈 상태
 * - NOTIFICATION_LIST_PAGINATION_TOKENS: 페이지네이션
 *
 * @see ../visual-feedback.ts - SSOT for urgency-based feedback
 */

import { MOTION_TOKENS, ELEVATION_TOKENS } from '../semantic';
import { getStaggerDelay, ANIMATION_PRESETS, TRANSITION_PRESETS } from '../motion';
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
 * Empty State (알림 없음) — 드롭다운용
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

// ─────────────────────────────────────────────────────────────────────────────
// 리스트 페이지 토큰 (알림 목록 전체 페이지)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 리스트 페이지 헤더
 */
export const NOTIFICATION_LIST_HEADER_TOKENS = {
  container: 'flex items-center justify-between flex-wrap gap-4',
  iconWrapper: 'relative',
  icon: 'h-6 w-6 text-primary',
  unreadBadge:
    'absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive flex items-center justify-center',
  unreadBadgeText: 'text-xs text-destructive-foreground tabular-nums font-bold',
  titleGroup: 'flex items-center gap-3',
  title: 'text-2xl font-bold tracking-tight text-foreground',
  subtitle: 'text-sm text-muted-foreground tabular-nums',
} as const;

/**
 * 탭 + 필터 바
 */
export const NOTIFICATION_LIST_FILTER_TOKENS = {
  filterRow: 'flex items-center justify-between flex-wrap gap-3',
  filterGroup: 'flex items-center gap-2',
  tabBadge:
    'ml-1 rounded-full bg-destructive px-1.5 py-0.5 text-xs text-destructive-foreground tabular-nums',
  categorySelect: 'w-[130px]',
  searchInput: 'w-[200px]',
  tabContent: 'mt-4',
} as const;

/**
 * 알림 아이템 카드 (리스트 페이지용)
 */
export const NOTIFICATION_LIST_ITEM_TOKENS = {
  wrapper: 'relative group motion-safe:animate-[staggerFadeIn_0.3s_ease-out_forwards]',

  card: {
    base: [
      'group p-4 mb-2 rounded-lg shadow-sm relative border-l-4 block w-full text-left',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      TRANSITION_PRESETS.moderateShadowTransform,
      'motion-safe:hover:shadow-lg motion-safe:hover:scale-[1.01] motion-safe:hover:-translate-y-0.5',
    ].join(' '),
    unread: 'bg-card motion-safe:animate-[pulseGlow_3s_ease-in-out_infinite]',
    read: 'bg-muted/80 opacity-60',
  },

  indicator: {
    dot: 'absolute right-3 top-3 h-2 w-2 rounded-full bg-primary motion-safe:animate-badge-pulse',
  },

  iconCircle: [
    'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
    TRANSITION_PRESETS.fastTransform,
    'motion-safe:group-hover:scale-110',
  ].join(' '),
  iconSize: 'h-4 w-4',

  content: 'flex-1 min-w-0',
  title: 'font-semibold text-sm line-clamp-2 tracking-tight leading-snug',
  body: 'text-sm text-muted-foreground mt-1 line-clamp-3 leading-relaxed',
  timeRow: 'flex items-center gap-1 text-xs text-muted-foreground/60 mt-2',
  timeIcon: 'h-3 w-3',

  deleteBtn: [
    'absolute right-2 top-2 h-6 w-6',
    'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
    TRANSITION_PRESETS.fastOpacity,
  ].join(' '),
  deleteIcon: 'h-3 w-3',
} as const;

/**
 * 로딩 스켈레톤
 */
export const NOTIFICATION_LIST_SKELETON_TOKENS = {
  container: 'space-y-3',
  card: 'p-4 rounded-lg bg-muted/50 border-l-4 border-muted animate-pulse',
  row: 'flex items-start gap-3',
  iconPlaceholder: 'h-4 w-4 rounded bg-muted-foreground/20 mt-1',
  contentGroup: 'flex-1 space-y-2',
  titleLine: 'h-4 bg-muted-foreground/20 rounded w-3/4',
  bodyLine: 'h-3 bg-muted-foreground/10 rounded w-full',
  timeLine: 'h-3 bg-muted-foreground/10 rounded w-1/4',
} as const;

/**
 * 빈 상태 (리스트 페이지용)
 */
export const NOTIFICATION_LIST_EMPTY_TOKENS = {
  container: 'py-16 text-center',
  iconWrapper: 'relative inline-block mb-4 motion-safe:animate-gentle-bounce',
  icon: 'h-16 w-16 mx-auto text-muted-foreground/30',
  checkmark: [
    'absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-success',
    'flex items-center justify-center motion-safe:animate-checkmark-pop shadow-lg',
  ].join(' '),
  checkmarkText: 'text-xs text-success-foreground font-bold',
  title: 'text-lg font-semibold mb-2 tracking-tight',
  desc: 'text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed',
} as const;

/**
 * 페이지네이션
 */
export const NOTIFICATION_LIST_PAGINATION_TOKENS = {
  container: 'flex items-center justify-between',
  info: 'text-sm text-muted-foreground tabular-nums',
  buttonGroup: 'flex gap-2',
} as const;
