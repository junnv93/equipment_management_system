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

import {
  ELEVATION_TOKENS,
  FOCUS_TOKENS,
  MICRO_TYPO,
  SPACING_RHYTHM_TOKENS,
  TYPOGRAPHY_TOKENS,
  DIMENSION_TOKENS,
} from '../semantic';
import { TRANSITION_PRESETS } from '../motion';
import {
  getSemanticSolidBgClasses,
  getSemanticLeftBorderClasses,
  getSemanticContainerTextClasses,
} from '../brand';
import { PAGE_HEADER_TOKENS, SUB_PAGE_HEADER_TOKENS } from './page-layout';
import { CheckoutStatusValues } from '@equipment-management/schemas';

// ============================================================================
// 0. Checkout Header Tokens (페이지 헤더 SSOT)
// ============================================================================

/** 리스트 페이지 헤더 (반출 관리, 대기 점검) */
export const CHECKOUT_HEADER_TOKENS = {
  ...PAGE_HEADER_TOKENS,
} as const;

/** 서브 페이지 헤더 (반출 생성, 반출 상세, 반입, 상태점검) */
export const CHECKOUT_SUB_HEADER_TOKENS = {
  ...SUB_PAGE_HEADER_TOKENS,
} as const;

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
  lender_checked: 'bg-brand-purple/10 text-brand-purple border-brand-purple/15',
  borrower_received: 'bg-brand-purple/10 text-brand-purple border-brand-purple/20',
  // 사용 중 (info)
  in_use: 'bg-brand-info/10 text-brand-info border-brand-info/20',
  // 반환 진행 (purple 계열)
  borrower_returned: 'bg-brand-purple/10 text-brand-purple border-brand-purple/20',
  lender_received: 'bg-brand-purple/10 text-brand-purple border-brand-purple/15',
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
    colorBar: getSemanticLeftBorderClasses('info'),
  },
  repair: {
    badge: 'bg-brand-repair/10 text-brand-repair border-brand-repair/20',
    colorBar: getSemanticLeftBorderClasses('repair'),
  },
  rental: {
    badge: 'bg-brand-purple/10 text-brand-purple border-brand-purple/20',
    colorBar: getSemanticLeftBorderClasses('purple'),
  },
  return_to_vendor: {
    badge: 'bg-brand-neutral/10 text-brand-neutral border-brand-neutral/20',
    colorBar: getSemanticLeftBorderClasses('neutral'),
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
    calibration: getSemanticLeftBorderClasses('info'),
    repair: getSemanticLeftBorderClasses('repair'),
    rental: getSemanticLeftBorderClasses('purple'),
    return_to_vendor: getSemanticLeftBorderClasses('neutral'),
  },
  overdue: {
    background: 'bg-brand-critical/8',
    border: 'border border-brand-critical/30',
  },
  hover: {
    normal: `hover:bg-muted/30 ${TRANSITION_PRESETS.instantBg}`,
    pending: `hover:bg-brand-warning/5 ${TRANSITION_PRESETS.instantBg}`,
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

  if (status === CheckoutStatusValues.OVERDUE) {
    return [
      CHECKOUT_ROW_TOKENS.colorBar.base,
      colorBar,
      CHECKOUT_ROW_TOKENS.overdue.background,
      CHECKOUT_ROW_TOKENS.overdue.border,
    ].join(' ');
  }

  if (status === CheckoutStatusValues.PENDING) {
    return [CHECKOUT_ROW_TOKENS.colorBar.base, colorBar, CHECKOUT_ROW_TOKENS.hover.pending].join(
      ' '
    );
  }

  return [CHECKOUT_ROW_TOKENS.colorBar.base, colorBar, CHECKOUT_ROW_TOKENS.hover.normal].join(' ');
}

// ============================================================================
// 3-C. Checkout Step Labels SSOT (단계명 i18n 키 매핑)
// ============================================================================

/**
 * 반출 상태 → stepper i18n 키 매핑 (SSOT)
 *
 * CheckoutStatusStepper / CheckoutMiniProgress / RentalFlowInline 3곳에서 공용 참조.
 * 값은 `checkouts.stepper.<value>` 네임스페이스에서 useTranslations으로 해석.
 *
 * 로컬 STEPPER_LABEL_MAP 재정의 금지 — 이 상수가 유일한 진실의 소스.
 */
export const CHECKOUT_STEP_LABELS: Readonly<Record<string, string>> = {
  pending: 'pendingApproval',
  approved: 'approved',
  checked_out: 'checkedOut',
  returned: 'returned',
  return_approved: 'returnApproved',
  lender_checked: 'lenderCheckout',
  borrower_received: 'borrowerReceive',
  borrower_returned: 'borrowerReturn',
  lender_received: 'lenderReturn',
  overdue: 'checkedOut',
  in_use: 'inUse',
  rejected: 'rejected',
  canceled: 'canceled',
} as const;

// ============================================================================
// 4. Checkout Mini Progress Tokens (상태 흐름 시각화)
// ============================================================================

/**
 * 미니 프로그레스 도트/커넥터 토큰
 *
 * 18px 원(✓/!/숫자) + 커넥터로 반출 진행 상태를 표현
 *
 * 설계 원칙:
 * - 원 0번(index 0)은 "신청됨"으로 항상 완료 표시 (visible checkout = 신청 완료)
 * - statusToStepIndex: 각 status가 현재 진행 중인 단계의 인덱스를 가리킴
 * - stepCount: 반출 유형별 전체 원 개수
 */
export const CHECKOUT_MINI_PROGRESS = {
  dot: {
    /** 18px 원 공통 — ✓/!/숫자는 aria-hidden 처리 (78-3에서 sr-only 이동) */
    base: `${DIMENSION_TOKENS.stepDot} rounded-full flex items-center justify-center font-bold shrink-0`,
    completed: getSemanticSolidBgClasses('ok'),
    current: getSemanticSolidBgClasses('info'),
    late: getSemanticSolidBgClasses('critical'),
    future: 'border-2 border-border text-muted-foreground bg-background',
  },
  connector: {
    base: 'h-0.5 w-2.5 shrink-0',
    completed: 'bg-brand-ok',
    pending: 'bg-border',
  },
  /** rejected/canceled: 진행 바 대신 아이콘만 표시 */
  special: {
    rejected: getSemanticContainerTextClasses('critical'),
    canceled: getSemanticContainerTextClasses('neutral'),
  },
  /**
   * 상태 → 표시 단계 인덱스 매핑 (SSOT)
   * 원 0번이 "신청됨(항상 완료)"이므로 real status는 index 1부터 시작
   */
  statusToStepIndex: {
    pending: 1,
    approved: 1,
    checked_out: 2,
    overdue: 2, // checked_out 위치 + late(빨강) 스타일
    in_use: 2,
    returned: 3,
    // rental 4-step flow
    lender_checked: 1,
    borrower_received: 2,
    borrower_returned: 3,
    lender_received: 4,
  } as Partial<Record<string, number>>,
  /** 반출 유형별 원 개수 */
  stepCount: {
    calibration: 4,
    repair: 4,
    rental: 5,
  } as Record<string, number>,
} as const;

// ============================================================================
// 3-B. Rental Flow Inline Tokens (그룹 헤더 내 렌탈 단계 표시)
// ============================================================================

/**
 * 렌탈 그룹 카드 헤더의 인라인 4단계 흐름 표시
 *
 * @deprecated 78-3에서 칩+tooltip 패턴으로 전체 교체 예정.
 *   circle/arrow/stepLabel 프로퍼티도 개별 deprecated.
 *   소비처: CheckoutGroupCard.tsx RentalFlowInline 컴포넌트.
 *
 * 와이어프레임 [개선 8]: 렌탈 그룹 헤더에 대여 4단계 현황 인라인 표시
 * 5개 원: lender_checked→borrower_received→borrower_returned→lender_received→완료
 */
export const RENTAL_FLOW_INLINE_TOKENS = {
  /** 칩 외부 컨테이너 — 모바일 표시 허용 (hidden sm:flex 제거) */
  chip: 'inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-purple/5 border border-brand-purple/20 rounded-md text-xs text-brand-purple font-medium',
  /** 칩 내 구분자 */
  chipSeparator: 'text-brand-purple/30',
  /** Tooltip 목록 항목 */
  tooltipStep: 'flex items-center gap-1.5 text-xs',
  tooltipStepDone: 'text-brand-ok',
  tooltipStepCurrent: 'text-brand-purple font-semibold',
  tooltipStepFuture: 'text-muted-foreground',
  /**
   * 렌탈 상태 → 0-based 인라인 단계 인덱스 (5단계 기준)
   * SSOT: CheckoutGroupCard에서 직접 매핑 상수 정의 금지
   */
  statusToStep: {
    approved: 0,
    lender_checked: 0,
    borrower_received: 1,
    borrower_returned: 2,
    lender_received: 3,
  } as Partial<Record<string, number>>,
} as const;

/**
 * @deprecated CHECKOUT_MINI_PROGRESS.statusToStepIndex + .stepCount 사용
 * CheckoutMiniProgress가 statusToStepIndex 기반으로 전환됨 (v2 리디자인)
 */
export const MINI_PROGRESS_STEPS = {
  calibration: ['pending', 'approved', 'checked_out', 'returned'] as const,
  repair: ['pending', 'approved', 'checked_out', 'returned'] as const,
  rental: ['pending', 'approved', 'checked_out', 'returned'] as const,
} as const;

/**
 * 미니 프로그레스에서 진행 바 대신 아이콘만 표시하는 상태
 * overdue는 checked_out 위치에 late(빨강 !) 스타일로 표시됨
 */
export const MINI_PROGRESS_SPECIAL_STATUSES = ['rejected', 'canceled'] as const;

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

  /** 노드 상태별 스타일 (completed/current/pending/next) */
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
    /** 다음 단계 미리보기 — FSM descriptor.currentStepIndex+1 */
    next: {
      node: 'bg-brand-info/5 ring-1 ring-dashed ring-brand-info/50',
      icon: 'text-brand-info/70',
      label: 'text-brand-info/90 font-medium',
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
 *
 * valueTypography: 숫자 값 표시 타이포그래피 (TYPOGRAPHY_TOKENS 기반)
 * elevation: 카드 배경 깊이 (ELEVATION_TOKENS.surface 기반)
 */
export const CHECKOUT_STATS_VARIANTS = {
  total: {
    hoverBorder: 'hover:border-brand-info/30',
    activeBorder: 'border-brand-info',
    activeBg: 'bg-brand-info/10',
    iconColor: 'text-brand-info',
    alertRing: '',
    elevation: ELEVATION_TOKENS.surface.raised,
    valueTypography: `${TYPOGRAPHY_TOKENS.heading.h2} tabular-nums`,
    headerPadding: `flex flex-row items-center justify-between pb-1.5 pt-3 ${SPACING_RHYTHM_TOKENS.tight.paddingX}`,
    contentPadding: `${SPACING_RHYTHM_TOKENS.tight.paddingX} pb-3`,
  },
  pending: {
    hoverBorder: 'hover:border-brand-warning/30',
    activeBorder: 'border-brand-warning',
    activeBg: 'bg-brand-warning/10',
    iconColor: 'text-brand-warning',
    alertRing: 'ring-1 ring-brand-warning/20',
    elevation: ELEVATION_TOKENS.surface.raised,
    valueTypography: `${TYPOGRAPHY_TOKENS.heading.h2} tabular-nums`,
    headerPadding: `flex flex-row items-center justify-between pb-1.5 pt-3 ${SPACING_RHYTHM_TOKENS.tight.paddingX}`,
    contentPadding: `${SPACING_RHYTHM_TOKENS.tight.paddingX} pb-3`,
  },
  overdue: {
    hoverBorder: 'hover:border-brand-critical/30',
    activeBorder: 'border-brand-critical',
    activeBg: 'bg-brand-critical/10',
    iconColor: 'text-brand-critical',
    alertRing: `ring-2 ring-brand-critical/30 ${ELEVATION_TOKENS.shadow.medium}`,
    elevation: ELEVATION_TOKENS.surface.raised,
    valueTypography: `${TYPOGRAPHY_TOKENS.heading.h2} tabular-nums`,
    headerPadding: `flex flex-row items-center justify-between pb-1.5 pt-3 ${SPACING_RHYTHM_TOKENS.tight.paddingX}`,
    contentPadding: `${SPACING_RHYTHM_TOKENS.tight.paddingX} pb-3`,
  },
  /** @deprecated checkedOut과 동일 — checkedOut 사용 권장 */
  inProgress: {
    hoverBorder: 'hover:border-brand-purple/30',
    activeBorder: 'border-brand-purple',
    activeBg: 'bg-brand-purple/10',
    iconColor: 'text-brand-purple',
    alertRing: '',
    elevation: ELEVATION_TOKENS.surface.raised,
    valueTypography: `${TYPOGRAPHY_TOKENS.heading.h2} tabular-nums`,
    headerPadding: `flex flex-row items-center justify-between pb-1.5 pt-3 ${SPACING_RHYTHM_TOKENS.tight.paddingX}`,
    contentPadding: `${SPACING_RHYTHM_TOKENS.tight.paddingX} pb-3`,
  },
  checkedOut: {
    hoverBorder: 'hover:border-brand-purple/30',
    activeBorder: 'border-brand-purple',
    activeBg: 'bg-brand-purple/10',
    iconColor: 'text-brand-purple',
    alertRing: '',
    elevation: ELEVATION_TOKENS.surface.raised,
    valueTypography: `${TYPOGRAPHY_TOKENS.heading.h2} tabular-nums`,
    headerPadding: `flex flex-row items-center justify-between pb-1.5 pt-3 ${SPACING_RHYTHM_TOKENS.tight.paddingX}`,
    contentPadding: `${SPACING_RHYTHM_TOKENS.tight.paddingX} pb-3`,
  },
  returned: {
    hoverBorder: 'hover:border-brand-ok/30',
    activeBorder: 'border-brand-ok',
    activeBg: 'bg-brand-ok/10',
    iconColor: 'text-brand-ok',
    alertRing: '',
    elevation: ELEVATION_TOKENS.surface.raised,
    valueTypography: `${TYPOGRAPHY_TOKENS.heading.h2} tabular-nums`,
    headerPadding: `flex flex-row items-center justify-between pb-1.5 pt-3 ${SPACING_RHYTHM_TOKENS.tight.paddingX}`,
    contentPadding: `${SPACING_RHYTHM_TOKENS.tight.paddingX} pb-3`,
  },
  /**
   * Hero KPI 카드 — 페이지당 1개, overdue>0 시 동적 선택 (PR-7 grid 레이아웃에서 col-span-2 적용)
   *
   * container: PR-7 grid-cols-6 레이아웃에서 col-span-2 적용 — 현재는 구조 토큰만 정의
   * surface: floating(raised보다 한 층 위) — 시각적 계층 강조
   */
  hero: {
    container: 'col-span-2 sm:col-span-3 lg:col-span-2 row-span-1',
    surface: ELEVATION_TOKENS.surface.floating,
    kpi: `${TYPOGRAPHY_TOKENS.kpi} text-5xl`,
    label: TYPOGRAPHY_TOKENS.kpiLabel,
    hoverBorder: 'hover:border-brand-critical/30',
    activeBorder: 'border-brand-critical',
    activeBg: 'bg-brand-critical/10',
    iconColor: 'text-brand-critical',
    alertRing: 'ring-1 ring-brand-critical/20',
  },
} as const;

export type CheckoutStatsVariant = keyof typeof CHECKOUT_STATS_VARIANTS;

/**
 * 통계 카드 alert 임계값 (SSOT — 하드코딩 금지)
 */
export const CHECKOUT_STATS_ALERT_THRESHOLD = {
  pending: 10,
} as const;

/**
 * 통계 카드 클래스 가져오기
 *
 * @param isAlert - true이면 alertRing 클래스 적용 (위험/경고 강조)
 */
export function getCheckoutStatsClasses(
  variant: CheckoutStatsVariant = 'total',
  isActive: boolean = false,
  isAlert: boolean = false
): string {
  const config = CHECKOUT_STATS_VARIANTS[variant];
  const baseClasses = 'cursor-pointer border-2';

  if (isActive) {
    return [baseClasses, config.activeBorder, config.activeBg].join(' ');
  }

  const alertClass = isAlert && config.alertRing ? config.alertRing : '';
  return [baseClasses, 'border-transparent', config.hoverBorder, alertClass]
    .filter(Boolean)
    .join(' ');
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
  statsCard: TRANSITION_PRESETS.fastBorderBg,

  /** 테이블 row hover: 배경색만 전환 */
  rowHover: TRANSITION_PRESETS.instantBg,

  /** 아이템 hover: 배경색 + 스케일 */
  itemHover: TRANSITION_PRESETS.fastBgTransform,

  /** Chevron 회전 */
  chevronRotate: TRANSITION_PRESETS.fastTransform,

  /** Selectable row: 배경색 + 불투명도 + border */
  selectableRow: TRANSITION_PRESETS.fastBgOpacityBorder,
} as const;

// ============================================================================
// 8. Checkout Interaction Tokens (상호작용 요소)
// ============================================================================

/**
 * Checkout 상호작용 토큰
 */
export const CHECKOUT_INTERACTION_TOKENS = {
  /** Group card trigger: hover + instant bg transition */
  groupCardTrigger: ['hover:bg-muted/50', TRANSITION_PRESETS.instantBg].join(' '),

  /** Clickable row: cursor + hover + transition */
  clickableRow: ['cursor-pointer', 'hover:bg-muted/50', TRANSITION_PRESETS.instantBg].join(' '),

  /** Row focus (focus-visible) */
  rowFocus: FOCUS_TOKENS.classes.default,

  /** Equipment item: border + rounded + hover + transition */
  equipmentItem: ['border', 'rounded-md', 'hover:bg-muted/50', TRANSITION_PRESETS.fastBg].join(' '),

  /** 반출지 레이블 최대 너비 (Tooltip 트리거용) */
  destinationLabel: 'truncate max-w-[10rem] cursor-help',
} as const;

// ============================================================================
// 9. Checkout Detail Tokens (상세 페이지)
// ============================================================================

/**
 * Checkout 상세 페이지 토큰
 */
export const CHECKOUT_DETAIL_TOKENS = {
  /** 담당자 카드 */
  personCard: 'bg-muted/50',

  /** 담당자 아이콘 컨테이너 */
  personIconContainer: 'bg-brand-info/10',

  /** 이상 내용 영역 */
  abnormalContent: 'bg-brand-critical/5',

  /** 승인 버튼 */
  approveButton: 'bg-brand-ok hover:bg-brand-ok/90 text-white',

  /** 거절 카드 */
  rejectionCard: 'border-brand-critical/30',

  /** 거절 제목 */
  rejectionTitle: getSemanticContainerTextClasses('critical'),
} as const;

// ============================================================================
// 10. Condition Comparison Tokens (조건 비교)
// ============================================================================

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
  abnormalTitle: getSemanticContainerTextClasses('critical'),

  /** 이상 내용 텍스트 */
  abnormalText: getSemanticContainerTextClasses('critical'),
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
    base: TRANSITION_PRESETS.fastBgOpacityBorder,

    /** Selected */
    selected: 'bg-brand-info/8 border-brand-info/30',

    /** Hoverable (selected 아닐 때) */
    hoverable: [
      'hover:bg-muted/50',
      'cursor-pointer',
      TRANSITION_PRESETS.fastBg,
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

/**
 * @deprecated CHECKOUT_STATS_VARIANTS.checkedOut 사용. 하위 호환용.
 */
export const CHECKOUT_STATS_CHECKED_OUT = CHECKOUT_STATS_VARIANTS.checkedOut;

/**
 * @deprecated CHECKOUT_STATS_VARIANTS.returned 사용. 하위 호환용.
 */
export const CHECKOUT_STATS_RETURNED = CHECKOUT_STATS_VARIANTS.returned;

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
      'flex items-center gap-3 bg-brand-critical/5 border border-brand-critical/20 rounded-lg px-4 py-3 shadow-md',
    icon: 'text-brand-critical shrink-0 h-4 w-4',
    text: 'flex-1 text-sm text-brand-critical',
    action:
      'text-xs font-semibold text-brand-critical underline whitespace-nowrap cursor-pointer hover:text-brand-critical/70',
    close:
      'text-brand-critical/40 hover:text-brand-critical/70 cursor-pointer shrink-0 h-3.5 w-3.5',
  },
  pendingCheck: {
    container:
      'flex items-center gap-3 bg-brand-warning/5 border border-brand-warning/20 rounded-lg px-4 py-3 shadow-sm',
    icon: 'text-brand-warning shrink-0 h-4 w-4',
    text: 'flex-1 text-sm text-brand-warning',
    action:
      'text-xs font-semibold bg-brand-warning text-white rounded px-3 py-1 cursor-pointer whitespace-nowrap hover:bg-brand-warning/90 shrink-0',
  },
} as const;

// ============================================================================
// 14-B. Inbound Section Tokens (반입 탭 3섹션 헤더)
// ============================================================================

/**
 * 반입 탭 3섹션 강화 헤더 토큰
 *
 * 각 섹션은 border-l-4 색상으로 시각 식별:
 *   teamLoan        → brand-info (타팀 대여)
 *   externalRental  → brand-purple (외부 렌탈)
 *   internalShared  → brand-ok (내부 공용)
 */
export const CHECKOUT_INBOUND_SECTION_TOKENS = {
  container: 'space-y-3',
  header: {
    wrapper: 'flex items-start gap-3 pb-2',
    iconContainer: {
      base: 'p-2 rounded-md shrink-0',
      teamLoan: 'bg-brand-info/10 text-brand-info',
      externalRental: 'bg-brand-purple/10 text-brand-purple',
      internalShared: 'bg-brand-ok/10 text-brand-ok',
    },
    titleRow: 'flex items-center gap-2 flex-wrap',
    title: 'text-sm font-semibold text-foreground',
    description: 'text-xs text-muted-foreground mt-0.5',
    countBadge:
      'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground',
  },
  borderAccent: {
    teamLoan: 'border-l-4 border-l-brand-info/40',
    externalRental: 'border-l-4 border-l-brand-purple/40',
    internalShared: 'border-l-4 border-l-brand-ok/40',
  },
} as const;

export type InboundSectionVariant = keyof typeof CHECKOUT_INBOUND_SECTION_TOKENS.borderAccent;

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
  alertIcon: 'h-3.5 w-3.5 text-brand-critical shrink-0',
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
  label: `${MICRO_TYPO.label} text-muted-foreground font-medium uppercase tracking-wide`,
  item: 'flex items-center gap-1.5 text-xs text-foreground/70',
  dot: {
    calibration: 'w-2.5 h-2.5 rounded-[2px] bg-brand-info shrink-0',
    repair: 'w-2.5 h-2.5 rounded-[2px] bg-brand-repair shrink-0',
    rental: 'w-2.5 h-2.5 rounded-[2px] bg-brand-purple shrink-0',
  },
} as const;

// ============================================================================
// 17. Checkout Filter Bar Tokens (필터 바 + 활성 필터 태그)
// ============================================================================

/**
 * 필터 바 및 활성 필터 태그 토큰
 *
 * CheckoutsContent.tsx의 필터 영역 스타일 SSOT
 */
export const CHECKOUT_FILTER_BAR_TOKENS = {
  /** 필터 바 컨테이너 */
  container:
    'bg-card border border-border/60 rounded-lg px-3 py-2.5 flex flex-wrap items-center gap-2',
  /** 구분선 */
  divider: 'w-px h-6 bg-border/60',
  /** 활성 필터 태그 (개별 제거 가능) */
  tag: [
    'inline-flex items-center gap-1 text-xs',
    'text-primary bg-primary/10 px-2 py-0.5 rounded-full',
    'hover:bg-primary/20',
    TRANSITION_PRESETS.instantBg,
  ].join(' '),
  /** 전체 초기화 버튼 */
  resetButton: 'flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground',
  /** 태그 내 X 아이콘 */
  tagDismissIcon: 'h-2.5 w-2.5',
  /** 초기화 X 아이콘 */
  resetIcon: 'h-3 w-3',
} as const;

// ============================================================================
// 18. Checkout Item Row Tokens (그룹 카드 내 개별 행)
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
    TRANSITION_PRESETS.instantBg,
    'hover:bg-muted/40',
  ].join(' '),

  /** 기한 초과 행 배경 */
  containerOverdue: 'bg-brand-critical/5 hover:bg-brand-critical/8',

  /** 목적별 3px 세로 색상 바 */
  purposeBar: {
    base: `${DIMENSION_TOKENS.purposeBar} self-stretch rounded-full shrink-0`,
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
  dday: `${MICRO_TYPO.badge} px-1.5 py-0.5 rounded font-medium tabular-nums shrink-0`,
  meta: 'text-xs text-muted-foreground mt-0.5 truncate',

  /** 우측 액션 영역 */
  actionsArea: 'flex items-center gap-1.5 shrink-0',

  /** 인라인 액션 버튼 */
  actionButtons: {
    /** 승인/반려 공통 compact 버튼 오버라이드 */
    compact: 'h-7 px-2.5 text-xs gap-1',
    /** 일괄 승인 버튼 (그룹 헤더) */
    bulkApprove: 'h-7 px-2.5 text-xs gap-1 bg-primary hover:bg-primary/90',
    /** 독촉 연락 버튼 (overdue 전용) */
    urgent: `h-7 px-2.5 text-xs text-brand-warning gap-1 ${TRANSITION_PRESETS.fastBg} hover:bg-brand-warning/10`,
    /** 반입 처리 링크 (checked_out / overdue) */
    returnLink: [
      'flex items-center gap-1 h-7 px-2.5 text-xs shrink-0',
      'rounded-md border border-border/60',
      'text-muted-foreground',
      TRANSITION_PRESETS.fastBgColor,
      'hover:bg-muted/60 hover:text-foreground',
    ].join(' '),
  },

  /** 그룹 헤더 컨테이너 (div — button 중첩 방지용) */
  groupHeaderContainer: [
    'flex w-full items-center gap-3 px-4 py-3',
    'border-b border-border/40 bg-muted/30',
    TRANSITION_PRESETS.instantBg,
  ].join(' '),
  /** 그룹 헤더 왼쪽 CollapsiblTrigger 트리거 버튼 */
  groupHeaderInfoTrigger:
    'flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 min-w-0 text-left cursor-pointer',
  /** 그룹 헤더 오른쪽 화살표 버튼 */
  groupHeaderChevronBtn: [
    'p-1 rounded-md shrink-0',
    'hover:bg-muted/50',
    TRANSITION_PRESETS.instantBg,
  ].join(' '),
  /** 장비 수 배지 */
  countBadge: 'text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md',
} as const;

// ============================================================================
// 19. Checkout Pagination Tokens (반출 목록 페이지네이션)
// ============================================================================

/**
 * 반출 목록 숫자 버튼 페이지네이션 토큰
 *
 * 와이어프레임: ‹ 1 2 3 › 패턴, 현재 페이지 하이라이트, 건수 정보
 */
export const CHECKOUT_PAGINATION_TOKENS = {
  container: 'flex items-center justify-between mt-6 px-1',
  info: 'text-xs text-muted-foreground tabular-nums',
  buttons: 'flex items-center gap-1',
  btn: {
    base: [
      `${DIMENSION_TOKENS.paginationBtn} flex items-center justify-center`,
      'rounded-md border text-xs font-medium',
      'cursor-pointer select-none tabular-nums',
      TRANSITION_PRESETS.fastBgColorBorder,
    ].join(' '),
    default: 'border-border bg-background hover:bg-muted text-foreground',
    active: 'border-primary bg-primary text-primary-foreground cursor-default',
    disabled: 'border-border/40 text-muted-foreground/40 cursor-default',
  },
  ellipsis: 'w-pagination flex items-center justify-center text-xs text-muted-foreground',
} as const;

// ============================================================================
// 20. Checkout Tab Badge Tokens (탭 카운트 배지)
// ============================================================================

/**
 * 탭 카운트 배지 토큰 — 활성/비활성 상태에 따라 색상 전환
 */
export const CHECKOUT_TAB_BADGE_TOKENS = {
  base: `ml-1 px-1.5 py-0.5 rounded-full ${MICRO_TYPO.badge} font-semibold leading-none tabular-nums`,
  active: 'bg-primary/15 text-primary',
  inactive: 'bg-muted text-muted-foreground',
} as const;
