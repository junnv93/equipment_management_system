/**
 * Equipment Component Tokens (Layer 3: Component-Specific)
 *
 * 장비 관리 컴포넌트의 모든 디자인 값을 정의하는 SSOT
 * - 12개 상태별 스타일 (card, header, icon, label)
 * - 교정 D-day 배지 (3-tier: overdue, urgent, warning)
 * - 카드/헤더/탭/필터/테이블 스타일
 *
 * CRITICAL: 기존 equipment-status-styles.ts, EquipmentHeader.getStatusConfig() 통합
 */

import { FOCUS_TOKENS } from '../semantic';
import { getTransitionClasses } from '../motion';
import {
  CheckCircle,
  Play,
  FileOutput,
  XCircle,
  Archive,
  Ban,
  AlertCircle,
  Package,
  AlertTriangle,
  Calendar,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// Equipment Status Tokens (12개 상태)
// ============================================================================

/**
 * 장비 상태별 스타일 정의
 *
 * 각 상태마다 4가지 context:
 * - card: 카드 목록용 (light bg)
 * - header: 상세 헤더용 (dark bg - ul-midnight)
 * - icon: 아이콘 컴포넌트
 * - label: 한국어 라벨
 * - borderColor: 카드 왼쪽 테두리
 */
export interface EquipmentStatusConfig {
  /** 카드 목록용 스타일 */
  card: {
    className: string; // Badge 클래스
    borderColor: string; // Card border-left
    statusBarColor: string; // 테이블 4px 상태 세로 바 (bg-brand-*)
  };
  /** 상세 헤더용 스타일 (dark background) */
  header: {
    textColor: string; // 텍스트 색상
    bgClasses: string; // 배경 + 테두리
  };
  /** 상태 아이콘 */
  icon: LucideIcon;
  /** 한국어 라벨 */
  label: string;
  /** i18n 메시지 키 (예: "equipment.status.available") — Phase 3에서 useTranslations()로 전환 */
  labelKey: string;
}

/**
 * EQUIPMENT_STATUS_TOKENS
 *
 * SSOT: equipment-status-styles.ts + EquipmentHeader.getStatusConfig() 통합
 */
export const EQUIPMENT_STATUS_TOKENS: Record<string, EquipmentStatusConfig> = {
  available: {
    card: {
      className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
      borderColor: 'border-l-green-500',
      statusBarColor: 'bg-brand-ok',
    },
    header: {
      textColor: 'text-green-800 dark:text-green-300',
      bgClasses: 'bg-green-100 dark:bg-green-900/30 border-green-500',
    },
    icon: CheckCircle,
    label: '사용 가능',
    labelKey: 'equipment.status.available',
  },
  in_use: {
    card: {
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      borderColor: 'border-l-blue-500',
      statusBarColor: 'bg-brand-info',
    },
    header: {
      textColor: 'text-blue-800 dark:text-blue-300',
      bgClasses: 'bg-blue-100 dark:bg-blue-900/30 border-blue-500',
    },
    icon: Play,
    label: '사용 중',
    labelKey: 'equipment.status.in_use',
  },
  checked_out: {
    card: {
      className: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
      borderColor: 'border-l-orange-500',
      statusBarColor: 'bg-brand-info/70',
    },
    header: {
      textColor: 'text-ul-midnight dark:text-blue-300',
      bgClasses: 'bg-blue-50 dark:bg-blue-950/30 border-blue-400',
    },
    icon: FileOutput,
    label: '반출 중',
    labelKey: 'equipment.status.checked_out',
  },
  calibration_scheduled: {
    // UI는 "사용 가능"으로 표시 (교정 상태는 별도 배지)
    card: {
      className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
      borderColor: 'border-l-green-500',
      statusBarColor: 'bg-brand-warning',
    },
    header: {
      textColor: 'text-green-800 dark:text-green-300',
      bgClasses: 'bg-green-100 dark:bg-green-900/30 border-green-500',
    },
    icon: CheckCircle,
    label: '사용 가능', // calibration_scheduled → available 표시
    labelKey: 'equipment.status.available',
  },
  calibration_overdue: {
    // UI는 "부적합"으로 표시
    card: {
      className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
      borderColor: 'border-l-red-600',
      statusBarColor: 'bg-brand-critical',
    },
    header: {
      textColor: 'text-red-700 dark:text-red-300',
      bgClasses: 'bg-red-100 dark:bg-red-900/30 border-red-500',
    },
    icon: XCircle,
    label: '부적합', // calibration_overdue → non_conforming 표시
    labelKey: 'equipment.status.non_conforming',
  },
  non_conforming: {
    card: {
      className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
      borderColor: 'border-l-red-600',
      statusBarColor: 'bg-brand-critical',
    },
    header: {
      textColor: 'text-red-700 dark:text-red-300',
      bgClasses: 'bg-red-100 dark:bg-red-900/30 border-red-500',
    },
    icon: XCircle,
    label: '부적합',
    labelKey: 'equipment.status.non_conforming',
  },
  spare: {
    card: {
      className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
      borderColor: 'border-l-slate-500',
      statusBarColor: 'bg-brand-neutral',
    },
    header: {
      textColor: 'text-gray-700 dark:text-gray-300',
      bgClasses: 'bg-gray-100 dark:bg-gray-800/30 border-gray-400',
    },
    icon: Archive,
    label: '여분',
    labelKey: 'equipment.status.spare',
  },
  retired: {
    card: {
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      borderColor: 'border-l-gray-500',
      statusBarColor: 'bg-brand-neutral/50',
    },
    header: {
      textColor: 'text-gray-600 dark:text-gray-400',
      bgClasses: 'bg-gray-200 dark:bg-gray-800/50 border-gray-500',
    },
    icon: Ban,
    label: '폐기',
    labelKey: 'equipment.status.retired',
  },
  pending_disposal: {
    card: {
      className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      borderColor: 'border-l-orange-500',
      statusBarColor: 'bg-brand-warning',
    },
    header: {
      textColor: 'text-orange-700 dark:text-orange-300',
      bgClasses: 'bg-orange-100 dark:bg-orange-900/30 border-orange-500',
    },
    icon: AlertCircle,
    label: '폐기 진행 중',
    labelKey: 'equipment.status.pending_disposal',
  },
  disposed: {
    card: {
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      borderColor: 'border-l-gray-500',
      statusBarColor: 'bg-brand-neutral/50',
    },
    header: {
      textColor: 'text-gray-600 dark:text-gray-400',
      bgClasses: 'bg-gray-200 dark:bg-gray-800/50 border-gray-500',
    },
    icon: Ban,
    label: '폐기 완료',
    labelKey: 'equipment.status.disposed',
  },
  temporary: {
    card: {
      className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      borderColor: 'border-l-cyan-500',
      statusBarColor: 'bg-brand-purple',
    },
    header: {
      textColor: 'text-cyan-700 dark:text-cyan-300',
      bgClasses: 'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-500',
    },
    icon: Package,
    label: '임시',
    labelKey: 'equipment.status.temporary',
  },
  inactive: {
    card: {
      className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
      borderColor: 'border-l-slate-400',
      statusBarColor: 'bg-brand-neutral/50',
    },
    header: {
      textColor: 'text-slate-600 dark:text-slate-400',
      bgClasses: 'bg-slate-100 dark:bg-slate-800/30 border-slate-400',
    },
    icon: Package,
    label: '비활성',
    labelKey: 'equipment.status.inactive',
  },
};

/**
 * 기본 상태 스타일 (알 수 없는 상태)
 */
export const DEFAULT_STATUS_CONFIG: EquipmentStatusConfig = {
  card: {
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    borderColor: 'border-l-gray-500',
    statusBarColor: 'bg-brand-neutral',
  },
  header: {
    textColor: 'text-gray-800 dark:text-gray-300',
    bgClasses: 'bg-gray-100 dark:bg-gray-800 border-gray-400',
  },
  icon: Package,
  label: '알 수 없음',
  labelKey: 'equipment.status.unknown',
};

// ============================================================================
// Calibration D-day Badge Tokens
// ============================================================================

/**
 * 교정 배지 severity 타입
 */
export type CalibrationSeverity = 'overdue' | 'urgent' | 'warning';

/**
 * 교정 배지 스타일 (3-tier)
 *
 * - overdue: 교정기한 초과 (빨강)
 * - urgent: 7일 이내 (주황)
 * - warning: 30일 이내 (노랑)
 */
export interface CalibrationBadgeStyle {
  /** 카드 목록용 */
  card: string;
  /** 테이블용 */
  table: string;
  /** 헤더용 (dark background) */
  header: {
    textColor: string;
    bgClasses: string;
  };
  /** 아이콘 */
  icon: LucideIcon;
}

/**
 * CALIBRATION_BADGE_TOKENS
 *
 * SSOT: EquipmentHeader, EquipmentCardGrid, EquipmentTable의 D-day 배지 통합
 */
export const CALIBRATION_BADGE_TOKENS: Record<CalibrationSeverity, CalibrationBadgeStyle> = {
  overdue: {
    card: 'bg-red-600 text-white border-red-400',
    table: 'bg-red-600 text-white',
    header: {
      textColor: 'text-red-100',
      bgClasses: 'bg-red-600/90 border-red-400',
    },
    icon: AlertCircle,
  },
  urgent: {
    card: 'bg-orange-500 text-white border-orange-400',
    table: 'bg-orange-500 text-white',
    header: {
      textColor: 'text-orange-100',
      bgClasses: 'bg-orange-500/90 border-orange-400',
    },
    icon: AlertTriangle,
  },
  warning: {
    card: 'bg-yellow-600 text-white border-yellow-400',
    table: 'bg-yellow-600 text-white',
    header: {
      textColor: 'text-yellow-100',
      bgClasses: 'bg-yellow-600/90 border-yellow-400',
    },
    icon: Calendar,
  },
};

// ============================================================================
// Equipment Card Tokens
// ============================================================================

/**
 * 장비 카드 스타일
 */
export const EQUIPMENT_CARD_TOKENS = {
  /** 기본 클래스 */
  base: 'border-l-4',

  /** Hover transition */
  hover: ['hover:shadow-md', getTransitionClasses('fast', ['box-shadow', 'transform'])].join(' '),

  /** 포커스 (카드 링크용) */
  focus: [
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-ul-info',
    'focus-visible:ring-offset-2',
  ].join(' '),
} as const;

/**
 * Utility: Equipment 카드 클래스 생성
 *
 * @param borderColor - 왼쪽 테두리 색상 (EQUIPMENT_STATUS_TOKENS[status].card.borderColor)
 * @returns Tailwind 클래스 문자열
 */
export function getEquipmentCardClasses(borderColor: string): string {
  return [EQUIPMENT_CARD_TOKENS.base, borderColor, EQUIPMENT_CARD_TOKENS.hover].join(' ');
}

// ============================================================================
// Equipment Header Tokens
// ============================================================================

/**
 * 장비 상세 헤더 스타일
 */
export const EQUIPMENT_HEADER_TOKENS = {
  /** 배경 그라데이션 (UL Midnight Blue) */
  background: 'bg-gradient-to-r from-ul-midnight via-ul-midnight-dark to-ul-midnight',

  /** 텍스트 색상 */
  text: 'text-white',

  /** 섹션 여백 */
  padding: 'px-4 sm:px-6 lg:px-8 py-8',

  /** 컨테이너 */
  container: 'max-w-7xl mx-auto',
} as const;

/**
 * 헤더 버튼 variant 타입
 */
export type HeaderButtonVariant = 'primary' | 'secondary' | 'destructive' | 'back';

/**
 * Utility: Equipment 헤더 버튼 클래스 생성
 *
 * @param variant - 버튼 종류
 * @returns Tailwind 클래스 문자열
 */
export function getEquipmentHeaderButtonClasses(variant: HeaderButtonVariant = 'primary'): string {
  const baseClasses = [
    getTransitionClasses('fast', ['background-color', 'color', 'transform']),
    'hover:scale-[1.01]',
    'active:scale-[0.99]',
    FOCUS_TOKENS.classes.onDark, // focus-visible on dark background
  ];

  const variantClasses: Record<HeaderButtonVariant, string[]> = {
    primary: ['bg-white/10', 'text-white', 'hover:bg-white/20'],
    secondary: ['bg-transparent', 'text-white/80', 'hover:text-white', 'hover:bg-white/10'],
    destructive: ['bg-red-600', 'text-white', 'hover:bg-red-700'],
    back: ['text-white/80', 'hover:text-white', 'hover:bg-white/10'],
  };

  return [...baseClasses, ...variantClasses[variant]].join(' ');
}

// ============================================================================
// Equipment Tab Tokens
// ============================================================================

/**
 * 장비 탭 스타일
 */
export const EQUIPMENT_TAB_TOKENS = {
  /** Trigger (탭 버튼) */
  trigger: {
    base: [
      'px-4 py-2 text-sm font-medium',
      'border-b-2 border-transparent',
      getTransitionClasses('fast', ['color', 'border-color']),
    ].join(' '),
    active: 'border-ul-midnight text-ul-midnight dark:border-ul-info dark:text-ul-info',
    inactive: 'text-muted-foreground hover:text-foreground',
    focus: FOCUS_TOKENS.classes.brand,
  },

  /** Content (탭 내용) */
  content: {
    base: 'pt-6',
    animation: getTransitionClasses('moderate', ['opacity']),
  },

  /** Icon */
  icon: {
    size: 'h-4 w-4',
  },

  /** 모바일 스크롤 */
  mobileScroll: {
    container: 'overflow-x-auto scrollbar-hide',
    snap: 'scroll-snap-type-x scroll-snap-align-start',
  },
} as const;

// ============================================================================
// Equipment Filter Tokens
// ============================================================================

/**
 * 장비 필터 스타일
 */
export const EQUIPMENT_FILTER_TOKENS = {
  /** Active 필터 배지 */
  activeBadge: 'bg-ul-midnight/10 text-ul-midnight border-ul-midnight/20',

  /** Remove 버튼 */
  removeButton: [
    'h-4 w-4',
    'text-ul-midnight/60',
    'hover:text-ul-midnight',
    getTransitionClasses('fast', ['color']),
  ].join(' '),

  /** 필터 카운트 */
  count: 'tabular-nums font-medium',
} as const;

// ============================================================================
// Equipment Empty State Tokens
// ============================================================================

/**
 * 빈 상태 스타일
 */
export const EQUIPMENT_EMPTY_STATE_TOKENS = {
  /** 아이콘 컨테이너 */
  iconContainer: 'mx-auto h-12 w-12 text-muted-foreground',

  /** 아이콘 */
  icon: 'h-12 w-12',

  /** 제목 */
  title: 'mt-4 text-lg font-semibold text-balance',

  /** 설명 */
  description: 'mt-2 text-sm text-muted-foreground text-balance',

  /** 전체 컨테이너 */
  container: 'text-center py-12',
} as const;

// ============================================================================
// Equipment Table Tokens
// ============================================================================

/**
 * 장비 테이블 스타일
 */
export const EQUIPMENT_TABLE_TOKENS = {
  /** Row hover */
  rowHover: ['hover:bg-muted/50', getTransitionClasses('instant', ['background-color'])].join(' '),

  /** Header */
  header: {
    base: 'font-semibold text-xs uppercase tracking-wider',
    sortable: 'cursor-pointer select-none',
  },

  /** Sort 버튼 */
  sortButton: [
    'inline-flex items-center gap-1',
    'hover:text-foreground',
    getTransitionClasses('fast', ['color']),
  ].join(' '),

  /** 수치 컬럼 */
  numericColumn: 'tabular-nums',

  /** 3px 상태 바 셀 */
  statusBar: {
    cell: 'w-[3px] p-0',
    indicator: 'block w-[3px] h-full min-h-[2.5rem]',
  },

  /** 상태 배지 (텍스트 전용, 고정폭) */
  statusBadge: 'min-w-[4.5rem] text-center text-xs font-medium border-0 inline-flex justify-center',

  /** 장비명 하위 2차 텍스트 (모델명) */
  secondaryText: 'text-xs text-muted-foreground mt-0.5 truncate',
} as const;

// ============================================================================
// Equipment List Page Tokens
// ============================================================================

/**
 * 장비 목록 페이지 헤더 스타일
 */
export const EQUIPMENT_LIST_HEADER_TOKENS = {
  container: 'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
  title: 'text-2xl lg:text-3xl font-display font-bold tracking-tight text-brand-text-primary',
  subtitle: 'text-sm text-brand-text-muted mt-1',
} as const;

/**
 * 장비 상태 요약 스트립 스타일
 *
 * Dashboard API (GET /api/dashboard/equipment-status-stats) 재활용
 */
export const EQUIPMENT_STATS_STRIP_TOKENS = {
  container:
    'flex items-center gap-3 px-3 py-2 bg-brand-bg-elevated/50 rounded-lg border border-brand-border-subtle overflow-x-auto',
  item: 'flex items-center gap-1.5 text-sm whitespace-nowrap',
  dot: 'h-2 w-2 rounded-full flex-shrink-0',
  count: 'font-mono tabular-nums font-semibold text-brand-text-primary',
  label: 'text-brand-text-muted text-xs',
  divider: 'h-4 w-px bg-brand-border-subtle flex-shrink-0',
  totalCount: 'font-mono tabular-nums font-bold text-lg text-brand-text-primary',
} as const;

/**
 * 장비 필터 툴바 컨테이너 스타일
 */
export const EQUIPMENT_TOOLBAR_TOKENS = {
  filterContainer: 'bg-brand-bg-elevated/50 rounded-lg border border-brand-border-subtle px-3 py-2',
  filterCount: 'text-xs tabular-nums font-medium text-brand-text-secondary',
} as const;

/**
 * 장비 상태 배지 클래스 + 라벨 반환 (SSOT)
 *
 * equipment-status-styles.ts의 getEquipmentStatusStyle()를 design token으로 통합.
 * - 12개 상태의 className/label/borderColor/statusBarColor 반환
 * - nextCalibrationDate 기반 실시간 교정기한 초과 override
 * - calibration_scheduled → "사용 가능"으로 표시 (UL-QP-18)
 * - calibration_overdue → "부적합"으로 표시
 */
export function getEquipmentStatusTokenStyle(
  status: string | undefined | null,
  nextCalibrationDate?: string | Date | null
): { className: string; label: string; borderColor: string; statusBarColor: string } {
  // 실시간 교정기한 초과 체크 (백엔드 스케줄러가 아직 실행되지 않은 경우 대비)
  if (status === 'available' && nextCalibrationDate && new Date(nextCalibrationDate) < new Date()) {
    const nonConforming = EQUIPMENT_STATUS_TOKENS.non_conforming;
    return {
      className: nonConforming.card.className,
      label: nonConforming.label,
      borderColor: nonConforming.card.borderColor,
      statusBarColor: nonConforming.card.statusBarColor,
    };
  }

  const token = status ? EQUIPMENT_STATUS_TOKENS[status] : null;
  if (token) {
    return {
      className: token.card.className,
      label: token.label,
      borderColor: token.card.borderColor,
      statusBarColor: token.card.statusBarColor,
    };
  }

  return {
    className: DEFAULT_STATUS_CONFIG.card.className,
    label: status || DEFAULT_STATUS_CONFIG.label,
    borderColor: DEFAULT_STATUS_CONFIG.card.borderColor,
    statusBarColor: DEFAULT_STATUS_CONFIG.card.statusBarColor,
  };
}
