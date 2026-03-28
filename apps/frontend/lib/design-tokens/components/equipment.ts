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
import { TRANSITION_PRESETS } from '../motion';
import {
  getSemanticStatusClasses,
  getSemanticLeftBorderClasses,
  getSemanticSolidBgClasses,
  getSemanticContainerTextClasses,
} from '../brand';
import { PAGE_HEADER_TOKENS } from './page-layout';
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
 * - labelKey: i18n 메시지 키
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
  /** i18n 메시지 키 (예: "equipment.status.available") — useTranslations()로 렌더링 */
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
      className: getSemanticStatusClasses('ok'),
      borderColor: getSemanticLeftBorderClasses('ok'),
      statusBarColor: 'bg-brand-ok',
    },
    header: {
      textColor: getSemanticContainerTextClasses('ok'),
      bgClasses: 'bg-brand-ok/10 border-brand-ok',
    },
    icon: CheckCircle,
    labelKey: 'equipment.status.available',
  },
  in_use: {
    card: {
      className: getSemanticStatusClasses('info'),
      borderColor: getSemanticLeftBorderClasses('info'),
      statusBarColor: 'bg-brand-info',
    },
    header: {
      textColor: getSemanticContainerTextClasses('info'),
      bgClasses: 'bg-brand-info/10 border-brand-info',
    },
    icon: Play,
    labelKey: 'equipment.status.in_use',
  },
  checked_out: {
    card: {
      className: getSemanticStatusClasses('repair'),
      borderColor: getSemanticLeftBorderClasses('repair'),
      statusBarColor: 'bg-brand-info/70',
    },
    header: {
      textColor: 'text-ul-midnight dark:text-brand-info',
      bgClasses: 'bg-brand-info/10 border-brand-info',
    },
    icon: FileOutput,
    labelKey: 'equipment.status.checked_out',
  },
  calibration_scheduled: {
    // UI는 "사용 가능"으로 표시 (교정 상태는 별도 배지)
    card: {
      className: getSemanticStatusClasses('ok'),
      borderColor: getSemanticLeftBorderClasses('ok'),
      statusBarColor: 'bg-brand-warning',
    },
    header: {
      textColor: getSemanticContainerTextClasses('ok'),
      bgClasses: 'bg-brand-ok/10 border-brand-ok',
    },
    icon: CheckCircle,
    labelKey: 'equipment.status.available',
  },
  calibration_overdue: {
    // UI는 "부적합"으로 표시
    card: {
      className: getSemanticStatusClasses('critical'),
      borderColor: getSemanticLeftBorderClasses('critical'),
      statusBarColor: 'bg-brand-critical',
    },
    header: {
      textColor: getSemanticContainerTextClasses('critical'),
      bgClasses: 'bg-brand-critical/10 border-brand-critical',
    },
    icon: XCircle,
    labelKey: 'equipment.status.non_conforming',
  },
  non_conforming: {
    card: {
      className: getSemanticStatusClasses('critical'),
      borderColor: getSemanticLeftBorderClasses('critical'),
      statusBarColor: 'bg-brand-critical',
    },
    header: {
      textColor: getSemanticContainerTextClasses('critical'),
      bgClasses: 'bg-brand-critical/10 border-brand-critical',
    },
    icon: XCircle,
    labelKey: 'equipment.status.non_conforming',
  },
  spare: {
    card: {
      className: getSemanticStatusClasses('neutral'),
      borderColor: getSemanticLeftBorderClasses('neutral'),
      statusBarColor: 'bg-brand-neutral',
    },
    header: {
      textColor: getSemanticContainerTextClasses('neutral'),
      bgClasses: 'bg-brand-neutral/10 border-brand-neutral',
    },
    icon: Archive,
    labelKey: 'equipment.status.spare',
  },
  retired: {
    card: {
      className: getSemanticStatusClasses('neutral'),
      borderColor: getSemanticLeftBorderClasses('neutral'),
      statusBarColor: 'bg-brand-neutral/50',
    },
    header: {
      textColor: getSemanticContainerTextClasses('neutral'),
      bgClasses: 'bg-brand-neutral/20 border-brand-neutral',
    },
    icon: Ban,
    labelKey: 'equipment.status.retired',
  },
  pending_disposal: {
    card: {
      className: getSemanticStatusClasses('repair'),
      borderColor: getSemanticLeftBorderClasses('repair'),
      statusBarColor: 'bg-brand-warning',
    },
    header: {
      textColor: getSemanticContainerTextClasses('repair'),
      bgClasses: 'bg-brand-repair/10 border-brand-repair',
    },
    icon: AlertCircle,
    labelKey: 'equipment.status.pending_disposal',
  },
  disposed: {
    card: {
      className: getSemanticStatusClasses('neutral'),
      borderColor: getSemanticLeftBorderClasses('neutral'),
      statusBarColor: 'bg-brand-neutral/50',
    },
    header: {
      textColor: getSemanticContainerTextClasses('neutral'),
      bgClasses: 'bg-brand-neutral/20 border-brand-neutral',
    },
    icon: Ban,
    labelKey: 'equipment.status.disposed',
  },
  temporary: {
    card: {
      className: getSemanticStatusClasses('temporary'),
      borderColor: getSemanticLeftBorderClasses('temporary'),
      statusBarColor: 'bg-brand-temporary',
    },
    header: {
      textColor: getSemanticContainerTextClasses('temporary'),
      bgClasses: 'bg-brand-temporary/10 border-brand-temporary',
    },
    icon: Package,
    labelKey: 'equipment.status.temporary',
  },
  inactive: {
    card: {
      className: getSemanticStatusClasses('neutral'),
      borderColor: getSemanticLeftBorderClasses('neutral'),
      statusBarColor: 'bg-brand-neutral/50',
    },
    header: {
      textColor: getSemanticContainerTextClasses('neutral'),
      bgClasses: 'bg-brand-neutral/10 border-brand-neutral',
    },
    icon: Package,
    labelKey: 'equipment.status.inactive',
  },
};

/**
 * 기본 상태 스타일 (알 수 없는 상태)
 */
export const DEFAULT_STATUS_CONFIG: EquipmentStatusConfig = {
  card: {
    className: getSemanticStatusClasses('neutral'),
    borderColor: getSemanticLeftBorderClasses('neutral'),
    statusBarColor: 'bg-brand-neutral',
  },
  header: {
    textColor: getSemanticContainerTextClasses('neutral'),
    bgClasses: 'bg-brand-neutral/10 border-brand-neutral',
  },
  icon: Package,
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
    card: `${getSemanticSolidBgClasses('critical')} border-brand-critical/40`,
    table: getSemanticSolidBgClasses('critical'),
    header: {
      textColor: 'text-brand-critical/80',
      bgClasses: 'bg-brand-critical/90 border-brand-critical/40',
    },
    icon: AlertCircle,
  },
  urgent: {
    card: `${getSemanticSolidBgClasses('repair')} border-brand-repair/40`,
    table: getSemanticSolidBgClasses('repair'),
    header: {
      textColor: 'text-brand-repair/80',
      bgClasses: 'bg-brand-repair/90 border-brand-repair/40',
    },
    icon: AlertTriangle,
  },
  warning: {
    card: `${getSemanticSolidBgClasses('warning')} border-brand-warning/40`,
    table: getSemanticSolidBgClasses('warning'),
    header: {
      textColor: 'text-brand-warning/80',
      bgClasses: 'bg-brand-warning/90 border-brand-warning/40',
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
  hover: ['hover:shadow-md', TRANSITION_PRESETS.fastShadowTransform].join(' '),

  /** 포커스 (카드 링크용) */
  focus: [
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-brand-info',
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
    TRANSITION_PRESETS.fastBgColorTransform,
    'hover:scale-[1.01]',
    'active:scale-[0.99]',
    FOCUS_TOKENS.classes.onDark, // focus-visible on dark background
  ];

  const variantClasses: Record<HeaderButtonVariant, string[]> = {
    primary: ['bg-white/10', 'text-white', 'hover:bg-white/20'],
    secondary: ['bg-transparent', 'text-white/80', 'hover:text-white', 'hover:bg-white/10'],
    destructive: ['bg-brand-critical', 'text-white', 'hover:bg-brand-critical/90'],
    back: ['text-white/80', 'hover:text-white', 'hover:bg-white/10'],
  };

  return [...baseClasses, ...variantClasses[variant]].join(' ');
}

// ============================================================================
// Equipment Tab Tokens
// ============================================================================

/**
 * 장비 탭 스타일
 *
 * pill 스타일 탭 (TabsList bg-card 컨테이너 내부)
 * - base: padding + font + rounded + transition
 * - active: data-[state=active]: 접두사 포함 → 컴포넌트에서 별도 data-state 지정 불필요
 * - inactive: muted 텍스트 + hover bg
 */
export const EQUIPMENT_TAB_TOKENS = {
  /** Trigger (탭 버튼) — pill 스타일 */
  trigger: {
    base: ['px-3 py-1.5 text-sm font-medium rounded-md', TRANSITION_PRESETS.fastBgColor].join(' '),
    /** 활성 상태 (Radix UI data-state=active 포함) */
    active:
      'data-[state=active]:bg-ul-midnight data-[state=active]:text-white dark:data-[state=active]:bg-brand-info dark:data-[state=active]:text-ul-midnight',
    inactive: 'text-muted-foreground hover:text-foreground hover:bg-muted',
    focus: FOCUS_TOKENS.classes.brand,
  },

  /** Content (탭 내용) */
  content: {
    base: 'pt-6',
    animation: TRANSITION_PRESETS.moderateOpacity,
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
  /** Active 필터 배지 (라이트: midnight 톤 / 다크: 밝은 톤으로 대비 확보) */
  activeBadge:
    'bg-ul-midnight/10 text-ul-midnight border-ul-midnight/20 dark:bg-white/10 dark:text-white/90 dark:border-white/20',

  /** Remove 버튼 */
  removeButton: [
    'h-4 w-4',
    'text-ul-midnight/60 dark:text-white/50',
    'hover:text-ul-midnight dark:hover:text-white',
    TRANSITION_PRESETS.fastColor,
  ].join(' '),

  /** 필터 카운트 */
  count: 'tabular-nums font-medium',

  /** 레이아웃 */
  layout: {
    root: 'flex flex-col gap-3',
    primaryRow: 'flex flex-wrap gap-2 items-center',
    secondaryRow: 'flex flex-wrap gap-2 pt-1',
  },

  /** 2차 필터 확장/축소 트랜지션 (CSS-only grid-rows) */
  expandTransition:
    'motion-safe:transition-[grid-template-rows] motion-safe:duration-200 motion-safe:ease-[var(--ease-standard)] motion-reduce:transition-none',
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
  /** 테이블 외부 컨테이너 — AP-04 raised elevation */
  container:
    'border border-brand-border-subtle bg-brand-bg-surface rounded-lg overflow-hidden shadow-sm',

  /** 헤더 행 배경 — sticky top-0 (AP-07 프리미엄 테이블) */
  headerRow:
    'bg-brand-bg-elevated/80 border-b-2 border-brand-border-default [&_th]:sticky [&_th]:top-0 [&_th]:bg-brand-bg-elevated/95 [&_th]:z-10',

  /** Row hover — AP-07 좌측 accent bar 효과 (inset box-shadow) + AP-08 다크모드 */
  rowHover: [
    'hover:bg-brand-info/[0.03] hover:shadow-[inset_4px_0_0_hsl(var(--brand-color-info))]',
    'dark:hover:bg-brand-info/[0.08]',
    TRANSITION_PRESETS.instantBg,
  ].join(' '),

  /** 짝수 행 stripe — AP-07 프리미엄 테이블 */
  rowStripe: 'even:bg-muted/30 dark:even:bg-muted/10',

  /** Header */
  header: {
    base: 'font-semibold text-xs uppercase tracking-wider',
    sortable: 'cursor-pointer select-none',
  },

  /** Sort 버튼 */
  sortButton: [
    'inline-flex items-center gap-1',
    'hover:text-foreground',
    TRANSITION_PRESETS.fastColor,
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
 * 장비 목록 페이지 헤더 스타일 — PAGE_HEADER_TOKENS 기반 확장
 */
export const EQUIPMENT_LIST_HEADER_TOKENS = {
  ...PAGE_HEADER_TOKENS,
  /** 반응형 컨테이너 (모바일 세로 → 데스크톱 가로) */
  container: 'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
} as const;

/**
 * 장비 상태 요약 스트립 스타일
 *
 * Dashboard API (GET /api/dashboard/equipment-status-stats) 재활용
 */
export const EQUIPMENT_STATS_STRIP_TOKENS = {
  /** 스크롤 가능한 내부 컨테이너 */
  container:
    'flex items-center gap-3 px-3 py-2 bg-brand-bg-elevated/50 rounded-lg border border-brand-border-subtle overflow-x-auto',
  /** 외부 래퍼 (스크롤 gradient 인디케이터용 relative positioning) */
  wrapper: 'relative',
  /** 왼쪽 gradient fade (스크롤 가능성 인디케이터) */
  gradientLeft:
    'pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-brand-bg-surface to-transparent rounded-l-lg z-10',
  /** 오른쪽 gradient fade */
  gradientRight:
    'pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-brand-bg-surface to-transparent rounded-r-lg z-10',
  item: 'flex items-center gap-1.5 text-sm whitespace-nowrap',
  /** 인터랙티브 아이템 (클릭 가능한 버튼) */
  itemButton: [
    'flex items-center gap-1.5 text-sm whitespace-nowrap',
    'cursor-pointer rounded px-1 -mx-1 py-0.5',
    'hover:bg-brand-bg-elevated',
    TRANSITION_PRESETS.fastBg,
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
  ].join(' '),
  /** 활성 상태 (현재 필터 적용 중) */
  itemActive: 'bg-brand-bg-elevated ring-1 ring-brand-border-default rounded px-1 -mx-1 py-0.5',
  dot: 'h-2 w-2 rounded-full flex-shrink-0',
  /** 일반 카운트 */
  count: 'font-mono tabular-nums font-semibold text-brand-text-primary',
  /** 위험 상태 카운트 (calibration_overdue, non_conforming) */
  criticalCount: 'font-mono tabular-nums font-bold text-brand-critical',
  label: 'text-brand-text-muted text-xs',
  divider: 'h-4 w-px bg-brand-border-subtle flex-shrink-0',
  totalCount: 'font-mono tabular-nums font-bold text-lg text-brand-text-primary',
} as const;

/**
 * 장비 필터 툴바 컨테이너 스타일
 */
export const EQUIPMENT_TOOLBAR_TOKENS = {
  /** Unified Command Bar 컨테이너 (SearchBar + Filters + ViewToggle 통합) */
  commandBar: 'bg-brand-bg-elevated/50 rounded-lg border border-brand-border-subtle p-3',
  /** 결과 정보 바 (toolbar과 table 사이) */
  resultsBar: 'flex items-center justify-between px-1 py-1.5',
  /** 결과 카운트 텍스트 */
  resultsCount: 'text-sm tabular-nums text-brand-text-muted',
  /** 정렬 표시 */
  sortIndicator: [
    'inline-flex items-center gap-1 text-xs',
    'text-brand-text-secondary',
    'border border-brand-border-subtle rounded px-1.5 py-0.5',
  ].join(' '),
  /** @deprecated commandBar 사용 */
  filterContainer: 'bg-brand-bg-elevated/50 rounded-lg border border-brand-border-subtle px-3 py-2',
  filterCount: 'text-xs tabular-nums font-medium text-brand-text-secondary',
} as const;

// ============================================================================
// Equipment Status Display Order & Critical Statuses
// ============================================================================

/**
 * 상태 요약 스트립 표시 우선순위 (SSOT)
 *
 * STATUS_PRIORITY_ORDER를 컴포넌트 내에 중복 선언하지 말 것.
 * 상태 추가 시 이 배열과 EQUIPMENT_STATUS_TOKENS만 수정하면 됨.
 */
export const EQUIPMENT_STATUS_DISPLAY_ORDER = [
  'available',
  'in_use',
  'checked_out',
  'calibration_scheduled',
  'non_conforming',
  'calibration_overdue',
  'pending_disposal',
  'spare',
  'retired',
  'disposed',
  'temporary',
  'inactive',
] as const;

/**
 * 위험 상태 집합 (카운트 강조 표시 대상)
 *
 * 이 상태들은 StatusSummaryStrip에서 count를 빨간색(brand-critical)으로 표시한다.
 */
export const EQUIPMENT_CRITICAL_STATUSES = new Set<string>([
  'calibration_overdue',
  'non_conforming',
]);

// ============================================================================
// Equipment Detail Header Tokens (컴팩트 Sticky 헤더)
// ============================================================================

/**
 * 장비 상세 컴팩트 헤더 스타일
 *
 * 기존 EQUIPMENT_HEADER_TOKENS (dark gradient)와 별도로,
 * 컴팩트 sticky 헤더용 light background 스타일.
 */
export const EQUIPMENT_DETAIL_HEADER_TOKENS = {
  /** sticky + semantic bg (shadcn bg-background: white/dark 자동 대응) */
  container: 'sticky top-0 z-30 bg-background border-b border-border shadow-sm',
  breadcrumbRow:
    'py-1.5 text-sm text-muted-foreground flex items-center justify-between border-b border-border/50 px-4 sm:px-6 lg:px-8',
  mainRow: 'py-3 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8',
  nameGroup: 'flex flex-col gap-0.5 min-w-0',
  name: 'text-xl font-bold text-foreground truncate font-display',
  meta: 'text-xs text-muted-foreground flex items-center gap-2 flex-wrap',
  actions: 'flex items-center gap-2 flex-shrink-0',
  /** 뒤로가기 링크 — getTransitionClasses 적용 */
  backLink: [
    'flex items-center gap-1 shrink-0 hover:text-foreground text-xs',
    TRANSITION_PRESETS.fastColor,
  ].join(' '),
} as const;

// ============================================================================
// Equipment BasicInfo Card Tokens (와이어프레임 dl-grid 스타일)
// ============================================================================

/**
 * 기본정보 탭 카드 스타일 — 와이어프레임 info-card 패턴
 *
 * Primary 카드(기본정보): 좌측 brand-info 보더로 시각적 위계 강조
 * dl-grid: 2-column grid (라벨/값) — 서류 양식 모방
 */
export const EQUIPMENT_INFO_CARD_TOKENS = {
  /** 비대칭 그리드 컨테이너: Primary(1.6fr) + 보조 2개 — AP-01 해소 */
  grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr] gap-4',
  /** 카드 공통 */
  card: 'bg-card border border-border rounded-lg overflow-hidden shadow-sm',
  /** Primary 카드 — 좌측 강조 보더 (AP-04 깊이 차등) */
  cardPrimary:
    'bg-card border border-border border-l-[3px] border-l-brand-info rounded-lg overflow-hidden shadow-sm',

  /** 카드 헤더: 아이콘 + 타이틀 (uppercase tracking) */
  header: 'flex items-center gap-2 px-4 pt-4 pb-2',
  headerIcon: 'h-4 w-4 text-muted-foreground shrink-0',
  headerTitle: 'font-display text-xs font-semibold text-foreground uppercase tracking-widest',

  /** dl-grid: 2-column 라벨-값 쌍 */
  body: 'px-4 pb-4',
  dlGrid: 'grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]',
  dtLabel: 'text-muted-foreground whitespace-nowrap py-1',
  ddValue: 'text-foreground font-medium py-1',
  ddMono: 'font-mono text-xs tracking-wider text-foreground font-medium py-1',
} as const;

/**
 * 최근 교정이력 타임라인 스타일
 */
export const EQUIPMENT_CALIBRATION_TIMELINE_TOKENS = {
  container: 'relative pl-8',
  line: 'absolute left-[7px] top-1 bottom-1 w-0.5 bg-border rounded-full',
  item: 'relative pb-6 last:pb-0',
  dot: {
    base: 'absolute left-[-25px] top-1 w-2.5 h-2.5 rounded-full border-2 border-card',
    ok: 'bg-brand-ok shadow-[0_0_0_2px_rgba(16,185,129,0.3)]',
    info: 'bg-brand-info shadow-[0_0_0_2px_rgba(59,130,246,0.3)]',
    warn: 'bg-brand-warning shadow-[0_0_0_2px_rgba(245,158,11,0.3)]',
    critical: 'bg-brand-critical shadow-[0_0_0_2px_rgba(239,68,68,0.3)]',
  },
  /** 교정 결과 → dot 색상 매핑 (SSOT: CALIBRATION_RESULT_BADGE와 동일 시멘틱) */
  resultDotMap: {
    pass: 'ok',
    fail: 'critical',
    conditional: 'warn',
  } as Record<string, 'ok' | 'info' | 'warn' | 'critical'>,
  content: [
    'bg-card border border-border rounded-md px-4 py-3',
    'hover:shadow-md',
    TRANSITION_PRESETS.fastShadow,
  ].join(' '),
  date: 'font-mono text-[11px] text-muted-foreground tabular-nums',
  title: 'text-[13px] font-medium text-foreground mt-0.5',
  desc: 'text-xs text-muted-foreground mt-0.5',
} as const;

// ============================================================================
// Equipment KPI Strip Tokens
// ============================================================================

/**
 * 장비 KPI 스트립 카드 스타일
 *
 * 5개 KPI 카드: 다음 교정일, 현재 위치, 반출 이력, 유지보수, 사고 이력
 */
export const EQUIPMENT_KPI_STRIP_TOKENS = {
  /** 비대칭 그리드: Hero(1.6fr) + 4개 Compact — AP-01 Card Soup 해소 */
  container: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr] gap-3 py-4',
  card: {
    base: 'bg-card border border-border rounded-lg p-3 flex items-start gap-3 border-l-4 cursor-pointer dark:bg-card/80',
    /** Hero 카드 (첫 번째 KPI) — 더 넓은 패딩 + elevated shadow */
    hero: 'bg-card border border-border rounded-lg p-4 flex items-start gap-4 border-l-4 cursor-pointer shadow-sm dark:bg-card/80 dark:shadow-md',
    hover: [
      'hover:shadow-md hover:border-border/80 dark:hover:bg-card/90',
      'active:scale-[0.98]',
      TRANSITION_PRESETS.fastShadowBorder,
    ].join(' '),
    focus: FOCUS_TOKENS.classes.brand,
  },
  /** 텍스트 값 (위치, 교정일 등) — AP-03 타이포 드라마: text-xl→text-2xl */
  value: 'text-2xl font-semibold leading-tight font-display',
  /** Hero KPI 값 — 극적 크기 차이 (3:1+ 비율) */
  heroValue: 'text-4xl font-bold tabular-nums leading-none tracking-tight font-mono',
  /** 숫자 카운트 값 — tabular-nums로 정렬, font-mono 없음 (한국어 "건" 혼합 폰트 방지) */
  numericValue: 'text-2xl font-semibold tabular-nums leading-tight',
  label: 'text-xs text-muted-foreground uppercase tracking-wide',
  sub: 'text-[11px] text-muted-foreground/70',
  borderColors: {
    ok: getSemanticLeftBorderClasses('ok'),
    warn: getSemanticLeftBorderClasses('critical'),
    info: getSemanticLeftBorderClasses('info'),
    neutral: 'border-l-border',
  },
  iconBg: {
    ok: getSemanticStatusClasses('ok'),
    warn: getSemanticStatusClasses('critical'),
    info: getSemanticStatusClasses('info'),
    neutral: 'bg-muted text-muted-foreground',
  },
  iconContainer: 'rounded-md p-2 flex-shrink-0',
  /** Hero 아이콘 컨테이너 — 40px (와이어프레임 사양) */
  heroIconContainer: 'rounded-lg p-2.5 flex-shrink-0',
  /** Hero 값 색상 — colorVariant에 따라 동적 적용 */
  valueColors: {
    ok: 'text-brand-ok',
    warn: 'text-brand-critical',
    info: 'text-brand-info',
    neutral: 'text-foreground',
  },
} as const;

export type KpiColorVariant = keyof typeof EQUIPMENT_KPI_STRIP_TOKENS.borderColors;

// ============================================================================
// Equipment Tab Underline Tokens (flat underline 스타일)
// ============================================================================

/**
 * 장비 탭 Flat Underline 스타일
 *
 * 기존 pill 스타일(EQUIPMENT_TAB_TOKENS)과 별도로,
 * 새 flat underline + sticky 탭 바용 스타일.
 */
export const EQUIPMENT_TAB_UNDERLINE_TOKENS = {
  /**
   * 탭 바 컨테이너 (sticky)
   * top: CSS 변수 --sticky-header-height (EquipmentDetailClient ResizeObserver로 동적 설정)
   * bg-background: semantic token (하드코딩 금지)
   */
  container:
    'sticky top-[var(--sticky-header-height,0px)] z-20 bg-background border-b border-border',
  /** 스크롤 가능한 wrapper (모바일) */
  mobileScroll: 'overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0',
  /** TabsList */
  list: 'inline-flex min-w-max bg-transparent',
  /** Trigger base */
  triggerBase: [
    'px-3 min-h-11 text-sm font-medium relative whitespace-nowrap inline-flex items-center gap-1.5',
    TRANSITION_PRESETS.fastColor,
  ].join(' '),
  /** 활성 상태 */
  triggerActive:
    'data-[state=active]:text-foreground data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[3px] data-[state=active]:after:bg-brand-critical data-[state=active]:after:rounded-t-sm',
  /** 비활성 상태 */
  triggerInactive: 'text-muted-foreground hover:text-foreground',
  /** 포커스 */
  triggerFocus: FOCUS_TOKENS.classes.brand,
  /** 구분선 */
  separator: 'mx-1 h-5 w-px bg-border opacity-60 self-center',
  /** 아이콘 크기 */
  iconSize: 'h-4 w-4',
} as const;

// ============================================================================
// Shared Equipment Banner Tokens (공용장비 안내 배너)
// ============================================================================

/**
 * 공용장비 안내 배너 스타일
 *
 * EquipmentDetailClient의 isShared 배너에서 사용.
 * 하드코딩 dark: 클래스를 토큰으로 추출하여 AP-08 개선.
 */
export const SHARED_EQUIPMENT_BANNER_TOKENS = {
  alert: 'border-brand-info/20 bg-brand-info/5 dark:border-brand-info/30 dark:bg-brand-info/10',
  icon: 'h-4 w-4 text-brand-info dark:text-brand-info',
} as const;

// ============================================================================
// Equipment Card Performance Classes
// ============================================================================

/**
 * CSS 성능 최적화 클래스 (content-visibility API)
 *
 * Tailwind arbitrary class로 컴포넌트에 직접 하드코딩하지 말 것.
 * - content-visibility:auto: 뷰포트 밖 카드 렌더링 건너뜀
 * - contain-intrinsic-size: 렌더링 전 레이아웃 공간 예약 (220px = 카드 평균 높이)
 */
export const EQUIPMENT_CARD_PERFORMANCE_CLASSES =
  '[content-visibility:auto] [contain-intrinsic-size:0_220px]' as const;

/**
 * 장비 카드 그리드 레이아웃 토큰
 *
 * 카드 뷰의 그리드 레이아웃 SSOT — 로딩 스켈레톤과 실제 그리드에서 공유.
 */
export const EQUIPMENT_CARD_GRID_TOKENS = {
  grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4',
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
): { className: string; labelKey: string; borderColor: string; statusBarColor: string } {
  // 실시간 교정기한 초과 체크 (백엔드 스케줄러가 아직 실행되지 않은 경우 대비)
  if (status === 'available' && nextCalibrationDate && new Date(nextCalibrationDate) < new Date()) {
    const nonConforming = EQUIPMENT_STATUS_TOKENS.non_conforming;
    return {
      className: nonConforming.card.className,
      labelKey: nonConforming.labelKey,
      borderColor: nonConforming.card.borderColor,
      statusBarColor: nonConforming.card.statusBarColor,
    };
  }

  const token = status ? EQUIPMENT_STATUS_TOKENS[status] : null;
  if (token) {
    return {
      className: token.card.className,
      labelKey: token.labelKey,
      borderColor: token.card.borderColor,
      statusBarColor: token.card.statusBarColor,
    };
  }

  return {
    className: DEFAULT_STATUS_CONFIG.card.className,
    labelKey: status ? `equipment.status.${status}` : DEFAULT_STATUS_CONFIG.labelKey,
    borderColor: DEFAULT_STATUS_CONFIG.card.borderColor,
    statusBarColor: DEFAULT_STATUS_CONFIG.card.statusBarColor,
  };
}
