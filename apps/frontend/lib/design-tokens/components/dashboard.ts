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

import { UserRoleValues as URVal } from '@equipment-management/schemas';
import { INTERACTIVE_TOKENS, FOCUS_TOKENS } from '../semantic';
import { toTailwindSize } from '../primitives';
import { getStaggerDelay, TRANSITION_PRESETS } from '../motion';

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
    card: 'bg-brand-ok/10 text-brand-ok border-brand-ok/20',
    icon: 'bg-brand-ok/20 text-brand-ok',
  },
  warning: {
    card: 'bg-brand-warning/10 text-brand-warning border-brand-warning/20',
    icon: 'bg-brand-warning/20 text-brand-warning',
  },
  danger: {
    card: 'bg-brand-critical/10 text-brand-critical border-brand-critical/20',
    icon: 'bg-brand-critical/20 text-brand-critical',
  },
  primary: {
    card: 'bg-brand-info/10 text-brand-info border-brand-info/20',
    icon: 'bg-brand-info/20 text-brand-info',
  },
  default: {
    card: 'bg-card text-card-foreground border-border',
    icon: 'bg-muted text-muted-foreground',
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
const _FALLBACK_BADGE = {
  color: 'text-muted-foreground',
  bgColor: 'bg-muted',
} as const;

export const DASHBOARD_ROLE_BADGES = {
  [URVal.TEST_ENGINEER]: {
    color: 'text-brand-info',
    bgColor: 'bg-brand-info/10',
  },
  [URVal.TECHNICAL_MANAGER]: {
    color: 'text-brand-ok',
    bgColor: 'bg-brand-ok/10',
  },
  [URVal.QUALITY_MANAGER]: {
    color: 'text-ul-fog dark:text-brand-info',
    bgColor: 'bg-ul-fog/10 dark:bg-ul-fog/20',
  },
  [URVal.LAB_MANAGER]: {
    color: 'text-ul-midnight dark:text-brand-info',
    bgColor: 'bg-ul-midnight/10 dark:bg-ul-midnight/20',
  },
  [URVal.SYSTEM_ADMIN]: {
    color: 'text-brand-warning',
    bgColor: 'bg-brand-warning/10',
  },
} as const;

export type DashboardRole = keyof typeof DASHBOARD_ROLE_BADGES;

/**
 * 역할별 배지 클래스 가져오기
 */
export function getRoleBadgeClasses(role: string): { color: string; bgColor: string } {
  const key = role.toLowerCase() as DashboardRole;
  return DASHBOARD_ROLE_BADGES[key] || _FALLBACK_BADGE;
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
    indicator: 'bg-brand-info',
    text: 'text-brand-info',
  },
  urgent: {
    indicator: 'bg-brand-warning',
    text: 'text-brand-warning',
  },
  overdue: {
    indicator: 'bg-brand-critical',
    text: 'text-brand-critical',
  },
} as const;

export type DashboardCalibrationUrgency = keyof typeof DASHBOARD_CALIBRATION_STATUS_COLORS;

/**
 * 교정 상태별 색상 가져오기
 */
export function getCalibrationStatusClasses(status: DashboardCalibrationUrgency) {
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
  statsCard: TRANSITION_PRESETS.moderateShadowTransform,

  /** 카드 hover: 빠른 배경색/스케일/그림자 전환 */
  cardHover: TRANSITION_PRESETS.fastBgTransformShadow,

  /** 리스트 아이템: 배경색/텍스트 전환 */
  listItem: TRANSITION_PRESETS.fastBgColor,

  /** 즉각 배경색 전환 */
  instantBg: TRANSITION_PRESETS.instantBg,

  /** 아이콘/배지: 배경색/스케일 전환 */
  iconTransition: TRANSITION_PRESETS.fastBgTransform,

  /** 텍스트 색상 전환 */
  textColor: TRANSITION_PRESETS.fastColor,
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
  primaryCard: `group bg-card border border-border rounded-lg p-4 flex flex-col justify-between gap-2 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${TRANSITION_PRESETS.fastColor}`,
  primaryCount: 'font-mono tabular-nums font-bold text-4xl text-foreground leading-tight',
  primaryLabel: 'text-sm font-medium text-muted-foreground',
  primarySub: 'text-xs text-muted-foreground tabular-nums',
  /**
   * 가동률/반출/부적합 상태별 색상 토큰
   *
   * KPI 카드에서 수치 색상 분기에 사용 — raw Tailwind 하드코딩 금지
   */
  statusColor: {
    /** 가동률 70%+ 또는 정상 상태 */
    good: 'text-brand-ok',
    /** 가동률 40-70% 또는 주의 필요 */
    warning: 'text-brand-warning',
    /** 가동률 <40% 또는 위험 상태 */
    danger: 'text-brand-critical',
    /** 반출 중 (양수인 경우) */
    active: 'text-brand-info',
    /** 부적합 존재 시 카드 테두리 */
    alertBorder: 'border-brand-critical/30',
  },
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
  barOverdue: 'bg-brand-critical',
  barUrgent: 'bg-brand-warning',
  barWarning: 'bg-brand-warning',
  barOk: 'bg-brand-ok',
  dday: 'font-mono tabular-nums font-bold text-sm w-14 flex-shrink-0',
  ddayOverdue: 'text-brand-critical',
  ddayUrgent: 'text-brand-warning',
  ddayWarning: 'text-brand-warning',
  ddayOk: 'text-brand-ok',
  info: 'min-w-0 flex-1',
  managementNumber: 'text-xs text-muted-foreground font-mono truncate',
  equipmentName: 'text-xs text-foreground truncate',
  footer: 'px-4 py-2 border-t border-border flex-shrink-0',
  viewAllLink: 'text-xs text-muted-foreground hover:text-foreground',
  emptyContainer: 'flex-1 flex flex-col items-center justify-center py-8 text-muted-foreground',
  /** 빈 상태 아이콘 (교정 일정 없음 = 긍정) */
  emptyIcon: 'h-10 w-10 mb-2 text-brand-ok',
  emptyTitle: 'text-sm font-medium',
  emptyDesc: 'text-xs mt-1 text-center',
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
  navButton: `p-1 rounded hover:bg-muted active:bg-muted/80 active:scale-95 text-muted-foreground hover:text-foreground ${TRANSITION_PRESETS.instantTransform}`,
  grid: 'grid grid-cols-7 px-3 pb-3',
  dayLabel: 'text-center text-[10px] font-medium text-muted-foreground py-1',
  cell: 'relative flex flex-col items-center py-1 rounded hover:bg-muted/50 cursor-default',
  cellToday: 'bg-brand-info/10',
  cellNumber: 'text-xs text-foreground leading-tight',
  cellNumberToday: 'font-bold text-brand-info',
  cellNumberHoliday: 'font-medium text-brand-critical',
  cellNumberOtherMonth: 'text-muted-foreground/40',
  dots: 'flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-[28px]',
  dotOverdue: 'w-1.5 h-1.5 rounded-full bg-brand-critical flex-shrink-0',
  dotUpcoming: 'w-1.5 h-1.5 rounded-full bg-brand-warning flex-shrink-0',
  dotReturn: 'w-1.5 h-1.5 rounded-full bg-brand-info flex-shrink-0',
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
// 11. DASHBOARD_OVERDUE_CHECKOUTS_TOKENS — 반출 기한 초과 카드
// ============================================================================

/**
 * 반출 기한 초과 카드 토큰
 *
 * OverdueCheckoutsCard에서 사용 (기존 raw Tailwind → 디자인 토큰 교체)
 */
export const DASHBOARD_OVERDUE_CHECKOUTS_TOKENS = {
  container: 'bg-card border border-border rounded-lg p-4 flex flex-col gap-2 min-h-[12rem]',
  containerLoading: 'bg-card border border-border rounded-lg p-4 flex flex-col gap-3 min-h-[12rem]',
  header: 'flex items-center justify-between',
  title: 'text-sm font-semibold text-foreground',
  countAlert: 'text-xs font-medium text-brand-critical',
  /** 내부 탭 스트립 */
  tabBar: 'flex border-b border-border -mx-0 mb-1',
  tab: `text-xs font-medium px-3 py-2 text-muted-foreground hover:text-foreground border-b-2 border-transparent -mb-px ${TRANSITION_PRESETS.instantColor} focus-visible:outline-none`,
  tabActive: 'text-foreground border-b-2 border-primary',
  listWrapper: 'relative flex-1 overflow-hidden',
  list: 'flex flex-col gap-1 overflow-y-auto max-h-[150px]',
  listFade:
    'pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent',
  item: 'flex items-center gap-3 p-2 rounded hover:bg-muted/50 group',
  dday: 'font-mono tabular-nums font-bold text-xs text-brand-critical w-12 flex-shrink-0',
  ddayReturn: 'font-mono tabular-nums font-bold text-xs text-brand-info w-12 flex-shrink-0',
  info: 'min-w-0 flex-1',
  name: 'text-xs text-foreground truncate',
  user: 'text-[10px] text-muted-foreground truncate',
  /** 인라인 빈 상태 (flex row, 한 줄) */
  compactEmpty: 'flex items-center gap-2 py-2 text-muted-foreground',
  compactEmptyIcon: 'h-4 w-4 text-brand-ok flex-shrink-0',
  compactEmptyText: 'text-xs',
  /** 목록 스크롤 어포던스 — 하단 그라데이션 페이드 */
  arrow: `h-3 w-3 text-muted-foreground group-hover:text-foreground flex-shrink-0 ${TRANSITION_PRESETS.instantColor}`,
} as const;

// ============================================================================
// 12. DASHBOARD_TEAM_DISTRIBUTION_TOKENS — 팀별 장비 분포
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
  list: 'flex flex-col gap-2 overflow-y-auto max-h-[220px] pr-1',
  row: 'flex flex-col gap-1',
  rowHeader: 'flex items-center justify-between',
  teamName: 'text-xs text-foreground truncate',
  teamCount: 'text-xs font-mono tabular-nums text-muted-foreground flex-shrink-0',
  barTrack: 'h-2 bg-muted rounded-full overflow-hidden',
  barFill: 'h-full rounded-full bg-brand-info',
  emptyText: 'text-xs text-muted-foreground text-center py-4',
} as const;

// ============================================================================
// 13. DASHBOARD_QUICK_ACTION_TOKENS — 빠른 실행 버튼 바
// ============================================================================

export const DASHBOARD_QUICK_ACTION_TOKENS = {
  container: 'bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-4 flex-wrap',
  label: 'text-xs font-medium text-muted-foreground flex-shrink-0',
  grid: 'flex items-center gap-2 flex-wrap',
  action: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted/60 active:scale-[0.98] ${TRANSITION_PRESETS.instantBgShadowTransform} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`,
  /** 주요 액션 (filled bg-primary/10) — secondary와 시각적 위계 구분 */
  actionPrimary: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20 hover:bg-primary/20 active:scale-[0.98] ${TRANSITION_PRESETS.instantBgShadowTransform} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`,
  actionIcon: 'h-3.5 w-3.5 flex-shrink-0',
  actionLabel: 'text-xs font-medium text-foreground whitespace-nowrap',
} as const;

// ============================================================================
// 14. DASHBOARD_ALERT_BANNER_TOKENS — 긴급 조치 요약 배너 (신규)
// ============================================================================

/**
 * 긴급 조치 요약 배너 토큰
 *
 * AlertBanner에서 사용 — 대시보드 상단 1줄 요약
 * - totalCount=0: "이상 없음" 인라인 텍스트
 * - totalCount>0: severity-colored 좌측 바 + 카운트 배지 + pill 칩
 */
export const DASHBOARD_ALERT_BANNER_TOKENS = {
  container:
    'flex items-center gap-3 min-h-[2.75rem] px-3 py-2 rounded-lg border bg-card overflow-hidden',
  /** 좌측 severity 색상 바 (border-l-4) */
  severityBorder: {
    critical: 'border-l-4 border-l-brand-critical',
    warning: 'border-l-4 border-l-brand-warning',
    none: 'border-l-4 border-l-transparent',
  },
  /** 원형 카운트 배지 */
  countCircle:
    'flex-shrink-0 h-6 w-6 rounded-full bg-brand-critical text-white text-[10px] font-bold flex items-center justify-center tabular-nums',
  /** 요약 텍스트 */
  summaryText: 'text-xs font-medium text-foreground',
  /** pill 칩 컨테이너 — ml-auto로 우측 정렬 (와이어프레임 준수) */
  chips: 'flex items-center gap-2 flex-wrap ml-auto',
  /** 기본 카테고리 pill */
  chip: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border',
  /** 긴급 카테고리 pill (non-conforming 등) */
  chipUrgent:
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-critical/10 text-brand-critical border border-brand-critical/20',
  /** 경고 카테고리 pill (overdue 등) */
  chipWarning:
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-warning/10 text-brand-warning border border-brand-warning/20',
  /** "이상 없음" 인라인 상태 */
  clearState: 'flex items-center gap-2 text-xs text-muted-foreground',
  clearIcon: 'h-4 w-4 text-brand-ok flex-shrink-0',
} as const;

// ============================================================================
// 15. DASHBOARD_STATUS_MINI_TOKENS — 5번째 KPI 카드 (장비 상태 분포)
// ============================================================================

/**
 * 장비 상태 미니 분포 카드 토큰
 *
 * KpiStatusGrid 5번째 카드 — 상태별 수평 바 + 도트 + 건수
 */
export const DASHBOARD_STATUS_MINI_TOKENS = {
  container:
    'bg-card border border-border rounded-lg p-4 flex flex-col justify-between gap-2 min-h-[7rem]',
  header: 'flex items-start justify-between gap-1',
  label: 'text-sm font-medium text-muted-foreground',
  subLabel: 'text-xs text-muted-foreground',
  list: 'flex flex-col gap-1.5',
  statusRow: 'flex items-center gap-2',
  statusDot: 'w-2 h-2 rounded-full flex-shrink-0',
  barTrack: 'flex-1 h-1 rounded-full bg-muted overflow-hidden',
  barFill: 'h-full rounded-full',
  statusLabel: 'text-[10px] text-muted-foreground w-14 truncate flex-shrink-0',
  statusCount:
    'text-[10px] tabular-nums font-medium text-muted-foreground text-right w-5 flex-shrink-0',
} as const;

// ============================================================================
// 15. DASHBOARD_KPI_TREND_TOKENS — KPI 트렌드 배지
// ============================================================================

export const DASHBOARD_KPI_TREND_TOKENS = {
  up: 'text-brand-ok text-[10px] tabular-nums font-semibold leading-none',
  down: 'text-brand-critical text-[10px] tabular-nums font-semibold leading-none',
  same: 'text-muted-foreground text-[10px] tabular-nums leading-none',
  badge: 'inline-flex items-center gap-0.5',
} as const;

// ============================================================================
// 16. DASHBOARD_WELCOME_TOKENS — 환영 헤더
// ============================================================================

/**
 * 환영 헤더 토큰
 *
 * WelcomeHeader에서 사용 — 타이포그래피/레이아웃 하드코딩 제거
 */
export const DASHBOARD_WELCOME_TOKENS = {
  title: 'text-2xl md:text-3xl font-bold tracking-tight text-foreground',
  metaRow: 'flex flex-wrap items-center gap-3',
  badgeLayout: 'flex items-center gap-1.5 py-1 px-2.5',
  roleIcon: 'h-3.5 w-3.5',
  onlineContainer: 'inline-flex items-center gap-1.5 text-sm text-muted-foreground',
  onlineDot: 'inline-block w-2 h-2 rounded-full bg-brand-ok',
  divider: 'hidden sm:inline text-muted-foreground/30',
  date: 'text-sm text-muted-foreground',
  description: 'text-xs text-muted-foreground/70 hidden md:block leading-relaxed',
} as const;

// ============================================================================
// 17. DASHBOARD_RECENT_ACTIVITIES_TOKENS — 최근 활동 피드
// ============================================================================

/**
 * 최근 활동 피드 토큰
 *
 * RecentActivities에서 사용 — 반복되는 레이아웃/스타일 하드코딩 제거
 */
export const DASHBOARD_RECENT_ACTIVITIES_TOKENS = {
  /** 개별 활동 아이템 행 레이아웃 */
  item: 'flex items-start space-x-4 p-3 rounded-lg',
  /** 활동 타입별 아이콘 컨테이너 */
  iconContainer: 'mt-1 rounded-full p-2',
  /** 아이콘 컨테이너 — 기본(중립) */
  iconContainerDefault: 'bg-muted',
  /** 아이콘 컨테이너 — 승인 */
  iconContainerApproval: 'bg-brand-ok/10',
  /** 아이콘 컨테이너 — 반려 */
  iconContainerRejection: 'bg-brand-critical/10',
  /** 아이템 행 배경 — 승인 */
  rowApproval: 'bg-brand-ok/5',
  /** 아이템 행 배경 — 반려 */
  rowRejection: 'bg-brand-critical/5',
  /** 콘텐츠 영역 */
  content: 'flex-1 space-y-1 min-w-0',
  /** 메타 텍스트 (시간, 작은 정보) */
  meta: 'text-xs text-muted-foreground flex items-center',
  /** 상세 보기 링크 버튼 */
  viewDetailBtn: 'h-6 px-0 text-xs',
  /** 스크롤 컨테이너 */
  scrollContainer: 'space-y-2 max-h-[400px] overflow-y-auto pr-2 pb-6',
  /** 스크롤 어포던스 그라데이션 */
  scrollFade:
    'pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent rounded-b-lg',
} as const;
// 빈 상태는 DASHBOARD_EMPTY_STATE_TOKENS.prominent / .filter 사용

// ============================================================================
// 18. DASHBOARD_EMPTY_STATE_TOKENS — 의미 기반 빈 상태 시스템
// ============================================================================

/**
 * 대시보드 빈 상태 의미 기반 토큰
 *
 * 빈 상태는 의미가 다르다 — 하나로 통합하면 UX가 잘못됨:
 *
 * success  — 초과/문제 없음 = 긍정 신호 → 초록 아이콘 (CheckCircle2)
 *            예: 반출 초과 없음, 교정 기한 초과 없음
 *
 * neutral  — 데이터가 아직 없음 = 중립 안내 → 회색 반투명 아이콘
 *            예: 최근 활동 없음, 팀 장비 없음
 *
 * filter   — 필터/탭 결과 없음 = 일시적 상태 → 텍스트만
 *            예: 카테고리 탭 필터 후 결과 없음
 *
 * scrollFade — 레이아웃 유틸리티: 스크롤 어포던스 (의미와 무관)
 */
export const DASHBOARD_EMPTY_STATE_TOKENS = {
  /**
   * success: 문제/초과가 없음 → 사용자에게 긍정적 신호
   * 아이콘: CheckCircle2 (lucide-react)
   */
  success: {
    container: 'flex flex-col items-center justify-center py-4 text-muted-foreground',
    icon: 'mb-1 text-brand-ok',
    iconSize: 'h-8 w-8',
    title: 'text-xs font-medium',
  },

  /**
   * neutral: 데이터가 없음 → 중립 안내
   * flex-1로 부모 높이 채움 (카드 내 세로 중앙)
   */
  neutral: {
    container: 'flex-1 flex flex-col items-center justify-center py-8 text-muted-foreground',
    icon: 'mb-2 opacity-30',
    iconSize: 'h-10 w-10',
    title: 'text-sm font-medium',
    description: 'text-xs mt-1 opacity-70 text-center',
  },

  /**
   * prominent: 전체 피드 없음 → 더 강한 안내 필요
   * 상위 neutral보다 패딩 크고 아이콘 더 선명
   */
  prominent: {
    container: 'py-10 text-center text-muted-foreground',
    icon: 'h-10 w-10 mx-auto mb-3 opacity-30',
    title: 'text-sm font-medium',
    description: 'text-xs mt-1 opacity-70',
  },

  /**
   * filter: 탭/필터 적용 후 결과 없음 → 텍스트만으로 충분
   */
  filter: {
    container: 'py-8 text-center text-muted-foreground',
    text: 'text-sm',
  },

  /**
   * inline: 컴팩트 카드 내 인라인 빈 상태 → flex row 한 줄
   * 예: "✓ 반출 기한 초과 없음"
   */
  inline: {
    container: 'flex items-center gap-2 py-2 text-muted-foreground',
    icon: 'h-4 w-4 text-brand-ok flex-shrink-0',
    text: 'text-xs',
  },

  /**
   * scrollFade: 레이아웃 유틸리티
   *
   * 스크롤 가능한 목록 하단 그라데이션 어포던스
   * 의미와 무관 — 모든 스크롤 컨테이너에서 재사용
   */
  scrollFade:
    'pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent',
} as const;
