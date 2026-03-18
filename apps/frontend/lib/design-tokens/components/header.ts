/**
 * Header Component Tokens (Layer 3: Component-Specific)
 *
 * Semantic tokens를 Header 컴포넌트 맥락에 맞게 조합합니다.
 * 다른 컴포넌트(sidebar, toolbar 등)도 같은 패턴으로 확장 가능합니다.
 *
 * SSOT: Header의 모든 스타일은 여기서만 정의
 */

import { INTERACTIVE_TOKENS, CONTENT_TOKENS } from '../semantic';
import { toTailwindSize, toTailwindGap } from '../primitives';
import { TRANSITION_PRESETS } from '../motion';

/**
 * Header Interactive 버튼 크기
 *
 * Semantic token 기반 - primitive 변경 시 자동 업데이트
 */
export const HEADER_SIZES = {
  /** 버튼 컨테이너 (터치 영역) */
  container:
    toTailwindSize(INTERACTIVE_TOKENS.size.standard, 'h') +
    ' ' +
    toTailwindSize(INTERACTIVE_TOKENS.size.standard, 'w'),

  /** 아이콘 */
  icon:
    toTailwindSize(INTERACTIVE_TOKENS.icon.standard, 'h') +
    ' ' +
    toTailwindSize(INTERACTIVE_TOKENS.icon.standard, 'w'),

  /** 배지 (알림 카운트) */
  badge:
    toTailwindSize(CONTENT_TOKENS.badge.medium, 'h') +
    ' ' +
    toTailwindSize(CONTENT_TOKENS.badge.medium, 'min-w'),

  /** 아바타 */
  avatar:
    toTailwindSize(CONTENT_TOKENS.avatar.medium, 'h') +
    ' ' +
    toTailwindSize(CONTENT_TOKENS.avatar.medium, 'w'),
} as const;

/**
 * Header 간격
 */
export const HEADER_SPACING = {
  /** 요소 간 수평 간격 */
  gap: toTailwindGap(INTERACTIVE_TOKENS.spacing.gap),
} as const;

/**
 * Header Interactive 스타일
 *
 * 일관된 상호작용 패턴
 */
export const HEADER_INTERACTIVE_STYLES = {
  /** 포커스 (WCAG 2.1 AAA) */
  focus: [
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-brand-info',
    'focus-visible:ring-offset-2',
  ].join(' '),

  /** 호버 */
  hover: 'hover:bg-muted/80',

  /** Transition (Web Interface Guidelines 준수) */
  transition: TRANSITION_PRESETS.fastAll,

  /** 버튼 모양 */
  shape: 'rounded-full', // 원형 버튼
} as const;

/**
 * Header 버튼 전체 스타일
 *
 * 모든 interactive 요소가 사용하는 기본 클래스 조합
 */
export function getHeaderButtonClasses(): string {
  return [
    HEADER_SIZES.container,
    HEADER_INTERACTIVE_STYLES.shape,
    HEADER_INTERACTIVE_STYLES.focus,
    HEADER_INTERACTIVE_STYLES.hover,
    HEADER_INTERACTIVE_STYLES.transition,
  ].join(' ');
}

/**
 * 크기별 클래스 가져오기
 *
 * @param element - 요소 타입
 * @returns Tailwind 클래스 문자열
 */
export function getHeaderSizeClasses(element: 'container' | 'icon' | 'badge' | 'avatar'): string {
  return HEADER_SIZES[element];
}

/**
 * 간격 클래스
 */
export function getHeaderSpacingClass(): string {
  return HEADER_SPACING.gap;
}

/**
 * 알림 배지 위치 (반응형)
 *
 * 컨테이너 크기에 따라 자동 조정
 */
export const NOTIFICATION_BADGE_POSITION = {
  mobile: '-right-0.5 -top-0.5', // 44px 컨테이너
  desktop: 'md:-right-1 md:-top-1', // 40px 컨테이너
} as const;

export function getNotificationBadgePositionClass(): string {
  return `${NOTIFICATION_BADGE_POSITION.mobile} ${NOTIFICATION_BADGE_POSITION.desktop}`;
}
