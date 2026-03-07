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

// ============================================================================
// 7. DASHBOARD_DDAY_TOKENS — Control Center D-day 카운터 패널
// ============================================================================

/**
 * D-day 카운터 패널 토큰
 *
 * - hero: 초대형 카운터 (5rem→8rem→10rem 반응형)
 * - sub: 서브 카운터 (text-2xl)
 * - urgency: 긴급도별 배경/테두리/텍스트 색상
 */
export const DASHBOARD_DDAY_TOKENS = {
  hero: {
    counter: 'font-mono tabular-nums font-bold leading-none tracking-tighter',
    counterSize: 'text-[5rem] md:text-[8rem] lg:text-[10rem]',
    equipmentName: 'text-sm font-medium truncate opacity-80 mt-1',
  },
  sub: {
    counter: 'font-mono tabular-nums font-bold text-2xl leading-tight min-w-[4rem]',
    equipmentName: 'text-xs truncate opacity-80',
  },
  urgency: {
    critical: 'bg-brand-critical/10 border-brand-critical text-brand-critical',
    warning: 'bg-brand-warning/10 border-brand-warning text-brand-warning',
    ok: 'bg-brand-bg-surface border-brand-border-subtle text-brand-text-primary',
    empty: 'bg-brand-bg-surface border-brand-border-subtle text-brand-text-primary',
  },
} as const;

// ============================================================================
// 8. DASHBOARD_KPI_TOKENS — KPI 상태 그리드
// ============================================================================

/**
 * KPI 상태 그리드 토큰
 *
 * - card: 개별 KPI 카드 컨테이너
 * - dot: 상태 색상 도트
 * - count: 숫자 표시
 * - label: 상태명 레이블
 * - percent: 비율 표시
 */
export const DASHBOARD_KPI_TOKENS = {
  card: 'bg-card border border-border rounded-lg p-4 flex flex-col gap-1',
  dot: 'h-3 w-3 rounded-full inline-block flex-shrink-0',
  count: 'font-mono tabular-nums font-semibold text-3xl text-foreground leading-tight',
  label: 'text-xs text-muted-foreground truncate',
  percent: 'text-xs text-muted-foreground tabular-nums',
  // 4-컬럼 주요 KPI 카드 (Link 컴포넌트로 사용 — hover/focus 포함)
  primaryCard:
    'group bg-card border border-border rounded-lg p-4 flex flex-col justify-between gap-2 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:transition-colors',
  primaryCount: 'font-mono tabular-nums font-bold text-4xl text-foreground leading-tight',
  primaryLabel: 'text-sm font-medium text-muted-foreground',
  primarySub: 'text-xs text-muted-foreground tabular-nums',
} as const;

// ============================================================================
// 9. DASHBOARD_DDAY_COMPACT_TOKENS — 컴팩트 D-day 리스트
// ============================================================================

/**
 * 컴팩트 D-day 교정 현황 리스트 토큰
 *
 * CalibrationDdayList에서 사용
 * - 좌측 색상 바 + D-day 카운터 + 장비명
 */
export const DASHBOARD_DDAY_COMPACT_TOKENS = {
  container: 'bg-card border border-border rounded-lg flex flex-col overflow-hidden',
  header: 'px-4 pt-4 pb-2 flex items-center justify-between flex-shrink-0',
  title: 'text-sm font-semibold text-foreground',
  count: 'text-xs text-muted-foreground',
  list: 'flex-1 overflow-y-auto',
  item: 'flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50',
  bar: 'w-1 rounded-full self-stretch flex-shrink-0',
  barOverdue: 'bg-ul-red dark:bg-red-500',
  barUrgent: 'bg-ul-orange dark:bg-orange-400',
  barWarning: 'bg-yellow-400 dark:bg-yellow-500',
  barOk: 'bg-ul-green dark:bg-green-500',
  dday: 'font-mono tabular-nums font-bold text-sm w-14 flex-shrink-0',
  ddayOverdue: 'text-ul-red dark:text-red-400',
  ddayUrgent: 'text-ul-orange dark:text-orange-400',
  ddayWarning: 'text-yellow-600 dark:text-yellow-400',
  ddayOk: 'text-ul-green dark:text-green-400',
  info: 'min-w-0 flex-1',
  managementNumber: 'text-xs text-muted-foreground font-mono truncate',
  equipmentName: 'text-xs text-foreground truncate',
  footer: 'px-4 py-2 border-t border-border flex-shrink-0',
  viewAllLink: 'text-xs text-muted-foreground hover:text-foreground',
  emptyContainer: 'flex-1 flex flex-col items-center justify-center py-8 text-muted-foreground',
} as const;

// ============================================================================
// 10. DASHBOARD_CALENDAR_TOKENS — 미니 달력
// ============================================================================

/**
 * 미니 달력 토큰
 *
 * MiniCalendar에서 사용
 * - 월간 그리드, 이벤트 도트, 헤더 네비게이션
 */
export const DASHBOARD_CALENDAR_TOKENS = {
  container: 'bg-card border border-border rounded-lg flex flex-col overflow-hidden',
  header: 'px-4 pt-4 pb-2 flex items-center justify-between flex-shrink-0',
  title: 'text-sm font-semibold text-foreground tabular-nums',
  navButton: 'p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground',
  grid: 'grid grid-cols-7 px-3 pb-3',
  dayLabel: 'text-center text-[10px] font-medium text-muted-foreground py-1',
  cell: 'relative flex flex-col items-center py-1 rounded hover:bg-muted/50 cursor-default',
  cellToday: 'bg-ul-blue/10 dark:bg-ul-blue/20',
  cellNumber: 'text-xs text-foreground leading-tight',
  cellNumberToday: 'font-bold text-ul-blue dark:text-ul-info',
  cellNumberHoliday: 'font-medium text-ul-red dark:text-red-400',
  cellNumberOtherMonth: 'text-muted-foreground/40',
  dots: 'flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-[28px]',
  dotOverdue: 'w-1.5 h-1.5 rounded-full bg-ul-red dark:bg-red-400 flex-shrink-0',
  dotUpcoming: 'w-1.5 h-1.5 rounded-full bg-yellow-400 dark:bg-yellow-500 flex-shrink-0',
  dotReturn: 'w-1.5 h-1.5 rounded-full bg-ul-blue dark:bg-ul-info flex-shrink-0',
  popup:
    'absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-20 bg-popover border border-border rounded-lg shadow-lg p-2 min-w-[160px] max-w-[220px]',
  popupTitle: 'text-[10px] font-medium text-muted-foreground mb-1',
  popupItem: 'flex items-center gap-1.5 py-0.5',
  popupItemDot: 'w-1.5 h-1.5 rounded-full flex-shrink-0',
  popupItemText: 'text-xs text-foreground truncate',
  legend: 'px-4 pb-3 flex items-center gap-3 flex-shrink-0 flex-wrap',
  legendItem: 'flex items-center gap-1',
  legendDot: 'w-2 h-2 rounded-full flex-shrink-0',
  legendText: 'text-[10px] text-muted-foreground',
} as const;

// ============================================================================
// 11. DASHBOARD_TEAM_DISTRIBUTION_TOKENS — 팀별 장비 분포
// ============================================================================

/**
 * 팀별 장비 분포 바 차트 토큰
 *
 * TeamEquipmentDistribution에서 사용
 * - 팀명 + 수평 CSS 바 + 건수
 */
export const DASHBOARD_TEAM_DISTRIBUTION_TOKENS = {
  container: 'bg-card border border-border rounded-lg p-4 flex flex-col gap-3',
  header: 'flex items-center justify-between',
  title: 'text-sm font-semibold text-foreground',
  total: 'text-xs text-muted-foreground',
  list: 'flex flex-col gap-2',
  row: 'flex flex-col gap-1',
  rowHeader: 'flex items-center justify-between',
  teamName: 'text-xs text-foreground truncate',
  teamCount: 'text-xs font-mono tabular-nums text-muted-foreground flex-shrink-0',
  barTrack: 'h-2 bg-muted rounded-full overflow-hidden',
  barFill: 'h-full rounded-full bg-ul-blue dark:bg-ul-info',
  emptyText: 'text-xs text-muted-foreground text-center py-4',
} as const;
