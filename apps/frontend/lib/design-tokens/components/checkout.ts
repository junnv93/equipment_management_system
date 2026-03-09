/**
 * Checkout Component Tokens (Layer 3: Component-Specific)
 *
 * 반출입 관리 컴포넌트의 모든 디자인 값을 정의하는 SSOT
 * - 13개 checkout 상태 + 7개 rental import 상태 스타일 (brand 시멘틱 토큰)
 * - 반출 유형별 색상 바 + 행 강조 토큰
 * - 미니 프로그레스 토큰 (상태 흐름 시각화)
 * - Stepper node/connector/label 스타일 (모바일/데스크톱)
 * - Stats card variants (total/pending/overdue/inProgress)
 *
 * CRITICAL: CheckoutStatusBadge.tsx 상수 통합, 하드코딩 제거
 */

import { FOCUS_TOKENS } from '../semantic';
import { getTransitionClasses } from '../motion';

// ============================================================================
// 1. Checkout Status Badge Tokens (13개 상태 스타일 — brand 시멘틱 토큰)
// ============================================================================

/**
 * Checkout 상태 → 스타일 매핑 (brand CSS 변수 기반)
 *
 * brand 변수는 .dark에서 자동 전환 → dark: prefix 불필요
 * SSOT: CheckoutStatusBadge.tsx의 CHECKOUT_STATUS_STYLES 이전
 */
export const CHECKOUT_STATUS_BADGE_TOKENS = {
  // 대기 (warning)
  pending: 'bg-brand-warning/10 text-brand-warning border-brand-warning/20',
  // 승인 (info)
  approved: 'bg-brand-info/10 text-brand-info border-brand-info/20',
  // 반출중 (purple)
  checked_out: 'bg-brand-purple/10 text-brand-purple border-brand-purple/20',
  // 렌탈 4단계 (purple 계열)
  lender_checked: 'bg-brand-purple/8 text-brand-purple border-brand-purple/15',
  borrower_received: 'bg-brand-purple/12 text-brand-purple border-brand-purple/20',
  // 사용 중 (info)
  in_use: 'bg-brand-info/10 text-brand-info border-brand-info/20',
  // 반환 진행 (purple 계열)
  borrower_returned: 'bg-brand-purple/12 text-brand-purple border-brand-purple/20',
  lender_received: 'bg-brand-purple/8 text-brand-purple border-brand-purple/15',
  // 완료 (ok)
  returned: 'bg-brand-ok/10 text-brand-ok border-brand-ok/20',
  return_approved: 'bg-brand-ok/15 text-brand-ok border-brand-ok/25',
  // 거절 (critical)
  rejected: 'bg-brand-critical/10 text-brand-critical border-brand-critical/20',
  // 기한 초과 (critical 강조)
  overdue: 'bg-brand-critical/15 text-brand-critical border-brand-critical/30',
  // 취소 (neutral)
  canceled: 'bg-brand-neutral/10 text-brand-neutral border-brand-neutral/20',
} as const;

/**
 * Rental import 상태 → 스타일 매핑 (brand CSS 변수 기반)
 *
 * SSOT: CheckoutStatusBadge.tsx의 RENTAL_STATUS_STYLES 이전
 */
export const RENTAL_IMPORT_STATUS_BADGE_TOKENS = {
  // 대기 (warning)
  pending: 'bg-brand-warning/10 text-brand-warning border-brand-warning/20',
  // 승인 (info)
  approved: 'bg-brand-info/10 text-brand-info border-brand-info/20',
  // 거절 (critical)
  rejected: 'bg-brand-critical/10 text-brand-critical border-brand-critical/20',
  // 수령 완료 (ok)
  received: 'bg-brand-ok/10 text-brand-ok border-brand-ok/20',
  // 반납 진행 중 (repair/warning)
  return_requested: 'bg-brand-repair/10 text-brand-repair border-brand-repair/20',
  // 반납 완료 (ok 강조)
  returned: 'bg-brand-ok/15 text-brand-ok border-brand-ok/25',
  // 취소 (neutral)
  canceled: 'bg-brand-neutral/10 text-brand-neutral border-brand-neutral/20',
} as const;

/**
 * 기본 배지 스타일 (알 수 없는 상태)
 */
export const DEFAULT_CHECKOUT_BADGE =
  'bg-brand-neutral/10 text-brand-neutral border-brand-neutral/20';

// ============================================================================
// 2. Checkout Purpose Tokens (반출 유형별 배지 + 색상 바)
// ============================================================================

/**
 * 반출 목적(purpose)별 배지 스타일 + 색상 바 클래스
 *
 * SSOT: CHECKOUT_PURPOSE_STYLES(shared-constants) 대체
 * CHECKOUT_PURPOSE_STYLES는 @deprecated → 이 토큰 사용
 */
export const CHECKOUT_PURPOSE_TOKENS = {
  calibration: {
    badge: 'bg-brand-info/10 text-brand-info border-brand-info/20',
    colorBar: 'border-l-brand-info',
  },
  repair: {
    badge: 'bg-brand-repair/10 text-brand-repair border-brand-repair/20',
    colorBar: 'border-l-brand-repair',
  },
  rental: {
    badge: 'bg-brand-purple/10 text-brand-purple border-brand-purple/20',
    colorBar: 'border-l-brand-purple',
  },
  return_to_vendor: {
    badge: 'bg-brand-neutral/10 text-brand-neutral border-brand-neutral/20',
    colorBar: 'border-l-brand-neutral',
  },
} as const;

export type CheckoutPurposeKey = keyof typeof CHECKOUT_PURPOSE_TOKENS;

// ============================================================================
// 3. Checkout Row Tokens (행 색상 바 + overdue 강조)
// ============================================================================

/**
 * 반출 그룹 카드 테이블 행 스타일 토큰
 *
 * - colorBar: 좌측 4px 세로 색상 바 (반출 유형별)
 * - overdue: overdue 상태 행 배경/테두리 강조
 */
export const CHECKOUT_ROW_TOKENS = {
  colorBar: {
    base: 'border-l-4',
    calibration: 'border-l-brand-info',
    repair: 'border-l-brand-repair',
    rental: 'border-l-brand-purple',
    return_to_vendor: 'border-l-brand-neutral',
  },
  overdue: {
    background: 'bg-brand-critical/8',
    border: 'border border-brand-critical/30',
  },
} as const;

/**
 * 반출 행 클래스 조합
 *
 * @param purpose - 반출 목적 (calibration/repair/rental/return_to_vendor)
 * @param status  - 반출 상태 (overdue 여부 판단)
 * @returns 행에 적용할 Tailwind 클래스 문자열
 */
export function getCheckoutRowClasses(purpose: string, status: string): string {
  const colorBarKey = purpose as keyof typeof CHECKOUT_ROW_TOKENS.colorBar;
  const colorBar =
    CHECKOUT_ROW_TOKENS.colorBar[colorBarKey] ?? CHECKOUT_ROW_TOKENS.colorBar.calibration;

  if (status === 'overdue') {
    return [
      CHECKOUT_ROW_TOKENS.colorBar.base,
      colorBar,
      CHECKOUT_ROW_TOKENS.overdue.background,
      CHECKOUT_ROW_TOKENS.overdue.border,
    ].join(' ');
  }

  return `${CHECKOUT_ROW_TOKENS.colorBar.base} ${colorBar}`;
}

// ============================================================================
// 4. Checkout Mini Progress Tokens (상태 흐름 시각화)
// ============================================================================

/**
 * 미니 프로그레스 도트/커넥터 토큰
 *
 * 4개 점(completed/current/future) + 3개 커넥터로 반출 진행 상태를 표현
 */
export const CHECKOUT_MINI_PROGRESS = {
  dot: {
    size: 'w-2 h-2',
    completed: 'bg-brand-ok',
    current: 'border-2 border-brand-info bg-transparent',
    future: 'bg-brand-neutral/30',
  },
  connector: {
    base: 'h-px w-2',
    completed: 'bg-brand-ok',
    pending: 'bg-brand-neutral/30',
  },
  special: {
    overdue: 'text-brand-critical',
    rejected: 'text-brand-critical',
    canceled: 'text-brand-neutral',
  },
} as const;

/**
 * 반출 유형별 단계 배열 (SSOT)
 *
 * 각 단계의 순서가 CheckoutMiniProgress 컴포넌트의 표시 순서를 결정합니다.
 */
export const MINI_PROGRESS_STEPS = {
  calibration: ['pending', 'approved', 'checked_out', 'returned'] as const,
  repair: ['pending', 'approved', 'checked_out', 'returned'] as const,
  rental: ['pending', 'approved', 'checked_out', 'returned'] as const,
} as const;

/**
 * 미니 프로그레스에서 특수 표시가 필요한 상태
 */
export const MINI_PROGRESS_SPECIAL_STATUSES = ['overdue', 'rejected', 'canceled'] as const;

// ============================================================================
// 5. Checkout Stepper Tokens (진행 표시기 — 상세 페이지용)
// ============================================================================

/**
 * Stepper 노드 크기 (모바일/데스크톱)
 *
 * 모바일: 32px (h-8 w-8)
 * 데스크톱: 40px (h-10 w-10)
 */
export const CHECKOUT_STEPPER_TOKENS = {
  node: {
    mobile: 'w-8 h-8',
    desktop: 'w-10 h-10',
  },

  /** 노드 상태별 스타일 (completed/current/pending) */
  status: {
    completed: {
      node: 'bg-brand-ok/15',
      icon: 'text-brand-ok',
      label: 'text-brand-ok',
    },
    current: {
      node: 'bg-brand-info/15 ring-2 ring-brand-info ring-offset-2',
      icon: 'text-brand-info fill-brand-info',
      label: 'font-medium text-brand-info',
    },
    pending: {
      node: 'bg-brand-neutral/10',
      icon: 'text-brand-neutral/50',
      label: 'text-brand-text-muted',
    },
  },

  /** 특수 상태 (rejected/canceled/overdue) */
  special: {
    rejected: {
      container: 'bg-brand-critical/10',
      icon: 'text-brand-critical',
      label: 'text-brand-critical',
    },
    canceled: {
      container: 'bg-brand-neutral/10',
      icon: 'text-brand-neutral',
      label: 'text-brand-text-muted',
    },
    overdue: {
      container: 'bg-brand-warning/10',
      icon: 'text-brand-warning',
      label: 'text-brand-warning',
    },
  },

  /** 연결선 */
  connector: {
    completed: 'bg-brand-ok',
    pending: 'bg-brand-neutral/20',
  },

  /** 라벨 크기 */
  label: {
    mobile: 'text-sm',
    desktop: 'text-xs',
  },

  /** 아이콘 크기 */
  icon: {
    mobile: 'h-5 w-5',
    desktop: 'h-6 w-6',
    special: 'h-8 w-8',
  },
} as const;

// ============================================================================
// 6. Checkout Stats Variants (통계 카드 4종 — brand 토큰)
// ============================================================================

/**
 * Checkout 통계 카드 variant별 색상 (brand 시멘틱 토큰)
 */
export const CHECKOUT_STATS_VARIANTS = {
  total: {
    hoverBorder: 'hover:border-brand-info/30',
    activeBorder: 'border-brand-info',
    activeBg: 'bg-brand-info/10',
    iconColor: 'text-brand-info',
  },
  pending: {
    hoverBorder: 'hover:border-brand-warning/30',
    activeBorder: 'border-brand-warning',
    activeBg: 'bg-brand-warning/10',
    iconColor: 'text-brand-warning',
  },
  overdue: {
    hoverBorder: 'hover:border-brand-critical/30',
    activeBorder: 'border-brand-critical',
    activeBg: 'bg-brand-critical/10',
    iconColor: 'text-brand-critical',
  },
  inProgress: {
    hoverBorder: 'hover:border-brand-purple/30',
    activeBorder: 'border-brand-purple',
    activeBg: 'bg-brand-purple/10',
    iconColor: 'text-brand-purple',
  },
} as const;

export type CheckoutStatsVariant = keyof typeof CHECKOUT_STATS_VARIANTS;

/**
 * 통계 카드 클래스 가져오기
 */
export function getCheckoutStatsClasses(
  variant: CheckoutStatsVariant = 'total',
  isActive: boolean = false
): string {
  const config = CHECKOUT_STATS_VARIANTS[variant];
  const baseClasses = 'cursor-pointer border-2';

  if (isActive) {
    return [baseClasses, config.activeBorder, config.activeBg].join(' ');
  }

  return [baseClasses, 'border-transparent', config.hoverBorder].join(' ');
}

// ============================================================================
// 7. Checkout Motion (애니메이션)
// ============================================================================

/**
 * Checkout 컴포넌트 모션 토큰
 *
 * Web Interface Guidelines 준수: specific property transitions, no transition-all
 */
export const CHECKOUT_MOTION = {
  /** 통계 카드: hover 시 border + bg 전환 */
  statsCard: getTransitionClasses('fast', ['border-color', 'background-color']),

  /** 테이블 row hover: 배경색만 전환 */
  rowHover: getTransitionClasses('instant', ['background-color']),

  /** 아이템 hover: 배경색 + 스케일 */
  itemHover: getTransitionClasses('fast', ['background-color', 'transform']),

  /** Chevron 회전 */
  chevronRotate: getTransitionClasses('fast', ['transform']),

  /** Selectable row: 배경색 + 불투명도 + border */
  selectableRow: getTransitionClasses('fast', ['background-color', 'opacity', 'border-color']),
} as const;

// ============================================================================
// 8. Checkout Interaction Tokens (상호작용 요소)
// ============================================================================

/**
 * Checkout 상호작용 토큰
 */
export const CHECKOUT_INTERACTION_TOKENS = {
  /** Group card trigger: hover + instant bg transition */
  groupCardTrigger: [
    'hover:bg-muted/50',
    getTransitionClasses('instant', ['background-color']),
  ].join(' '),

  /** Clickable row: cursor + hover + transition */
  clickableRow: [
    'cursor-pointer',
    'hover:bg-muted/50',
    getTransitionClasses('instant', ['background-color']),
  ].join(' '),

  /** Row focus (focus-visible) */
  rowFocus: FOCUS_TOKENS.classes.default,

  /** Equipment item: border + rounded + hover + transition */
  equipmentItem: [
    'border',
    'rounded-md',
    'hover:bg-muted/50',
    getTransitionClasses('fast', ['background-color']),
  ].join(' '),
} as const;

// ============================================================================
// 9. Checkout Detail Tokens (상세 페이지)
// ============================================================================

/**
 * Checkout 상세 페이지 토큰
 */
export const CHECKOUT_DETAIL_TOKENS = {
  /** 담당자 카드 */
  personCard: 'bg-muted/50 dark:bg-muted/30',

  /** 담당자 아이콘 컨테이너 */
  personIconContainer: 'bg-ul-midnight/10 dark:bg-ul-info/20',

  /** 이상 내용 영역 */
  abnormalContent: 'bg-brand-critical/5',

  /** 승인 버튼 */
  approveButton: 'bg-brand-ok hover:bg-brand-ok/90 text-white',

  /** 거절 카드 */
  rejectionCard: 'border-brand-critical/30',

  /** 거절 제목 */
  rejectionTitle: 'text-brand-critical',
} as const;

// ============================================================================
// 10. Condition Comparison Tokens (조건 비교)
// ============================================================================

// (아래에 신규 토큰들 추가됨 — Section 12~17)

/**
 * 장비 상태 비교 토큰 (반입 시 상태 비교)
 */
export const CONDITION_COMPARISON_TOKENS = {
  /** 악화 (빨강) */
  worsened: 'bg-brand-critical/5',

  /** 변경 (노랑) */
  changed: 'bg-brand-warning/5',

  /** 이상 내용 영역 */
  abnormalDetail: 'bg-brand-critical/5 border-l-4 border-brand-critical',

  /** 이상 내용 제목 */
  abnormalTitle: 'text-brand-critical',

  /** 이상 내용 텍스트 */
  abnormalText: 'text-brand-critical',
} as const;

// ============================================================================
// 11. Checkout Form Tokens (생성/수정 폼)
// ============================================================================

/**
 * Checkout 폼 토큰
 */
export const CHECKOUT_FORM_TOKENS = {
  /** Selectable row */
  selectableRow: {
    /** Base: transition-all 대신 specific properties */
    base: getTransitionClasses('fast', ['background-color', 'opacity', 'border-color']),

    /** Selected */
    selected: 'bg-brand-info/8 border-brand-info/30',

    /** Hoverable (selected 아닐 때) */
    hoverable: [
      'hover:bg-muted/50',
      'cursor-pointer',
      getTransitionClasses('fast', ['background-color']),
      FOCUS_TOKENS.classes.default,
    ].join(' '),

    /** Disabled */
    disabled: 'opacity-50 cursor-not-allowed',
  },

  /** 이상 내용 textarea (focus → focus-visible) */
  abnormalTextarea: 'focus-visible:border-brand-critical/60 focus-visible:ring-brand-critical/40',
} as const;

// ============================================================================
// 12. Checkout Stats (5-card variant 확장)
// ============================================================================

// CHECKOUT_STATS_VARIANTS에 반출중(checkedOut) / 반입완료(returned) 추가
// 기존 CHECKOUT_STATS_VARIANTS는 불변(const), 여기서 새 variant만 별도 정의

/**
 * 반출중 카드 variant (반출 승인됨 + 진행중 상태 합산)
 */
export const CHECKOUT_STATS_CHECKED_OUT = {
  hoverBorder: 'hover:border-brand-purple/30',
  activeBorder: 'border-brand-purple',
  activeBg: 'bg-brand-purple/10',
  iconColor: 'text-brand-purple',
} as const;

/**
 * 반입완료 카드 variant
 */
export const CHECKOUT_STATS_RETURNED = {
  hoverBorder: 'hover:border-brand-ok/30',
  activeBorder: 'border-brand-ok',
  activeBg: 'bg-brand-ok/10',
  iconColor: 'text-brand-ok',
} as const;

// ============================================================================
// 13. D-day Badge Tokens
// ============================================================================

/**
 * D-day 배지 스타일 (반입 예정일 기준)
 *
 * - ok: D-4 이상 (여유 있음)
 * - warn: D-0 ~ D-3 (주의)
 * - danger: D+ (기한 초과)
 */
export const CHECKOUT_DDAY_TOKENS = {
  ok: 'bg-brand-ok/15 text-brand-ok',
  warn: 'bg-brand-warning/15 text-brand-warning',
  danger: 'bg-brand-critical/15 text-brand-critical font-semibold',
} as const;

export type DdayVariant = keyof typeof CHECKOUT_DDAY_TOKENS;

/**
 * D-day 클래스 결정
 *
 * @param daysRemaining - 오늘 기준 남은 일수 (음수 = 초과)
 */
export function getDdayClasses(daysRemaining: number): string {
  if (daysRemaining < 0) return CHECKOUT_DDAY_TOKENS.danger;
  if (daysRemaining <= 3) return CHECKOUT_DDAY_TOKENS.warn;
  return CHECKOUT_DDAY_TOKENS.ok;
}

/**
 * D-day 텍스트 생성
 *
 * @param daysRemaining - 오늘 기준 남은 일수
 */
export function formatDday(daysRemaining: number): string {
  if (daysRemaining < 0) return `D+${Math.abs(daysRemaining)}`;
  if (daysRemaining === 0) return 'D-day';
  return `D-${daysRemaining}`;
}

// ============================================================================
// 14. Alert Banner Tokens (Alert-First 패턴)
// ============================================================================

/**
 * 기한 초과 / 반입 검사 대기 알림 배너 토큰
 *
 * Alert-First: 중요 상태는 페이지 최상단에 배너로 표시
 */
export const CHECKOUT_ALERT_TOKENS = {
  overdue: {
    container:
      'flex items-center gap-3 bg-brand-critical/5 border border-brand-critical/20 rounded-lg px-4 py-3',
    icon: 'text-brand-critical shrink-0 h-4 w-4',
    text: 'flex-1 text-sm text-brand-critical',
    action:
      'text-xs font-semibold text-brand-critical underline whitespace-nowrap cursor-pointer hover:text-brand-critical/70',
    close:
      'text-brand-critical/40 hover:text-brand-critical/70 cursor-pointer shrink-0 h-3.5 w-3.5',
  },
  pendingCheck: {
    container:
      'flex items-center gap-3 bg-brand-warning/5 border border-brand-warning/20 rounded-lg px-4 py-3',
    icon: 'text-brand-warning shrink-0 h-4 w-4',
    text: 'flex-1 text-sm text-brand-warning',
    action:
      'text-xs font-semibold bg-brand-warning text-white rounded px-3 py-1 cursor-pointer whitespace-nowrap hover:bg-brand-warning/90 shrink-0',
  },
} as const;

// ============================================================================
// 15. Overdue Group Card Tokens
// ============================================================================

/**
 * 기한 초과 그룹 카드 강조 토큰 (최상단 고정 + 특별 스타일)
 */
export const CHECKOUT_OVERDUE_GROUP_TOKENS = {
  card: 'border-brand-critical/30',
  header: 'bg-brand-critical/5',
  headerText: 'text-brand-critical font-semibold',
  count: 'bg-brand-critical/10 text-brand-critical border border-brand-critical/20',
} as const;

// ============================================================================
// 16. Purpose Legend Bar Tokens
// ============================================================================

/**
 * 반출 목적 색상 범례 토큰
 *
 * 필터 바 하단에 교정/수리/대여 색상 범례를 표시
 */
export const CHECKOUT_PURPOSE_LEGEND_TOKENS = {
  container: 'flex items-center gap-3 px-3 py-1.5 bg-muted/30 border border-border/50 rounded-lg',
  label: 'text-[10px] text-muted-foreground font-medium uppercase tracking-wide',
  item: 'flex items-center gap-1.5 text-xs text-foreground/70',
  dot: {
    calibration: 'w-2.5 h-2.5 rounded-[2px] bg-brand-info shrink-0',
    repair: 'w-2.5 h-2.5 rounded-[2px] bg-brand-repair shrink-0',
    rental: 'w-2.5 h-2.5 rounded-[2px] bg-brand-purple shrink-0',
  },
} as const;

// ============================================================================
// 17. Checkout Item Row Tokens (그룹 카드 내 개별 행)
// ============================================================================

/**
 * 반출 그룹 카드 내 장비 아이템 행 토큰
 *
 * 기존 Table → 개별 행(Row) 기반으로 재설계
 * 각 행: [목적 색상 바] [장비 정보] [메타] [진행 상태] [배지] [액션]
 */
export const CHECKOUT_ITEM_ROW_TOKENS = {
  /** 행 컨테이너 */
  container: [
    'flex items-center gap-3 px-3 py-2.5',
    'border-b border-border/40 last:border-0',
    'cursor-pointer',
    getTransitionClasses('instant', ['background-color']),
    'hover:bg-muted/40',
  ].join(' '),

  /** 기한 초과 행 배경 */
  containerOverdue: 'bg-brand-critical/5 hover:bg-brand-critical/8',

  /** 목적별 3px 세로 색상 바 */
  purposeBar: {
    base: 'w-[3px] self-stretch rounded-full shrink-0',
    calibration: 'bg-brand-info',
    repair: 'bg-brand-repair',
    rental: 'bg-brand-purple',
    default: 'bg-brand-neutral/50',
  },

  /** 장비 정보 블록 */
  infoBlock: 'flex-1 min-w-0',
  nameRow: 'flex items-center gap-1.5 flex-wrap',
  name: 'text-sm font-semibold text-foreground truncate',
  mgmt: 'text-xs text-muted-foreground font-mono shrink-0',
  dday: 'text-[10px] px-1.5 py-0.5 rounded font-medium tabular-nums shrink-0',
  meta: 'text-xs text-muted-foreground mt-0.5 truncate',

  /** 우측 액션 영역 */
  actionsArea: 'flex items-center gap-1.5 shrink-0',
} as const;
