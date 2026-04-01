/**
 * Sidebar Component Tokens (Layer 3: Component-Specific)
 *
 * header.ts 패턴을 따라 Layer 2 → Layer 3 참조 구조
 * SSOT: 사이드바의 모든 스타일은 여기서만 정의
 */

import { INTERACTIVE_TOKENS, FOCUS_TOKENS, ELEVATION_TOKENS } from '../semantic';
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
  transition: TRANSITION_PRESETS.fastWidthMargin,
} as const;

/**
 * 숫자 → Tailwind z-index 클래스 매핑
 *
 * Tailwind JIT은 정적 분석만 수행하므로 `z-${number}` 동적 조합 불가.
 * 리터럴 매핑으로 JIT 호환성 보장.
 */
const Z_CLASS_MAP: Record<number, string> = {
  0: 'z-0',
  10: 'z-10',
  20: 'z-20',
  30: 'z-30',
  40: 'z-40',
  50: 'z-50',
} as const;

/**
 * 레이아웃 Z-Index 토큰
 *
 * ELEVATION_TOKENS.layer 기반 — 사이드바/헤더 간 계층 관계 SSOT.
 * sidebar(floating=20) < header(sticky=30) 순서로 헤더가 사이드바 위에 렌더링.
 */
export const LAYOUT_Z_INDEX = {
  /** 사이드바: floating layer (드롭다운 수준) */
  sidebar: Z_CLASS_MAP[ELEVATION_TOKENS.layer.floating],
  /** 헤더: sticky layer (고정 요소) */
  header: Z_CLASS_MAP[ELEVATION_TOKENS.layer.sticky],
} as const;

/**
 * 헤더 바 스타일 토큰
 *
 * Header.tsx + DashboardShellSkeleton 공용.
 * 높이, 패딩, 배경, 테두리, z-index 등 헤더 바의 모든 스타일 SSOT.
 */
export const HEADER_BAR_TOKENS = {
  /** 고정 위치 + z-index */
  position: `sticky top-0 ${LAYOUT_Z_INDEX.header}`,
  /** 높이 */
  height: SIDEBAR_LAYOUT.headerHeight,
  /** 수평 패딩 (모바일 → 데스크톱) */
  padding: 'px-4 md:px-6',
  /** 배경 + 테두리 + elevation (스크롤 시 콘텐츠와 시각적 분리) */
  surface: 'bg-card/95 backdrop-blur-sm border-b border-border shadow-sm',
  /** 내부 레이아웃 */
  layout: 'flex items-center gap-4',
} as const;

/**
 * 사이드바 elevation 토큰
 *
 * 다크모드에서 사이드바(#122C49)와 메인 배경(#0a1c30)의 톤이 유사하여
 * 우측 그림자로 시각적 경계를 강화합니다.
 */
export const SIDEBAR_ELEVATION = {
  /** 우측 그림자 — 라이트에서는 미미, 다크에서 경계 역할 */
  shadow: 'shadow-[2px_0_8px_-2px_rgba(0,0,0,0.15)] dark:shadow-[2px_0_12px_-2px_rgba(0,0,0,0.5)]',
} as const;

/**
 * 헤더 바 전체 클래스 조합
 */
export function getHeaderBarClasses(): string {
  return [
    HEADER_BAR_TOKENS.layout,
    HEADER_BAR_TOKENS.height,
    HEADER_BAR_TOKENS.padding,
    HEADER_BAR_TOKENS.surface,
    HEADER_BAR_TOKENS.position,
  ].join(' ');
}

/**
 * 헤더 검색 트리거 토큰
 *
 * 업무 도구에서 검색은 핵심 기능이므로 시각적 가중치를 높입니다.
 * 배경색 + 넓은 min-width + 아이콘/단축키 강조로 발견성 향상.
 */
export const HEADER_SEARCH_TOKENS = {
  /** 트리거 버튼 컨테이너 */
  container: [
    'hidden md:flex items-center gap-2 rounded-lg',
    'bg-muted/60 dark:bg-white/5',
    'border border-border/50',
    'px-3 py-1.5',
    'min-w-[220px]',
    'hover:bg-muted dark:hover:bg-white/10',
    'hover:border-border',
    TRANSITION_PRESETS.fastBgColor,
    FOCUS_TOKENS.classes.brand,
  ].join(' '),
  /** 검색 아이콘 */
  icon: 'h-4 w-4 shrink-0 text-muted-foreground/70',
  /** 플레이스홀더 텍스트 */
  placeholder: 'flex-1 text-left text-sm text-muted-foreground truncate',
  /** 키보드 단축키 배지 */
  kbd: 'ml-auto text-[10px] font-medium text-muted-foreground/50 bg-background/80 dark:bg-white/10 px-1.5 py-0.5 rounded border border-border/30 font-sans pointer-events-none',
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
