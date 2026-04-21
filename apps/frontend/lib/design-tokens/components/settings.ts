/**
 * Settings 컴포넌트 디자인 토큰
 *
 * SSOT: 설정 페이지의 모든 UI 요소
 *
 * Architecture v3:
 * - Settings Card: 카드 컨테이너 + 헤더
 * - Settings Chip: 선택 가능한 토글 chip
 * - Settings Form Item: 토글/스위치 항목
 * - Settings Select: 선택 입력
 * - Settings Submit: 저장 버튼 + 상태 표시
 * - Settings Info Box: 정보 안내 박스
 *
 * 사용처:
 * - ProfileContent.tsx (프로필 카드)
 * - NotificationsContent.tsx (SettingsToggleField)
 * - DisplayPreferencesContent.tsx (Select + 토글)
 * - SystemSettingsContent.tsx (Select + Textarea)
 * - CalibrationSettingsContent.tsx (Chip + Info Box)
 */

import { TRANSITION_PRESETS } from '../motion';
import { MICRO_TYPO } from '../semantic';

// ============================================================================
// Settings Card Container
// ============================================================================

/**
 * 설정 카드 컨테이너 토큰
 * - 모든 설정 페이지의 Card 요소에 적용
 */
export const SETTINGS_CARD_CONTAINER_TOKENS = {
  base: 'overflow-hidden border-primary/10 shadow-sm',
  hover: 'hover:shadow-md',
  transition: TRANSITION_PRESETS.moderateShadow,
} as const;

/**
 * 설정 카드 컨테이너 클래스
 */
export function getSettingsCardClasses(): string {
  return [
    SETTINGS_CARD_CONTAINER_TOKENS.base,
    SETTINGS_CARD_CONTAINER_TOKENS.hover,
    SETTINGS_CARD_CONTAINER_TOKENS.transition,
  ].join(' ');
}

// ============================================================================
// Settings Card Danger Variant
// ============================================================================

/**
 * 위험 설정 카드 변형 토큰
 * - 시스템 설정 등 위험도 높은 카드에 사용
 * - SSOT: SETTINGS_CARD_CONTAINER_TOKENS를 합성 + 좌측 경고 보더만 추가
 */
export const SETTINGS_CARD_DANGER_TOKENS = {
  dangerBorder: 'border-l-4 border-l-warning',
} as const;

/**
 * 위험 카드 클래스: 기본 카드 + 좌측 경고 보더
 */
export function getSettingsCardDangerClasses(): string {
  return `${getSettingsCardClasses()} ${SETTINGS_CARD_DANGER_TOKENS.dangerBorder}`;
}

// ============================================================================
// Settings Card Header
// ============================================================================

/**
 * 설정 카드 헤더 토큰
 * - 와이어프레임 v2: plain 헤더 (gradient 없음, 아이콘 없음)
 * - title 14px, description 12px
 * - 모든 설정 카드에서 통일된 패턴
 */
export const SETTINGS_CARD_HEADER_TOKENS = {
  background: 'border-b border-border/50 pb-4',
  layout: 'flex items-start justify-between gap-3',
  titleWrapper: 'flex-1',
  title: 'text-sm font-semibold tracking-tight',
  description: 'text-xs text-muted-foreground mt-0.5',
} as const;

/**
 * 설정 카드 헤더 배경 클래스
 */
export function getSettingsCardHeaderClasses(): string {
  return SETTINGS_CARD_HEADER_TOKENS.background;
}

// ============================================================================
// Settings Chip (Toggleable Selection)
// ============================================================================

/**
 * 선택 가능한 Chip 토큰
 * - 교정 알림 D-day 선택 (D-30, D-7, D-1, D-day)
 */
export const SETTINGS_CHIP_TOKENS = {
  base: [
    `inline-flex items-center rounded-md px-3 py-1.5 ${MICRO_TYPO.detail} font-medium font-mono select-none`,
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  ].join(' '),

  transition: TRANSITION_PRESETS.fastBgColorBorder,

  states: {
    selected: 'bg-primary/10 border border-primary/20 text-primary',
    unselected:
      'border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
    highlight: 'bg-brand-repair/10 border border-brand-repair/30 text-brand-repair',
    disabled: 'opacity-50 cursor-not-allowed',
  },

  icon: {
    size: 'h-3 w-3',
    spacing: 'mr-1',
  },
} as const;

/**
 * Chip 클래스 생성 함수
 * @param variant - 'selected' | 'unselected' | 'highlight' (D-0/urgent 강조)
 */
export function getSettingsChipClasses(
  isSelected: boolean,
  isDisabledOrVariant: boolean | 'highlight' = false
): string {
  let stateClass: string;

  if (isDisabledOrVariant === true) {
    stateClass = SETTINGS_CHIP_TOKENS.states.disabled;
  } else if (isDisabledOrVariant === 'highlight') {
    stateClass = SETTINGS_CHIP_TOKENS.states.highlight;
  } else if (isSelected) {
    stateClass = SETTINGS_CHIP_TOKENS.states.selected;
  } else {
    stateClass = SETTINGS_CHIP_TOKENS.states.unselected;
  }

  return `${SETTINGS_CHIP_TOKENS.base} ${SETTINGS_CHIP_TOKENS.transition} ${stateClass}`;
}

/**
 * Chip 아이콘 클래스
 */
export function getSettingsChipIconClasses(): string {
  return `${SETTINGS_CHIP_TOKENS.icon.size} ${SETTINGS_CHIP_TOKENS.icon.spacing}`;
}

// ============================================================================
// Settings Form Item (Toggle/Switch Container)
// ============================================================================

/**
 * 토글/스위치 항목 토큰
 * - 알림 채널 토글 (이메일, 앱 내)
 * - 알림 카테고리 토글
 * - 표시 설정 토글 (폐기 장비 표시)
 */
export const SETTINGS_FORM_ITEM_TOKENS = {
  base: 'group rounded-lg border-2 border-border/50 p-5',
  hover: 'hover:border-primary/30 hover:bg-accent/30',
  transition: TRANSITION_PRESETS.fastBorderBg,
  disabled: 'opacity-60 pointer-events-none',

  layout: 'flex items-start justify-between gap-4',

  labelSection: {
    withIcon: 'flex items-start gap-3 flex-1',
    withoutIcon: 'flex-1 space-y-1.5',
  },

  labelIcon: 'mt-0.5 h-5 w-5 text-muted-foreground shrink-0',
  labelWrapper: 'space-y-1.5',
  label: 'text-base font-semibold cursor-pointer',
  description: 'text-xs leading-relaxed',

  actionArea: 'flex items-center gap-2',
} as const;

/**
 * 토글 항목 컨테이너 클래스
 */
export function getSettingsFormItemClasses(options?: { disabled?: boolean }): string {
  const classes = [SETTINGS_FORM_ITEM_TOKENS.base, SETTINGS_FORM_ITEM_TOKENS.transition];

  if (options?.disabled) {
    classes.push(SETTINGS_FORM_ITEM_TOKENS.disabled);
  } else {
    classes.push(SETTINGS_FORM_ITEM_TOKENS.hover);
  }

  return classes.join(' ');
}

// ============================================================================
// Settings Select Trigger
// ============================================================================

/**
 * Select 입력 트리거 토큰
 * - 언어, 페이지당 항목 수, 날짜 형식, 정렬 기준, 보관 기간
 */
export const SETTINGS_SELECT_TRIGGER_TOKENS = {
  hover: 'hover:border-primary/30',
  focus: 'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
  transition: TRANSITION_PRESETS.fastBorderShadow,
} as const;

/**
 * Select 트리거 클래스
 */
export function getSettingsSelectTriggerClasses(): string {
  return [
    SETTINGS_SELECT_TRIGGER_TOKENS.hover,
    SETTINGS_SELECT_TRIGGER_TOKENS.focus,
    SETTINGS_SELECT_TRIGGER_TOKENS.transition,
  ].join(' ');
}

// ============================================================================
// Settings Submit Section
// ============================================================================

/**
 * 저장 버튼 영역 토큰
 * - Display, System, Calibration 페이지의 하단 저장 영역
 */
export const SETTINGS_SUBMIT_TOKENS = {
  footer: 'flex items-center justify-between border-t border-border/50 bg-muted/50 rounded-b-lg',
  note: 'text-xs text-muted-foreground',
  button: {
    base: 'min-w-[120px]',
    interaction: 'motion-safe:hover:scale-105 motion-safe:active:scale-95',
    transition: TRANSITION_PRESETS.fastTransformBgOpacity,
  },
} as const;

/**
 * 저장 버튼 클래스
 */
export function getSettingsSubmitButtonClasses(): string {
  return [
    SETTINGS_SUBMIT_TOKENS.button.base,
    SETTINGS_SUBMIT_TOKENS.button.interaction,
    SETTINGS_SUBMIT_TOKENS.button.transition,
  ].join(' ');
}

// ============================================================================
// Settings Save Indicator
// ============================================================================

/**
 * 저장 상태 인디케이터 토큰
 * - 자동 저장 시 Loader2 (저장중) → Check (저장됨) 전환
 */
export const SETTINGS_SAVE_INDICATOR_TOKENS = {
  saving: 'h-4 w-4 motion-safe:animate-spin text-muted-foreground',
  saved:
    'h-4 w-4 text-brand-ok motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300',
} as const;

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
  pageContent: 'space-y-6', // settings 콘텐츠 페이지 최상위 간격
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
// Settings Page Header (와이어프레임 v2 — 그라디언트/격자 제거)
// ============================================================================

/**
 * 설정 페이지 최상단 헤더 토큰
 * - 기존 그라디언트 + 격자 overlay 제거
 * - 단순 border-b 구분선으로 시각 계층 정리
 */
export const SETTINGS_PAGE_HEADER_TOKENS = {
  container: 'mb-6 pb-5 border-b border-border',
  layout: 'flex items-center gap-3',
  iconWrapper: 'flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0',
  icon: 'h-5 w-5 text-primary',
  title: 'text-2xl font-semibold tracking-tight text-foreground',
  description: 'text-sm text-muted-foreground mt-1',
} as const;

export function getSettingsPageHeaderClasses(): string {
  return SETTINGS_PAGE_HEADER_TOKENS.container;
}

// ============================================================================
// Settings Profile Hero (아바타 섹션)
// ============================================================================

/**
 * 프로필 카드 상단 아바타 히어로 섹션 토큰
 * - 이니셜 아바타 + 이름/이메일(mono) + 역할/활성/사이트 배지
 */
export const SETTINGS_PROFILE_HERO_TOKENS = {
  container: 'flex items-start gap-4 pb-5 mb-0 border-b border-border/50',
  avatar: [
    'flex h-14 w-14 items-center justify-center rounded-full flex-shrink-0',
    'bg-primary/10 text-primary text-lg font-semibold border-2 border-border',
  ].join(' '),
  name: 'text-base font-semibold leading-tight',
  email: 'text-xs text-muted-foreground font-mono mt-0.5',
  badgeRow: 'flex flex-wrap gap-1.5 mt-2',
  lastLogin: {
    container: 'ml-auto text-right flex-shrink-0',
    label: `${MICRO_TYPO.meta} text-muted-foreground/60 mb-1`,
    value: 'text-xs font-mono text-muted-foreground',
  },
} as const;

// ============================================================================
// Settings Profile Grid (2열 필드 그리드)
// ============================================================================

/**
 * 프로필 카드 2열 그리드 필드 토큰
 * - 홀수 번째 셀은 sm: 우측 border 추가 (분할선)
 */
export const SETTINGS_PROFILE_GRID_TOKENS = {
  grid: 'grid grid-cols-1 sm:grid-cols-2',
  cell: 'py-3.5 px-5 border-b border-border/40 sm:[&:nth-child(odd)]:border-r sm:[&:nth-child(odd)]:border-border/40 sm:[&:nth-last-child(-n+2)]:border-b-0 [&:last-child]:border-b-0',
  label: `${MICRO_TYPO.label} font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1`,
  value: 'text-sm text-foreground font-mono',
  valueNormal: 'text-sm text-foreground',
  valueEmpty: 'text-sm text-muted-foreground/50 italic font-sans',
} as const;

// ============================================================================
// Settings Textarea (Select 토큰 오용 해소)
// ============================================================================

/**
 * Textarea 전용 토큰
 * - getSettingsSelectTriggerClasses() 오용 방지
 * - resize-y + focus-visible 반영
 */
export const SETTINGS_TEXTAREA_TOKENS = {
  base: 'resize-y min-h-[100px]',
  interactive: TRANSITION_PRESETS.fastBorderShadow,
  focus: 'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
  hover: 'hover:border-primary/30',
} as const;

export function getSettingsTextareaClasses(): string {
  return [
    SETTINGS_TEXTAREA_TOKENS.base,
    SETTINGS_TEXTAREA_TOKENS.interactive,
    SETTINGS_TEXTAREA_TOKENS.focus,
    SETTINGS_TEXTAREA_TOKENS.hover,
  ].join(' ');
}

// ============================================================================
// Settings Permissions Card (읽기 전용 권한 목록)
// ============================================================================

export const SETTINGS_PERMISSIONS_CARD_TOKENS = {
  content: 'px-5 py-4 space-y-4',
  categorySection: '',
  categoryLabel: `${MICRO_TYPO.meta} font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2`,
  badgeWrap: 'flex flex-wrap gap-1.5',
  badge: `${MICRO_TYPO.meta} font-medium bg-primary/8 text-primary border-primary/15`,
  readOnlyBadge: `${MICRO_TYPO.badge} font-medium`,
  totalCount: 'text-xs text-muted-foreground pt-3 border-t border-border/40',

  trigger: {
    base: 'flex w-full items-center justify-between px-5 py-4 text-left',
    hover: 'hover:bg-accent/30',
    transition: TRANSITION_PRESETS.fastBg,
  },
  triggerLabel: 'flex items-center gap-2',
  triggerCount: 'text-xs text-muted-foreground font-mono',
  chevron: {
    base: 'h-4 w-4 text-muted-foreground flex-shrink-0',
    transition: TRANSITION_PRESETS.fastTransformOpacity,
  },
} as const;

export function getSettingsPermissionsTriggerClasses(): string {
  return [
    SETTINGS_PERMISSIONS_CARD_TOKENS.trigger.base,
    SETTINGS_PERMISSIONS_CARD_TOKENS.trigger.hover,
    SETTINGS_PERMISSIONS_CARD_TOKENS.trigger.transition,
  ].join(' ');
}

// ============================================================================
// Settings Navigation (Sidebar)
// ============================================================================

/**
 * 설정 사이드바 네비게이션 토큰
 * - 역할 기반 필터링된 항목 목록
 * - Active/Inactive 상태 분기
 */
export const SETTINGS_NAV_TOKENS = {
  container: 'hidden lg:block lg:w-64 flex-shrink-0',
  stickyWrapper: 'sticky top-6',

  sectionLabel: `${MICRO_TYPO.label} font-semibold uppercase tracking-widest text-muted-foreground/60 px-2 pb-1.5`,
  adminSeparator: 'mt-4 mb-1.5',
  adminSectionLabel: `flex items-center gap-1.5 ${MICRO_TYPO.label} font-semibold uppercase tracking-widest text-muted-foreground/60 px-2 pb-1.5 pt-3 border-t border-border`,
  adminIcon: 'h-3 w-3',
  adminHelp: 'mt-4 px-3 text-xs text-muted-foreground/60 leading-relaxed',

  item: {
    base: 'group flex items-center justify-between gap-3 rounded-lg py-2.5 text-sm font-medium border-l-2 pl-[10px] pr-3',
    transition: TRANSITION_PRESETS.fastBgColor,
    active: 'border-primary bg-primary/10 text-primary',
    inactive:
      'border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground',
  },

  adminItem: {
    active: 'border-warning bg-warning/10 text-warning-foreground',
    inactive:
      'border-transparent text-muted-foreground hover:bg-warning/5 hover:text-warning-foreground',
  },

  iconCircle: {
    base: 'flex h-7 w-7 items-center justify-center rounded-full',
    transition: TRANSITION_PRESETS.fastBg,
    active: 'bg-primary/10 scale-110',
    inactive: '',
  },

  icon: 'h-4 w-4',

  chevron: {
    base: 'h-4 w-4',
    transition: TRANSITION_PRESETS.fastTransformOpacity,
    active: 'opacity-100 translate-x-0',
    inactive: 'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0',
  },
} as const;

/**
 * 네비게이션 아이템 클래스 생성
 */
export function getSettingsNavItemClasses(isActive: boolean, isAdmin?: boolean): string {
  let stateClass: string;
  if (isAdmin) {
    stateClass = isActive
      ? SETTINGS_NAV_TOKENS.adminItem.active
      : SETTINGS_NAV_TOKENS.adminItem.inactive;
  } else {
    stateClass = isActive ? SETTINGS_NAV_TOKENS.item.active : SETTINGS_NAV_TOKENS.item.inactive;
  }
  return [SETTINGS_NAV_TOKENS.item.base, SETTINGS_NAV_TOKENS.item.transition, stateClass].join(' ');
}

/**
 * 네비게이션 아이콘 원형 배경 클래스
 */
export function getSettingsNavIconCircleClasses(isActive: boolean): string {
  return [
    SETTINGS_NAV_TOKENS.iconCircle.base,
    SETTINGS_NAV_TOKENS.iconCircle.transition,
    isActive ? SETTINGS_NAV_TOKENS.iconCircle.active : SETTINGS_NAV_TOKENS.iconCircle.inactive,
  ].join(' ');
}

/**
 * 네비게이션 Chevron 클래스
 */
export function getSettingsNavChevronClasses(isActive: boolean): string {
  return [
    SETTINGS_NAV_TOKENS.chevron.base,
    SETTINGS_NAV_TOKENS.chevron.transition,
    isActive ? SETTINGS_NAV_TOKENS.chevron.active : SETTINGS_NAV_TOKENS.chevron.inactive,
  ].join(' ');
}

// ============================================================================
// Settings Mobile Navigation (수평 스크롤 탭)
// ============================================================================

/**
 * 모바일 네비게이션 토큰
 * - lg 미만에서 수평 스크롤 탭으로 표시
 * - lg 이상에서 숨김 (사이드바 사용)
 */
export const SETTINGS_NAV_MOBILE_TOKENS = {
  container: 'lg:hidden mb-6 border-b border-border',
  scrollWrapper: 'flex gap-1 overflow-x-auto scrollbar-hide pb-px',
  item: {
    base: 'flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm font-medium border-b-2 flex-shrink-0',
    transition: TRANSITION_PRESETS.fastBgColor,
    active: 'border-primary text-primary',
    inactive: 'border-transparent text-muted-foreground hover:text-foreground',
    adminActive: 'border-warning text-warning-foreground',
    adminInactive: 'border-transparent text-muted-foreground hover:text-warning-foreground',
  },
  icon: 'h-4 w-4',
} as const;

export function getSettingsNavMobileItemClasses(isActive: boolean, isAdmin?: boolean): string {
  let stateClass: string;
  if (isAdmin) {
    stateClass = isActive
      ? SETTINGS_NAV_MOBILE_TOKENS.item.adminActive
      : SETTINGS_NAV_MOBILE_TOKENS.item.adminInactive;
  } else {
    stateClass = isActive
      ? SETTINGS_NAV_MOBILE_TOKENS.item.active
      : SETTINGS_NAV_MOBILE_TOKENS.item.inactive;
  }
  return [
    SETTINGS_NAV_MOBILE_TOKENS.item.base,
    SETTINGS_NAV_MOBILE_TOKENS.item.transition,
    stateClass,
  ].join(' ');
}

// ============================================================================
// Settings Profile Badge Variants
// ============================================================================

/**
 * 프로필 히어로 섹션의 Badge 변형 토큰
 * - 역할, 활성/비활성, 사이트 배지
 */
export const SETTINGS_PROFILE_BADGE_TOKENS = {
  role: 'font-medium bg-primary/10 text-primary border-primary/20 text-xs',
  active: 'text-xs border-brand-ok/40 text-brand-ok',
  inactive: 'text-xs border-destructive/40 text-destructive',
  site: 'text-xs',
} as const;

// ============================================================================
// Settings Layout Container
// ============================================================================

/**
 * 설정 페이지 최상위 레이아웃 토큰
 * - layout.tsx의 컨테이너 + flex 레이아웃
 */
export const SETTINGS_LAYOUT_TOKENS = {
  container: 'container mx-auto px-4 py-6 max-w-7xl',
  contentRow: 'flex flex-col lg:flex-row gap-8',
  mainArea: 'flex-1 min-w-0',
  enterAnimation:
    'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-500',
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type SettingsChipState = keyof typeof SETTINGS_CHIP_TOKENS.states;
