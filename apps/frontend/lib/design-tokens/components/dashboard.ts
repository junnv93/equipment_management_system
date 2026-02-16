/**
 * Dashboard Component Tokens (Layer 3: Component-Specific)
 *
 * 대시보드 컴포넌트 전용 디자인 토큰
 * - StatsCard variant 색상
 * - WelcomeHeader 역할별 배지
 * - 장비 상태 차트 색상
 * - 일관된 모션/스태거
 * - 반복 사용 크기
 *
 * SSOT: 대시보드의 모든 스타일은 여기서만 정의
 */

import { INTERACTIVE_TOKENS, FOCUS_TOKENS } from '../semantic';
import { toTailwindSize } from '../primitives';
import { getTransitionClasses, getStaggerDelay } from '../motion';

// ============================================================================
// 1. DASHBOARD_STATS_VARIANTS — StatsCard 색상 (UL Brand 기반)
// ============================================================================

/**
 * StatsCard variant별 색상 토큰
 *
 * UL Solutions 브랜드 색상 시스템 기반
 * - success: UL Bright Green (#00A451)
 * - warning: UL Orange (#FF9D55)
 * - danger: UL Bright Red (#CA0123)
 * - primary: UL Midnight Blue (#122C49)
 * - default: 시스템 테마 색상
 */
export const DASHBOARD_STATS_VARIANTS = {
  success: {
    card: 'bg-ul-green/10 text-ul-green border-ul-green/20 dark:bg-ul-green/20 dark:text-ul-green dark:border-ul-green/30',
    icon: 'bg-ul-green/20 text-ul-green dark:bg-ul-green/30 dark:text-ul-green',
  },
  warning: {
    card: 'bg-ul-orange/10 text-ul-orange border-ul-orange/20 dark:bg-ul-orange/20 dark:text-ul-orange dark:border-ul-orange/30',
    icon: 'bg-ul-orange/20 text-ul-orange dark:bg-ul-orange/30 dark:text-ul-orange',
  },
  danger: {
    card: 'bg-ul-red/10 text-ul-red border-ul-red/20 dark:bg-ul-red/20 dark:text-ul-red dark:border-ul-red/30',
    icon: 'bg-ul-red/20 text-ul-red dark:bg-ul-red/30 dark:text-ul-red',
  },
  primary: {
    card: 'bg-ul-midnight/10 text-ul-midnight border-ul-midnight/20 dark:bg-ul-info/20 dark:text-ul-info dark:border-ul-info/30',
    icon: 'bg-ul-midnight/20 text-ul-midnight dark:bg-ul-info/30 dark:text-ul-info',
  },
  default: {
    card: 'bg-card text-card-foreground border-border',
    icon: 'bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground',
  },
} as const;

export type StatsVariant = keyof typeof DASHBOARD_STATS_VARIANTS;

/**
 * StatsCard variant 클래스 가져오기
 */
export function getStatsCardClasses(variant: StatsVariant = 'default'): string {
  return DASHBOARD_STATS_VARIANTS[variant].card;
}

/**
 * StatsCard 아이콘 클래스 가져오기
 */
export function getStatsIconClasses(variant: StatsVariant = 'default'): string {
  return DASHBOARD_STATS_VARIANTS[variant].icon;
}

// ============================================================================
// 2. DASHBOARD_ROLE_BADGES — WelcomeHeader 역할별 배지 (UL Brand)
// ============================================================================

/**
 * 역할별 배지 색상 토큰
 *
 * generic Tailwind → UL Brand 매핑:
 * - test_engineer: UL Blue (#0067B1)
 * - technical_manager: UL Green (#00A451)
 * - quality_manager: UL Fog (#577E9E)
 * - lab_manager: UL Midnight (#122C49)
 * - system_admin: UL Orange (#FF9D55)
 */
export const DASHBOARD_ROLE_BADGES = {
  test_engineer: {
    color: 'text-ul-blue dark:text-ul-info',
    bgColor: 'bg-ul-blue/10 dark:bg-ul-blue/20',
  },
  technical_manager: {
    color: 'text-ul-green dark:text-ul-green',
    bgColor: 'bg-ul-green/10 dark:bg-ul-green/20',
  },
  quality_manager: {
    color: 'text-ul-fog dark:text-ul-info',
    bgColor: 'bg-ul-fog/10 dark:bg-ul-fog/20',
  },
  lab_manager: {
    color: 'text-ul-midnight dark:text-ul-info',
    bgColor: 'bg-ul-midnight/10 dark:bg-ul-midnight/20',
  },
  system_admin: {
    color: 'text-ul-orange dark:text-ul-orange',
    bgColor: 'bg-ul-orange/10 dark:bg-ul-orange/20',
  },
  admin: {
    color: 'text-ul-red dark:text-red-300',
    bgColor: 'bg-ul-red/10 dark:bg-ul-red/20',
  },
  user: {
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
} as const;

export type DashboardRole = keyof typeof DASHBOARD_ROLE_BADGES;

/**
 * 역할별 배지 클래스 가져오기
 */
export function getRoleBadgeClasses(role: string): { color: string; bgColor: string } {
  const key = role.toLowerCase() as DashboardRole;
  return DASHBOARD_ROLE_BADGES[key] || DASHBOARD_ROLE_BADGES.user;
}

// ============================================================================
// 3. DASHBOARD_STATUS_COLORS — 장비 상태 차트 색상 (UL Brand 기반 hex)
// ============================================================================

/**
 * 장비 상태별 차트 색상
 *
 * Recharts는 hex 값이 필요하므로 Tailwind 클래스 대신 직접 hex 값 사용
 * UL Brand 기반 매핑
 */
export const DASHBOARD_STATUS_COLORS: Record<string, string> = {
  available: '#00A451', // UL Green — 사용 가능
  in_use: '#0067B1', // UL Blue — 사용 중
  checked_out: '#FF9D55', // UL Orange — 반출 중
  calibration_scheduled: '#577E9E', // UL Fog — 교정 예정
  calibration_overdue: '#CA0123', // UL Red — 교정 기한 초과
  non_conforming: '#CA0123', // UL Red — 부적합
  spare: '#939698', // UL Gray 3 — 여분
  retired: '#6A6D70', // UL Gray 4 — 폐기
  pending_disposal: '#FF9D55', // UL Orange — 폐기대기
  disposed: '#6A6D70', // UL Gray 4 — 폐기완료
  temporary: '#939698', // UL Gray 3 — 임시등록
  inactive: '#939698', // UL Gray 3 — 비활성
} as const;

/**
 * 장비 상태별 차트 색상 가져오기
 */
export function getStatusChartColor(status: string): string {
  return DASHBOARD_STATUS_COLORS[status] || '#D8D9DA'; // UL Gray 1 fallback
}

/**
 * 교정 일정 status별 색상 (Tailwind 클래스)
 *
 * CalibrationSchedule 컴포넌트에서 사용
 */
export const DASHBOARD_CALIBRATION_STATUS_COLORS = {
  upcoming: {
    indicator: 'bg-ul-blue dark:bg-ul-blue',
    text: 'text-ul-blue dark:text-ul-info',
  },
  urgent: {
    indicator: 'bg-ul-orange dark:bg-ul-orange',
    text: 'text-ul-orange dark:text-ul-orange',
  },
  overdue: {
    indicator: 'bg-ul-red dark:bg-ul-red',
    text: 'text-ul-red dark:text-red-400',
  },
} as const;

export type CalibrationStatus = keyof typeof DASHBOARD_CALIBRATION_STATUS_COLORS;

/**
 * 교정 상태별 색상 가져오기
 */
export function getCalibrationStatusClasses(status: CalibrationStatus) {
  return DASHBOARD_CALIBRATION_STATUS_COLORS[status];
}

// ============================================================================
// 4. DASHBOARD_MOTION — 일관된 전환/스태거
// ============================================================================

/**
 * 대시보드 모션 토큰
 *
 * getTransitionClasses()를 래핑하여 대시보드 컨텍스트에 맞는 사전 정의 제공
 * Web Interface Guidelines 준수: specific property transitions, no transition-all
 */
export const DASHBOARD_MOTION = {
  /** StatsCard: hover 시 shadow + scale 전환 */
  statsCard: getTransitionClasses('moderate', ['box-shadow', 'transform']),

  /** 카드 hover: 빠른 배경색/스케일/그림자 전환 */
  cardHover: getTransitionClasses('fast', ['background-color', 'transform', 'box-shadow']),

  /** 리스트 아이템: 배경색/텍스트 전환 */
  listItem: getTransitionClasses('fast', ['background-color', 'color']),

  /** 즉각 배경색 전환 */
  instantBg: getTransitionClasses('instant', ['background-color']),

  /** 아이콘/배지: 배경색/스케일 전환 */
  iconTransition: getTransitionClasses('fast', ['background-color', 'transform']),

  /** 텍스트 색상 전환 */
  textColor: getTransitionClasses('fast', ['color']),
} as const;

/**
 * 대시보드 stagger delay 가져오기
 *
 * 통일된 stagger 값 사용:
 * - list: 40ms (알림, 검색 결과)
 * - grid: 60ms (카드 그리드)
 *
 * @param index - 아이템 인덱스
 * @param type - 'list' (40ms) | 'grid' (60ms)
 * @returns CSS animation-delay 값 (예: '80ms')
 */
export function getDashboardStaggerDelay(index: number, type: 'list' | 'grid' = 'list'): string {
  return getStaggerDelay(index, type);
}

// ============================================================================
// 5. DASHBOARD_SIZES — 반복 사용되는 크기
// ============================================================================

/**
 * 대시보드 크기 토큰
 *
 * INTERACTIVE_TOKENS 기반 — primitive 변경 시 자동 업데이트
 */
export const DASHBOARD_SIZES = {
  /** StatsCard 아이콘 (24px mobile, 20px desktop — desktop에서 현재 h-5 w-5 유지) */
  statsIcon:
    toTailwindSize(INTERACTIVE_TOKENS.icon.standard, 'h') +
    ' ' +
    toTailwindSize(INTERACTIVE_TOKENS.icon.standard, 'w'),

  /** PendingApprovalCard 아이콘 컨테이너 (48px mobile, 44px desktop) */
  approvalIcon:
    toTailwindSize(INTERACTIVE_TOKENS.size.comfortable, 'h') +
    ' ' +
    toTailwindSize(INTERACTIVE_TOKENS.size.comfortable, 'w'),

  /** WCAG AAA 최소 터치 타겟 (44px mobile, 40px desktop) */
  minTouchTarget:
    toTailwindSize(INTERACTIVE_TOKENS.size.standard, 'h') +
    ' ' +
    toTailwindSize(INTERACTIVE_TOKENS.size.standard, 'w'),
} as const;

// ============================================================================
// 6. Focus 재export — 대시보드에서 자주 사용
// ============================================================================

export const DASHBOARD_FOCUS = FOCUS_TOKENS.classes;
