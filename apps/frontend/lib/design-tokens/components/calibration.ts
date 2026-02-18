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
import { getTransitionClasses } from '../motion';
import { type StatsVariant } from './dashboard';
import { AlertCircle, AlertTriangle, Calendar, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
    dot: 'bg-ul-red dark:bg-ul-red',
    text: 'text-ul-red dark:text-red-400',
  },
  upcoming: {
    dot: 'bg-ul-orange dark:bg-ul-orange',
    text: 'text-ul-orange dark:text-ul-orange',
  },
  ok: {
    dot: 'bg-ul-green dark:bg-ul-green',
    text: 'text-ul-green dark:text-green-400',
  },
  none: {
    dot: 'bg-muted dark:bg-muted',
    text: 'text-muted-foreground dark:text-muted-foreground',
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
    badge: 'bg-ul-red/10 text-ul-red border-ul-red/20 dark:bg-ul-red/20 dark:text-red-300',
    icon: AlertCircle,
  },
  today: {
    badge:
      'bg-ul-orange/10 text-ul-orange border-ul-orange/20 dark:bg-ul-orange/20 dark:text-orange-300',
    icon: Clock,
  },
  upcoming: {
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    icon: AlertTriangle,
  },
  future: {
    badge: 'bg-ul-blue/10 text-ul-blue border-ul-blue/20 dark:bg-ul-blue/20 dark:text-blue-300',
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
export const CALIBRATION_STATS_TEXT: Record<CalibrationStatsType, string> = {
  total: 'text-foreground',
  compliant: 'text-ul-green dark:text-green-400',
  overdue: 'text-ul-red dark:text-red-400',
  upcoming: 'text-ul-orange dark:text-orange-400',
};

// ============================================================================
// 4. CALIBRATION_TAB_COLORS — 탭별 색상
// ============================================================================

/**
 * 탭 타입
 */
export type CalibrationTabType = 'all' | 'overdue' | 'upcoming' | 'intermediate';

/**
 * 탭별 색상 (UL Brand 통일)
 *
 * - overdue: UL Red
 * - upcoming: UL Orange
 * - intermediate: UL Fog (purple 대체)
 */
export const CALIBRATION_TAB_COLORS: Record<CalibrationTabType, string> = {
  all: 'text-foreground',
  overdue: 'text-ul-red dark:text-red-400',
  upcoming: 'text-ul-orange dark:text-orange-400',
  intermediate: 'text-ul-fog dark:text-ul-info',
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
  statsCard: getTransitionClasses('fast', ['box-shadow', 'transform']),

  /** 테이블 행 hover */
  tableRow: getTransitionClasses('instant', ['background-color']),

  /** 탭 전환 */
  tab: getTransitionClasses('fast', ['color', 'border-color']),

  /** 링크 hover */
  link: getTransitionClasses('fast', ['color']),

  /** 장비 선택 리스트 */
  equipmentItem: getTransitionClasses('fast', ['background-color', 'border-color']),
} as const;

// ============================================================================
// 6. CALIBRATION_TABLE — 테이블 스타일
// ============================================================================

/**
 * 교정 테이블 스타일 (EQUIPMENT_TABLE_TOKENS 패턴 참조)
 */
export const CALIBRATION_TABLE = {
  /** Row hover */
  rowHover: ['hover:bg-muted/50 dark:hover:bg-muted/50', CALIBRATION_MOTION.tableRow].join(' '),

  /** 숫자 컬럼 (tabular-nums for Web Interface Guidelines) */
  numericColumn: 'tabular-nums',

  /** 링크 */
  link: ['hover:underline', CALIBRATION_MOTION.link].join(' '),
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
  selected: 'bg-ul-blue/10 border-l-4 border-ul-blue dark:bg-ul-blue/20 dark:border-ul-info',

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
  overdue: 'text-ul-red dark:text-red-400',
  today: 'text-ul-orange dark:text-orange-400',
  upcoming: 'text-ul-blue dark:text-blue-400',
  future: 'text-ul-blue dark:text-blue-400',
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
  overdue: 'border-ul-red/20 dark:border-ul-red/30',
  pending: 'border-ul-blue/20 dark:border-ul-blue/30',
  default: 'border-border',
};
