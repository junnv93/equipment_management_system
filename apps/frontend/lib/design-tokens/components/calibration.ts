/**
 * Calibration Component Tokens (Layer 3: Component-Specific)
 *
 * 교정 관리 컴포넌트 전용 디자인 토큰
 * - 교정 상태 인디케이터 (4가지 상태)
 * - 중간점검 배지 (4가지)
 * - 통계 카드 variant (DASHBOARD_STATS 재사용)
 * - 탭별 색상
 * - 장비 선택 리스트
 * - 테이블, 빈 상태, 다이얼로그
 *
 * SSOT: 교정 관리 페이지의 모든 스타일은 여기서만 정의
 */

import { FOCUS_TOKENS } from '../semantic';
import { TRANSITION_PRESETS } from '../motion';
import {
  getSemanticStatusClasses,
  getSemanticContainerColorClasses,
  getSemanticContainerTextClasses,
} from '../brand';
import { type StatsVariant } from './dashboard';
import { AlertCircle, AlertTriangle, Calendar, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ============================================================================
// 0. CALIBRATION_THRESHOLDS — D-day 임계값 SSOT
// ============================================================================

/**
 * 교정/중간점검 D-day 임계값 (일수)
 *
 * 이 상수들은 getCalibrationDdayClasses, resolveUrgency, getStatusStyle 등
 * 여러 컴포넌트에서 참조하는 SSOT입니다. 정책 변경 시 여기만 수정하세요.
 */
export const CALIBRATION_THRESHOLDS = {
  /** 교정 D-day warning 임계값 (일) — 이 값 이하면 warning 상태 */
  CALIBRATION_WARNING_DAYS: 30,
  /** 중간점검 upcoming 임계값 (일) — 이 값 이하면 upcoming 상태 */
  INTERMEDIATE_CHECK_UPCOMING_DAYS: 7,
} as const;

// ============================================================================
// 1. CALIBRATION_STATUS_INDICATOR — 교정 상태 dot + text (4가지 상태)
// ============================================================================

/**
 * 교정 상태 타입
 */
export type CalibrationStatusType = 'overdue' | 'upcoming' | 'ok' | 'none';

/**
 * 교정 상태별 스타일 (dot + text)
 *
 * - overdue: 교정 기한 초과 (UL Red)
 * - upcoming: 30일 이내 (UL Orange)
 * - ok: 정상 (UL Green)
 * - none: 미등록 (muted)
 */
export const CALIBRATION_STATUS_INDICATOR: Record<
  CalibrationStatusType,
  { dot: string; text: string }
> = {
  overdue: {
    dot: 'bg-brand-critical',
    text: 'text-brand-critical',
  },
  upcoming: {
    dot: 'bg-brand-warning',
    text: 'text-brand-warning',
  },
  ok: {
    dot: 'bg-brand-ok',
    text: 'text-brand-ok',
  },
  none: {
    dot: 'bg-muted',
    text: 'text-muted-foreground',
  },
};

/**
 * Utility: 교정 상태별 스타일 가져오기
 */
export function getCalibrationStatusIndicatorClasses(status: CalibrationStatusType) {
  return CALIBRATION_STATUS_INDICATOR[status];
}

// ============================================================================
// 2. CALIBRATION_CHECK_BADGE — 중간점검 상태 배지 (4가지)
// ============================================================================

/**
 * 중간점검 상태 타입
 */
export type IntermediateCheckStatus = 'overdue' | 'today' | 'upcoming' | 'future';

/**
 * 중간점검 배지 스타일
 *
 * - overdue: 기한 초과 (UL Red)
 * - today: 오늘 (UL Orange)
 * - upcoming: D-7 이내 (UL 계열 warning)
 * - future: D-7 초과 (UL Blue)
 */
export const CALIBRATION_CHECK_BADGE: Record<
  IntermediateCheckStatus,
  { badge: string; icon: LucideIcon }
> = {
  overdue: {
    badge: getSemanticStatusClasses('critical'),
    icon: AlertCircle,
  },
  today: {
    badge: getSemanticStatusClasses('repair'),
    icon: Clock,
  },
  upcoming: {
    badge: getSemanticStatusClasses('warning'),
    icon: AlertTriangle,
  },
  future: {
    badge: getSemanticStatusClasses('info'),
    icon: Calendar,
  },
};

/**
 * Utility: 중간점검 상태별 배지 클래스 가져오기
 */
export function getIntermediateCheckBadgeClasses(status: IntermediateCheckStatus): string {
  return CALIBRATION_CHECK_BADGE[status].badge;
}

/**
 * Utility: 중간점검 상태별 아이콘 가져오기
 */
export function getIntermediateCheckIcon(status: IntermediateCheckStatus): LucideIcon {
  return CALIBRATION_CHECK_BADGE[status].icon;
}

// ============================================================================
// 3. CALIBRATION_STATS — 통계 카드 variant 매핑 (DASHBOARD_STATS 재사용)
// ============================================================================

/**
 * 교정 통계 타입
 */
export type CalibrationStatsType = 'total' | 'compliant' | 'overdue' | 'upcoming';

/**
 * 통계 카드 variant 매핑
 *
 * SSOT: DASHBOARD_STATS_VARIANTS 재사용 (중복 정의 금지)
 */
export const CALIBRATION_STATS_MAPPING: Record<CalibrationStatsType, StatsVariant> = {
  total: 'default',
  compliant: 'success',
  overdue: 'danger',
  upcoming: 'warning',
};

/**
 * Utility: 교정 통계 타입에 맞는 StatsCard variant 가져오기
 */
export function getCalibrationStatsVariant(type: CalibrationStatsType): StatsVariant {
  return CALIBRATION_STATS_MAPPING[type];
}

/**
 * 교정 통계 카운트 텍스트 색상
 *
 * StatsCard의 숫자 색상 (카드 전체가 아닌 숫자만)
 */
export const CALIBRATION_STATS_TEXT: Record<CalibrationStatsType | 'pending', string> = {
  total: 'text-foreground',
  compliant: 'text-brand-ok',
  overdue: 'text-brand-critical',
  upcoming: 'text-brand-warning',
  pending: 'text-brand-info',
};

// ============================================================================
// 4. CALIBRATION_TAB_COLORS — 탭별 색상
// ============================================================================

/**
 * 탭 타입 (리디자인: 3탭 구조)
 *
 * - list: 교정목록 (타임라인 + 테이블 통합)
 * - intermediate: 중간점검
 * - self-inspection: 자체점검
 */
export type CalibrationTabType = 'list' | 'intermediate' | 'self-inspection';

/**
 * 탭별 색상 (UL Brand 통일)
 */
export const CALIBRATION_TAB_COLORS: Record<CalibrationTabType, string> = {
  list: 'text-foreground',
  intermediate: 'text-brand-neutral',
  'self-inspection': 'text-brand-ok',
};

/**
 * Utility: 탭별 색상 클래스 가져오기
 */
export function getCalibrationTabClasses(tab: CalibrationTabType): string {
  return CALIBRATION_TAB_COLORS[tab];
}

// ============================================================================
// 5. CALIBRATION_MOTION — 전환 애니메이션
// ============================================================================

/**
 * 교정 관리 모션 토큰
 *
 * Web Interface Guidelines: specific property transitions only
 */
export const CALIBRATION_MOTION = {
  /** 통계 카드 hover */
  statsCard: TRANSITION_PRESETS.fastShadowTransform,

  /** 테이블 행 hover */
  tableRow: TRANSITION_PRESETS.instantBg,

  /** 탭 전환 */
  tab: TRANSITION_PRESETS.fastColorBorder,

  /** 링크 hover */
  link: TRANSITION_PRESETS.fastColor,

  /** 장비 선택 리스트 */
  equipmentItem: TRANSITION_PRESETS.fastBgBorder,
} as const;

// ============================================================================
// 6. CALIBRATION_TABLE — 테이블 스타일
// ============================================================================

/**
 * 교정 테이블 스타일 (EQUIPMENT_TABLE_TOKENS 패턴 참조)
 */
export const CALIBRATION_TABLE = {
  /** 테이블 외부 컨테이너 */
  wrapper: 'border rounded-md',

  /** Row hover */
  rowHover: ['hover:bg-muted/50 dark:hover:bg-muted/50', CALIBRATION_MOTION.tableRow].join(' '),

  /** 숫자 컬럼 (tabular-nums for Web Interface Guidelines) */
  numericColumn: 'tabular-nums',

  /** 링크 (색상 + 아이콘 정렬 + hover 포함) */
  link: [
    'inline-flex items-center gap-1 text-sm text-brand-info hover:underline',
    CALIBRATION_MOTION.link,
  ].join(' '),
} as const;

// ============================================================================
// 7. CALIBRATION_EMPTY_STATE — 빈 상태
// ============================================================================

/**
 * 빈 상태 스타일 (EQUIPMENT_EMPTY_STATE_TOKENS 패턴)
 */
export const CALIBRATION_EMPTY_STATE = {
  /** 아이콘 */
  icon: 'h-12 w-12 text-muted-foreground',

  /** 제목 */
  title: 'text-lg font-medium',

  /** 설명 */
  description: 'text-sm text-muted-foreground',

  /** 컨테이너 */
  container: 'text-center py-16',
} as const;

// ============================================================================
// 8. CALIBRATION_SELECTION — 장비 선택 리스트 (Register 페이지)
// ============================================================================

/**
 * 장비 선택 리스트 스타일
 */
export const CALIBRATION_SELECTION = {
  /** 기본 hover */
  hover: 'hover:bg-muted dark:hover:bg-muted',

  /** 선택됨 (UL Blue) */
  selected: 'bg-brand-info/10 border-l-4 border-brand-info',

  /** Transition */
  transition: CALIBRATION_MOTION.equipmentItem,

  /** 장비 정보 텍스트 */
  infoText: 'text-sm text-muted-foreground',
} as const;

/**
 * Utility: 장비 선택 리스트 클래스 가져오기
 */
export function getEquipmentSelectionClasses(isSelected: boolean): string {
  const base = ['p-3 cursor-pointer', CALIBRATION_SELECTION.transition];
  if (isSelected) {
    return [...base, CALIBRATION_SELECTION.selected].join(' ');
  }
  return [...base, CALIBRATION_SELECTION.hover].join(' ');
}

// ============================================================================
// 9. CALIBRATION_DIALOG — 다이얼로그 정보 영역
// ============================================================================

/**
 * 다이얼로그 스타일
 */
export const CALIBRATION_DIALOG = {
  /** 정보 배경 (bg-muted — 다크모드 자동 지원) */
  infoBackground: 'bg-muted dark:bg-muted',
} as const;

// ============================================================================
// 10. CALIBRATION_FOCUS — 포커스 재export
// ============================================================================

/**
 * 포커스 클래스 (FOCUS_TOKENS 재사용)
 */
export const CALIBRATION_FOCUS = FOCUS_TOKENS.classes;

// ============================================================================
// 11. CALIBRATION_INTERMEDIATE_CHECK_ICONS — 중간점검 아이콘 색상
// ============================================================================

/**
 * 중간점검 아이콘 색상 (테이블에서 사용)
 */
export const CALIBRATION_INTERMEDIATE_CHECK_ICON_COLORS: Record<IntermediateCheckStatus, string> = {
  overdue: 'text-brand-critical',
  today: 'text-brand-repair',
  upcoming: 'text-brand-info',
  future: 'text-brand-info',
};

/**
 * Utility: 중간점검 아이콘 색상 가져오기
 */
export function getIntermediateCheckIconColor(status: IntermediateCheckStatus): string {
  return CALIBRATION_INTERMEDIATE_CHECK_ICON_COLORS[status];
}

// ============================================================================
// 12. CALIBRATION_CARD_BORDER — 중간점검 요약 카드 border
// ============================================================================

/**
 * 중간점검 요약 카드 border (상태별)
 */
export const CALIBRATION_CARD_BORDER: Record<string, string> = {
  overdue: 'border-brand-critical/20',
  pending: 'border-brand-info/20',
  default: 'border-border',
};

// ============================================================================
// 13. CALIBRATION_TIMELINE — 12개월 수평 타임라인 바
// ============================================================================

/**
 * 12개월 타임라인 바 스타일
 *
 * 현재월 -2 ~ +10 범위를 월별 세그먼트 바로 표시.
 * 각 세그먼트 높이 = 해당 월 교정 건수 / 최대 건수 (상대적 부하)
 * 세그먼트 색상 = 해당 월의 최고 긴급도 (overdue > warning > ok)
 */
export const CALIBRATION_TIMELINE = {
  /** 타임라인 전체 컨테이너 */
  container: 'relative bg-brand-bg-surface border border-brand-border-subtle rounded-lg px-4 py-3',

  /** 월 레이블 행 (세그먼트 컬럼 정렬 — flex gap-px px-0.5 맞춤) */
  monthLabels:
    'flex gap-px px-0.5 mt-1.5 text-xs text-brand-text-muted font-mono tabular-nums select-none',

  /** 트랙 컨테이너 */
  track: 'relative h-10',
  /** 트랙 배경 */
  trackBg: 'absolute inset-0 bg-brand-bg-overlay rounded-sm',
  /** 오늘 마커 (수직선, 세그먼트 위에 z-10) */
  todayMarker: 'absolute top-0 bottom-0 w-px bg-brand-border-strong/60 z-10 pointer-events-none',

  /** 월별 세그먼트 바 */
  segment: {
    /** 공통 기반 (높이는 인라인 style로) */
    base: `w-full rounded-sm ${TRANSITION_PRESETS.fastOpacity}`,
    overdue: 'bg-brand-critical',
    warning: 'bg-brand-warning',
    ok: 'bg-brand-ok',
    /** 활성(호버/포커스) */
    active: 'opacity-100',
    /** 기본 */
    idle: 'opacity-70',
    /** 데이터 없는 월: 최소 마커 */
    emptyBar: 'w-full h-px bg-brand-bg-overlay rounded-full',
  },

  /** 호버 툴팁 */
  tooltip:
    'absolute z-20 -translate-x-1/2 bottom-full mb-2 left-1/2 px-3 py-2 text-xs bg-popover border border-border rounded-md shadow-md pointer-events-none min-w-[140px]',

  /** 툴팁 월 헤더 */
  tooltipDday: 'font-mono tabular-nums font-bold',

  /** 툴팁 장비명 행 */
  tooltipName: 'flex items-center justify-between gap-2 text-foreground max-w-[200px] mt-0.5',

  /** 툴팁 "N개 더" */
  tooltipMore: 'text-muted-foreground mt-1',

  /** 툴팁 상태별 텍스트 색상 */
  tooltipText: {
    overdue: 'text-brand-critical',
    warning: 'text-brand-warning',
    ok: 'text-brand-ok',
  },

  /** 도트 스타일 (하위 호환 — 현재 미사용) */
  dot: {
    overdue: 'bg-brand-critical',
    warning: 'bg-brand-warning',
    ok: 'bg-brand-ok',
    base: `w-2.5 h-2.5 rounded-full cursor-pointer ${TRANSITION_PRESETS.instantTransform}`,
    active: 'scale-150',
    idle: 'scale-100',
  },
} as const;

/**
 * 도트 Y 오프셋 간격 (px) — 같은 X 위치 도트 수직 분리
 * 변경 시 이 상수만 수정
 */
export const CALIBRATION_TIMELINE_DOT_Y_OFFSET_PX = 9;

/**
 * Utility: 타임라인 도트 색상 클래스
 *
 * 임계값 SSOT: getCalibrationDdayClasses / getCalibrationDdayLabel과 동일한 0, 30일 기준
 */
export function getCalibrationTimelineDotClasses(days: number): string {
  if (days < 0) return CALIBRATION_TIMELINE.dot.overdue;
  if (days <= CALIBRATION_THRESHOLDS.CALIBRATION_WARNING_DAYS)
    return CALIBRATION_TIMELINE.dot.warning;
  return CALIBRATION_TIMELINE.dot.ok;
}

/**
 * Utility: 타임라인 툴팁 텍스트 색상 클래스
 */
export function getCalibrationTimelineTooltipTextClasses(days: number): string {
  if (days < 0) return CALIBRATION_TIMELINE.tooltipText.overdue;
  if (days <= CALIBRATION_THRESHOLDS.CALIBRATION_WARNING_DAYS)
    return CALIBRATION_TIMELINE.tooltipText.warning;
  return CALIBRATION_TIMELINE.tooltipText.ok;
}

// ============================================================================
// 14. CALIBRATION_DDAY_COLUMN — D-day 테이블 컬럼
// ============================================================================

/**
 * D-day 컬럼 스타일
 *
 * - overdue: 음수 일수 (예: "-15일") → brand-critical
 * - warning: 30일 이내 (예: "D-7") → brand-warning
 * - normal: 30일 초과 (예: "D-120") → brand-text-secondary
 * - none: 날짜 없음 → muted
 */
export const CALIBRATION_DDAY_COLUMN = {
  base: 'font-mono tabular-nums font-medium text-sm',
  overdue: 'text-brand-critical',
  warning: 'text-brand-warning',
  normal: 'text-brand-text-secondary',
  none: 'text-muted-foreground',
} as const;

/**
 * Utility: D-day 컬럼 클래스 가져오기
 * @param days 잔여 일수 (음수 = 초과)
 */
export function getCalibrationDdayClasses(days: number | null | undefined): string {
  if (days === null || days === undefined) {
    return [CALIBRATION_DDAY_COLUMN.base, CALIBRATION_DDAY_COLUMN.none].join(' ');
  }
  if (days < 0) {
    return [CALIBRATION_DDAY_COLUMN.base, CALIBRATION_DDAY_COLUMN.overdue].join(' ');
  }
  if (days <= CALIBRATION_THRESHOLDS.CALIBRATION_WARNING_DAYS) {
    return [CALIBRATION_DDAY_COLUMN.base, CALIBRATION_DDAY_COLUMN.warning].join(' ');
  }
  return [CALIBRATION_DDAY_COLUMN.base, CALIBRATION_DDAY_COLUMN.normal].join(' ');
}

/**
 * Utility: D-day 텍스트 레이블 생성
 * @param days 잔여 일수 (음수 = 초과)
 */
export function getCalibrationDdayLabel(days: number | null | undefined): string {
  if (days === null || days === undefined) return '-';
  if (days < 0) return `-${Math.abs(days)}일`;
  if (days === 0) return 'D-Day';
  return `D-${days}`;
}

// ============================================================================
// 15. CALIBRATION_APPROVAL_ROW — 승인 대기 행 강조
// ============================================================================

/**
 * 승인 대기 행 스타일
 *
 * pending_approval / pending_review 상태의 교정 행에 왼쪽 4px bar + 배경색 적용.
 */
export const CALIBRATION_APPROVAL_ROW = {
  pending: 'border-l-4 border-l-brand-warning bg-brand-warning/5',
  default: '',
} as const;

/**
 * Utility: 승인 상태별 테이블 행 클래스 가져오기
 */
export function getCalibrationRowClasses(approvalStatus?: string): string {
  if (approvalStatus === 'pending_approval' || approvalStatus === 'pending_review') {
    return CALIBRATION_APPROVAL_ROW.pending;
  }
  return CALIBRATION_APPROVAL_ROW.default;
}

// ============================================================================
// 16. CALIBRATION_TAB_TRANSITION — 탭 전환 애니메이션
// ============================================================================

/**
 * 탭 콘텐츠 전환 클래스
 *
 * Web Interface Guidelines: specific property (opacity)만 전환
 */
export const CALIBRATION_TAB_TRANSITION = TRANSITION_PRESETS.fastOpacity;

// ============================================================================
// 17. CALIBRATION_RESULT_BADGE — 교정 결과 배지
// ============================================================================

/**
 * 교정 결과 배지 스타일 (design token SSOT)
 *
 * - pass: 합격 (UL Green)
 * - fail: 불합격 (UL Red)
 * - conditional: 조건부 합격 (Yellow)
 */
export const CALIBRATION_RESULT_BADGE: Record<string, string> = {
  pass: `${getSemanticContainerColorClasses('ok')} ${getSemanticContainerTextClasses('ok')}`,
  fail: 'bg-brand-critical/10 text-brand-critical border-brand-critical/20',
  conditional: `${getSemanticContainerColorClasses('warning')} ${getSemanticContainerTextClasses('warning')}`,
};
export const DEFAULT_CALIBRATION_RESULT_BADGE = 'bg-muted text-muted-foreground border-border';

// ============================================================================
// 18. CALIBRATION_APPROVAL_BADGE — 교정 승인 상태 배지
// ============================================================================

/**
 * 교정 승인 상태 배지 스타일 (design token SSOT)
 *
 * - pending_approval: 승인 대기 (Yellow)
 * - approved: 승인됨 (UL Green)
 * - rejected: 반려됨 (UL Red)
 */
export const CALIBRATION_APPROVAL_BADGE: Record<string, string> = {
  pending_approval: `${getSemanticContainerColorClasses('warning')} ${getSemanticContainerTextClasses('warning')}`,
  approved: `${getSemanticContainerColorClasses('ok')} ${getSemanticContainerTextClasses('ok')}`,
  rejected: 'bg-brand-critical/10 text-brand-critical border-brand-critical/20',
};
export const DEFAULT_CALIBRATION_APPROVAL_BADGE = 'bg-muted text-muted-foreground border-border';

// ============================================================================
// 19. CALIBRATION_INLINE_ACTION_BUTTONS — 테이블 행 인라인 승인/반려 버튼
// ============================================================================

/**
 * 테이블 행에 인라인으로 표시되는 소형 승인/반려 버튼 스타일
 *
 * h-7: 행 높이에 맞는 컴팩트 사이즈
 * CalibrationApprovalActions, CalibrationApprovalsContent 등에서 SSOT 참조
 */
export const CALIBRATION_INLINE_ACTION_BUTTONS = {
  base: 'h-7 px-2 text-xs',
  approve: 'text-brand-ok border-brand-ok/30 hover:bg-brand-ok/10',
  reject: 'text-destructive border-destructive/30 hover:bg-destructive/10',
} as const;

/**
 * Utility: 승인/반려 인라인 버튼 클래스 가져오기
 */
export function getCalibrationActionButtonClasses(action: 'approve' | 'reject'): string {
  return [CALIBRATION_INLINE_ACTION_BUTTONS.base, CALIBRATION_INLINE_ACTION_BUTTONS[action]].join(
    ' '
  );
}

// ============================================================================
// 20. CALIBRATION_ALERT_TOKENS — 교정 경고 배너
// ============================================================================

/**
 * 교정 Alert Banner 스타일 (CHECKOUT_ALERT_TOKENS 패턴 참조)
 *
 * - overdue: 교정기한 초과 장비 (UL-QP-18: 사용 금지 대상)
 * - upcoming: 30일 이내 교정 예정 (사전 대비)
 */
export const CALIBRATION_ALERT_TOKENS = {
  overdue: {
    container:
      'flex items-center gap-3 bg-brand-critical/5 border border-brand-critical/20 rounded-lg px-4 py-3',
    icon: 'text-brand-critical shrink-0 h-4 w-4',
    text: 'flex-1 text-sm text-brand-critical',
    action:
      'text-xs font-semibold text-brand-critical underline whitespace-nowrap cursor-pointer hover:text-brand-critical/70',
    close: 'text-brand-critical/40 hover:text-brand-critical/70 cursor-pointer shrink-0',
  },
  upcoming: {
    container:
      'flex items-center gap-3 bg-brand-warning/5 border border-brand-warning/20 rounded-lg px-4 py-3',
    icon: 'text-brand-warning shrink-0 h-4 w-4',
    text: 'flex-1 text-sm text-brand-warning',
    action:
      'text-xs font-semibold text-brand-warning underline whitespace-nowrap cursor-pointer hover:text-brand-warning/70',
    close: 'text-brand-warning/40 hover:text-brand-warning/70 cursor-pointer shrink-0',
  },
} as const;

// ============================================================================
// 21. CALIBRATION_VERSION_HISTORY — 버전 히스토리 스타일
// ============================================================================

/**
 * 교정계획서 버전 히스토리 토큰
 *
 * - row: 현재/비현재 행 스타일
 * - icon: 아이콘 색상
 * - latestBadge: "최신" 배지
 * - currentBadge: "현재" 배지
 */
export const CALIBRATION_VERSION_HISTORY = {
  row: {
    /** 공통 레이아웃 (padding, border, radius, transition) */
    base: `flex items-center justify-between p-3 border rounded-lg ${TRANSITION_PRESETS.fastColor}`,
    current: 'bg-brand-ok/5 border-brand-ok/30',
    default: 'hover:bg-muted/50',
  },
  icon: {
    current: 'text-brand-ok',
    default: 'text-muted-foreground',
  },
  latestBadge: `${getSemanticContainerColorClasses('ok')} ${getSemanticContainerTextClasses('ok')} border`,
  currentBadge: 'text-ul-midnight border-ul-midnight/30',
} as const;

// ============================================================================
// 22. CALIBRATION_FILTER_BAR — 필터 바 스타일
// ============================================================================

/**
 * 교정 관리 필터 바 토큰 (CHECKOUT_FILTER_BAR_TOKENS 대칭)
 */
export const CALIBRATION_FILTER_BAR = {
  container:
    'bg-card border border-border/60 rounded-lg px-3 py-2.5 flex flex-wrap items-center gap-2',
  divider: 'w-px h-6 bg-border/60',
  tag: [
    'inline-flex items-center gap-1 text-xs',
    'text-primary bg-primary/10 px-2 py-0.5 rounded-full',
    'hover:bg-primary/20',
    TRANSITION_PRESETS.instantBg,
  ].join(' '),
  tagDismissIcon: 'h-2.5 w-2.5',
  resetButton: 'flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground',
} as const;
