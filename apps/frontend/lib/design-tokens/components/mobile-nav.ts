/**
 * Mobile Nav Component Tokens (Layer 3)
 *
 * 모바일 드로어 — 라이트 테마이므로 사이드바와 다른 토큰
 * SSOT: 모바일 네비게이션의 모든 스타일은 여기서만 정의
 */

import { FOCUS_TOKENS } from '../semantic';
import { TRANSITION_PRESETS } from '../motion';

/**
 * 모바일 드로어 컨테이너 토큰
 *
 * Radix Dialog 기반 Sheet 컴포넌트 사용.
 * - focus-trap/scroll-lock/backdrop/animation → Sheet가 처리
 * - content: SheetContent className 오버라이드 (크기/테마)
 * - 이하 개별 토큰: 드로어 내부 세부 스타일
 */
export const MOBILE_NAV_DRAWER_TOKENS = {
  /**
   * SheetContent className 오버라이드
   *
   * Sheet 기본값(w-3/4, sm:max-w-sm) 대신
   * 모바일 네비 드로어 크기/테마 적용.
   */
  content: ['w-72 sm:max-w-72 p-0', 'bg-background', 'shadow-xl'].join(' '),
  background: 'bg-background',
  shadow: 'shadow-xl',
  border: 'border-r border-border',
  headerBorder: 'border-b border-border',
  text: 'text-foreground',
} as const;

/**
 * 모바일 네비게이션 아이템 토큰
 *
 * 이슈 #3: blue-600 하드코딩 → theme primary
 * 이슈 #4: bg-red-100 → theme destructive
 */
export const MOBILE_NAV_TOKENS = {
  active: {
    base: 'text-primary bg-primary/10 font-medium',
  },
  inactive: {
    base: 'text-muted-foreground hover:text-foreground hover:bg-muted',
  },
  badge: {
    background: 'bg-destructive/10',
    text: 'text-destructive',
  },
  transition: TRANSITION_PRESETS.fastBgColor,
  focus: FOCUS_TOKENS.classes.default,
} as const;

/**
 * 모바일 네비게이션 섹션 토큰
 */
export const MOBILE_NAV_SECTION_TOKENS = {
  label: 'text-[11px] font-semibold text-muted-foreground uppercase tracking-wider',
  spacing: 'px-3 pt-4 pb-1',
  firstSpacing: 'px-3 pb-1',
  divider: 'border-t border-border mt-2',
} as const;

/**
 * 모바일 네비게이션 아이템 클래스 조합 함수
 */
export function getMobileNavItemClasses(isActive: boolean): string {
  const stateBase = isActive ? MOBILE_NAV_TOKENS.active.base : MOBILE_NAV_TOKENS.inactive.base;
  return [
    'flex items-center gap-3 rounded-lg px-3 py-3 relative',
    stateBase,
    MOBILE_NAV_TOKENS.transition,
    MOBILE_NAV_TOKENS.focus,
  ].join(' ');
}
