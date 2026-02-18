/**
 * Settings 컴포넌트 디자인 토큰
 *
 * SSOT: 설정 페이지의 모든 UI 요소 (chip, card, section)
 *
 * Architecture v3:
 * - Settings Chip: 선택 가능한 토글 chip (교정 알림, 알림 카테고리 등)
 * - Settings Card: 설정 섹션 카드
 * - Settings Section: 설정 그룹 레이아웃
 *
 * 사용처:
 * - CalibrationSettingsContent.tsx (교정 알림 D-day 선택)
 * - NotificationSettingsContent.tsx (알림 카테고리 선택)
 * - SystemSettingsContent.tsx (시스템 설정)
 */

import { getTransitionClasses } from '../motion';

// ============================================================================
// Settings Chip (Toggleable Selection)
// ============================================================================

/**
 * 선택 가능한 Chip 토큰
 * - 교정 알림 D-day 선택 (D-30, D-7, D-1, D-day)
 * - 알림 카테고리 선택 (교정, 반출, 부적합 등)
 */
export const SETTINGS_CHIP_TOKENS = {
  base: [
    'inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  ].join(' '),

  transition: getTransitionClasses('fast', ['background-color', 'color', 'border-color']),

  states: {
    selected: 'bg-primary text-primary-foreground',
    unselected: 'border bg-background hover:bg-accent hover:text-accent-foreground',
    disabled: 'opacity-50 cursor-not-allowed',
  },

  icon: {
    size: 'h-3 w-3',
    spacing: 'mr-1',
  },
} as const;

/**
 * Chip 클래스 생성 함수
 * @param isSelected 선택 여부
 * @param isDisabled 비활성화 여부 (optional)
 * @returns Tailwind 클래스 문자열
 */
export function getSettingsChipClasses(isSelected: boolean, isDisabled = false): string {
  const stateClass = isDisabled
    ? SETTINGS_CHIP_TOKENS.states.disabled
    : isSelected
      ? SETTINGS_CHIP_TOKENS.states.selected
      : SETTINGS_CHIP_TOKENS.states.unselected;

  return `${SETTINGS_CHIP_TOKENS.base} ${SETTINGS_CHIP_TOKENS.transition} ${stateClass}`;
}

/**
 * Chip 아이콘 클래스
 */
export function getSettingsChipIconClasses(): string {
  return `${SETTINGS_CHIP_TOKENS.icon.size} ${SETTINGS_CHIP_TOKENS.icon.spacing}`;
}

// ============================================================================
// Settings Card Header
// ============================================================================

/**
 * 설정 카드 헤더 토큰
 * - 그라디언트 배경
 * - 아이콘 + 타이틀 레이아웃
 */
export const SETTINGS_CARD_HEADER_TOKENS = {
  background:
    'bg-gradient-to-r from-primary/5 via-primary/3 to-transparent dark:from-primary/10 dark:via-primary/5 border-b',

  iconContainer: [
    'flex h-10 w-10 shrink-0 items-center justify-center',
    'rounded-full bg-primary/10 dark:bg-primary/20',
  ].join(' '),

  icon: 'h-5 w-5 text-primary',

  layout: 'flex items-center gap-3',
} as const;

/**
 * 설정 카드 헤더 클래스
 */
export function getSettingsCardHeaderClasses(): string {
  return SETTINGS_CARD_HEADER_TOKENS.background;
}

/**
 * 설정 카드 헤더 아이콘 컨테이너 클래스
 */
export function getSettingsIconContainerClasses(): string {
  return SETTINGS_CARD_HEADER_TOKENS.iconContainer;
}

// ============================================================================
// Settings Info Box
// ============================================================================

/**
 * 설정 정보 박스 토큰
 * - 알림 동작 방식 설명
 * - 주의사항 표시
 */
export const SETTINGS_INFO_BOX_TOKENS = {
  container: 'rounded-lg border p-4 bg-muted/30',

  title: 'text-sm font-medium mb-1',

  list: 'text-xs text-muted-foreground space-y-1 list-disc list-inside',
} as const;

/**
 * 설정 정보 박스 클래스
 */
export function getSettingsInfoBoxClasses(): string {
  return SETTINGS_INFO_BOX_TOKENS.container;
}

// ============================================================================
// Settings Section Spacing
// ============================================================================

/**
 * 설정 섹션 간격 토큰
 */
export const SETTINGS_SPACING_TOKENS = {
  cardContent: 'space-y-6', // 카드 내부 섹션 간격 (24px)
  formFields: 'space-y-8', // 폼 필드 간격 (32px)
  chipGroup: 'flex flex-wrap gap-2', // chip 그룹 간격 (8px)
} as const;

// ============================================================================
// Settings Label & Description
// ============================================================================

/**
 * 설정 라벨/설명 토큰
 */
export const SETTINGS_TEXT_TOKENS = {
  label: 'text-sm font-medium',
  description: 'text-xs text-muted-foreground',
  currentValue: 'text-xs text-muted-foreground mt-2', // "현재 선택: ..." 스타일
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type SettingsChipState = keyof typeof SETTINGS_CHIP_TOKENS.states;
