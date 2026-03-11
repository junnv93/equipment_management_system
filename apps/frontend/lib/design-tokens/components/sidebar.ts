/**
 * Sidebar Component Tokens (Layer 3: Component-Specific)
 *
 * header.ts 패턴을 따라 Layer 2 → Layer 3 참조 구조
 * SSOT: 사이드바의 모든 스타일은 여기서만 정의
 */

import { INTERACTIVE_TOKENS, FOCUS_TOKENS } from '../semantic';
import { toTailwindSize } from '../primitives';
import { TRANSITION_PRESETS } from '../motion';

/**
 * 사이드바 레이아웃 크기
 */
export const SIDEBAR_LAYOUT = {
  expanded: { width: 'w-56', marginLeft: 'md:ml-56' }, // 224px
  collapsed: { width: 'w-[52px]', marginLeft: 'md:ml-[52px]' }, // 52px
  mobile: { width: 'w-72' }, // 288px (드로어)
  headerHeight: 'h-14',
  /** width/margin-left transition (prefers-reduced-motion 지원) */
  transition:
    'motion-safe:transition-[width,margin-left] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none',
} as const;

/**
 * 사이드바 색상
 */
export const SIDEBAR_COLORS = {
  background: 'bg-ul-midnight',
  border: 'border-white/10',
  brandPrimary: 'text-ul-red',
  brandSecondary: 'text-white/40',
} as const;

/**
 * 아이콘 크기 — INTERACTIVE_TOKENS.icon.standard 기반 (반응형)
 */
const _iconH = toTailwindSize(INTERACTIVE_TOKENS.icon.standard, 'h');
const _iconW = toTailwindSize(INTERACTIVE_TOKENS.icon.standard, 'w');

/**
 * 사이드바 아이템 토큰
 */
export const SIDEBAR_ITEM_TOKENS = {
  active: {
    base: 'text-white bg-white/15 font-medium',
    /** border-l-[3px] 보상: px-3(12px) - 3px = 9px */
    indicator: 'border-l-[3px] border-white pl-[9px]',
  },
  inactive: {
    base: 'text-white/70 hover:text-white hover:bg-white/10',
    indicator: 'border-l-[3px] border-transparent',
  },
  /** 아이콘 크기 — 렌더링 시 적용 */
  iconSize: `${_iconH} ${_iconW}`,
  badge: {
    background: 'bg-ul-red',
    text: 'text-white',
  },
  /** prefers-reduced-motion 지원 transition */
  transition: TRANSITION_PRESETS.fastBgColor,
  /** 포커스 (어두운 배경) */
  focus: FOCUS_TOKENS.classes.onDark,
} as const;

/**
 * 섹션 헤더 토큰
 */
export const SIDEBAR_SECTION_TOKENS = {
  label: 'text-[11px] font-semibold text-white/40 uppercase tracking-wider',
  spacing: 'px-3 pt-4 pb-1',
  /** 첫 번째 섹션은 상단 패딩 없음 */
  firstSpacing: 'px-3 pb-1',
  divider: 'border-t border-white/10 mt-2',
} as const;

/**
 * 사이드바 아이템 클래스 조합 함수
 *
 * @param isActive - 현재 활성 상태
 * @param isCollapsed - 접힌 상태 (icon-only)
 */
export function getSidebarItemClasses(isActive: boolean, isCollapsed = false): string {
  const stateBase = isActive ? SIDEBAR_ITEM_TOKENS.active.base : SIDEBAR_ITEM_TOKENS.inactive.base;

  if (isCollapsed) {
    const collapsedIndicator = isActive
      ? 'border-l-[3px] border-white'
      : 'border-l-[3px] border-transparent';
    return [
      'flex items-center justify-center rounded-lg py-2 relative w-full',
      stateBase,
      collapsedIndicator,
      SIDEBAR_ITEM_TOKENS.transition,
      SIDEBAR_ITEM_TOKENS.focus,
    ].join(' ');
  }

  const indicator = isActive
    ? SIDEBAR_ITEM_TOKENS.active.indicator
    : SIDEBAR_ITEM_TOKENS.inactive.indicator;

  return [
    'flex items-center gap-3 rounded-lg px-3 py-2 relative',
    stateBase,
    indicator,
    SIDEBAR_ITEM_TOKENS.transition,
    SIDEBAR_ITEM_TOKENS.focus,
  ].join(' ');
}

/**
 * 사이드바 너비 클래스
 */
export function getSidebarWidthClasses(isCollapsed: boolean): string {
  return isCollapsed ? SIDEBAR_LAYOUT.collapsed.width : SIDEBAR_LAYOUT.expanded.width;
}

/**
 * 메인 콘텐츠 영역 마진 클래스
 */
export function getSidebarMarginClasses(isCollapsed: boolean): string {
  return isCollapsed ? SIDEBAR_LAYOUT.collapsed.marginLeft : SIDEBAR_LAYOUT.expanded.marginLeft;
}
