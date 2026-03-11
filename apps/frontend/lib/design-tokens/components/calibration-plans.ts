/**
 * Calibration Plans Design Tokens (Layer 3: Component)
 *
 * 교정계획서 페이지 전용 디자인 토큰
 * - 3단계 승인 플로우 (작성 → 확인 → 승인)
 * - 필터링 시스템
 * - 항목 테이블
 * - 상태 타임라인
 *
 * SSOT: 모든 교정계획서 관련 스타일은 이 파일에서만 정의
 */

import {
  INTERACTIVE_TOKENS,
  ELEVATION_TOKENS,
  FOCUS_TOKENS,
  CONTENT_TOKENS,
  toTailwindSize,
  toTailwindGap,
  getTransitionClasses,
  getStaggerDelay,
  SPACING_PRIMITIVES,
  SIZE_PRIMITIVES,
  MOTION_PRIMITIVES,
} from '../index';

/**
 * 교정계획서 상태별 스타일
 *
 * UL-QP-18 교정계획서 승인 프로세스 반영:
 * - draft: 작성 중
 * - pending_review: 확인 대기 (기술책임자 → 품질책임자)
 * - pending_approval: 승인 대기 (품질책임자 → 시험소장)
 * - approved: 승인 완료
 * - rejected: 반려
 */
export const CALIBRATION_PLAN_STATUS_TOKENS = {
  draft: {
    color: 'bg-brand-info',
    textColor: 'text-white',
    borderColor: 'border-brand-info',
    label: '작성 중',
    labelKey: 'calibration.planStatus.draft',
    animation: '',
  },
  pending_review: {
    color: 'bg-yellow-500 dark:bg-yellow-600',
    textColor: 'text-white',
    borderColor: 'border-yellow-500 dark:border-yellow-600',
    label: '확인 대기',
    labelKey: 'calibration.planStatus.pending_review',
    /** Web Interface Guidelines: Specific property animations */
    animation: 'motion-safe:animate-pulse',
  },
  pending_approval: {
    color: 'bg-brand-info',
    textColor: 'text-white',
    borderColor: 'border-brand-info',
    label: '승인 대기',
    labelKey: 'calibration.planStatus.pending_approval',
    animation: '',
  },
  approved: {
    color: 'bg-brand-ok',
    textColor: 'text-white',
    borderColor: 'border-brand-ok',
    label: '승인 완료',
    labelKey: 'calibration.planStatus.approved',
    animation: '',
  },
  rejected: {
    color: 'bg-brand-critical',
    textColor: 'text-white',
    borderColor: 'border-brand-critical',
    label: '반려',
    labelKey: 'calibration.planStatus.rejected',
    animation: '',
  },
} as const;

export type CalibrationPlanStatusType = keyof typeof CALIBRATION_PLAN_STATUS_TOKENS;

/**
 * 3단계 승인 타임라인 토큰
 *
 * Progressive Reveal Animation:
 * - 각 노드는 순차적으로 나타남 (stagger delay)
 * - 현재 단계는 pulse 애니메이션
 * - 완료된 단계는 체크 아이콘 + 초록색
 */
export const CALIBRATION_PLAN_TIMELINE_TOKENS = {
  /** 타임라인 노드 크기 */
  node: {
    size: SIZE_PRIMITIVES.touch.minimal, // 44px mobile, 40px desktop (WCAG AAA)
    /** Web Interface Guidelines: Use border-radius for circular elements */
    radius: 'rounded-full',
  },

  /** 노드 상태별 스타일 */
  state: {
    /** 현재 진행 중 */
    active: {
      background: 'bg-brand-info',
      text: 'text-white',
      /** Web Interface Guidelines: Animate only transform and opacity */
      animation: 'motion-safe:animate-pulse',
      icon: 'opacity-100',
    },
    /** 완료됨 */
    completed: {
      background: 'bg-brand-ok',
      text: 'text-white',
      animation: '', // 완료 상태는 정적
      icon: 'opacity-100',
    },
    /** 대기 중 */
    pending: {
      background: 'bg-brand-neutral/30',
      text: 'text-brand-neutral',
      animation: '',
      icon: 'opacity-50',
    },
    /** 반려됨 */
    rejected: {
      background: 'bg-brand-critical',
      text: 'text-white',
      animation: '',
      icon: 'opacity-100',
    },
  },

  /** 연결선 (connector) */
  connector: {
    height: 'h-0.5',
    /** 완료된 구간 */
    completed: 'bg-brand-ok',
    /** 대기 중 구간 */
    pending: 'bg-brand-neutral/30',
    /** Web Interface Guidelines: Specific property transitions */
    transition: getTransitionClasses('fast', ['background-color']),
  },

  /** 라벨 스타일 */
  label: {
    title: 'mt-2 text-sm font-medium',
    subtitle: 'text-xs text-muted-foreground',
    timestamp: 'text-xs text-muted-foreground',
  },

  /** Motion: Progressive Reveal */
  motion: {
    /** 각 노드의 stagger delay */
    staggerDelay: MOTION_PRIMITIVES.stagger.comfortable, // 60ms
    /** 등장 애니메이션 */
    entrance: {
      duration: MOTION_PRIMITIVES.duration.moderate, // 300ms
      easing: MOTION_PRIMITIVES.easing.decelerate,
    },
  },
} as const;

/**
 * 필터 시스템 토큰
 *
 * 4개 필터: 연도, 시험소, 팀, 상태
 * - Responsive width
 * - Consistent spacing
 * - Touch-friendly
 */
export const FILTER_TOKENS = {
  /** 필터 컨테이너 */
  container: {
    /** Web Interface Guidelines: Use gap for flex spacing */
    gap: toTailwindGap(SPACING_PRIMITIVES.gap.comfortable), // gap-3 md:gap-2
    padding: 'p-4 md:p-3',
  },

  /** 필터별 고정 너비 (UI 일관성) */
  width: {
    year: 'w-[150px]',
    site: 'w-[150px]',
    team: 'w-[180px]',
    status: 'w-[180px]',
  },

  /** 필터 라벨 */
  label: {
    fontSize: 'text-sm',
    fontWeight: 'font-medium',
    spacing: 'mb-2',
  },

  /** Select 스타일 (shadcn/ui 확장) */
  select: {
    /** Web Interface Guidelines: focus-visible for keyboard navigation */
    focus: FOCUS_TOKENS.classes.default,
    /** Hover state */
    hover: 'hover:bg-muted/50',
    /** Web Interface Guidelines: Specific property transitions */
    transition: getTransitionClasses('fast', ['background-color', 'border-color']),
  },
} as const;

/**
 * 테이블 토큰
 *
 * 교정계획서 항목 테이블:
 * - 순번, 관리번호, 장비명
 * - 현황 (스냅샷): 유효일자, 교정주기, 교정기관
 * - 계획: 교정일자, 교정기관, 확인, 실제교정일
 */
export const TABLE_TOKENS = {
  /** 셀 간격 */
  cell: {
    /** Web Interface Guidelines: Consistent padding */
    padding: 'px-4 py-3 md:px-3 md:py-2',
    /** 텍스트 정렬 */
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  },

  /** 헤더 스타일 */
  header: {
    fontSize: 'text-sm',
    fontWeight: 'font-medium',
    color: 'text-muted-foreground',
    background: 'bg-muted/50',
  },

  /** 행 상태 */
  row: {
    /** Hover state */
    hover: 'hover:bg-muted/50',
    /** Web Interface Guidelines: Specific property transitions */
    transition: getTransitionClasses('instant', ['background-color']),
  },

  /** 인라인 편집 */
  inlineEdit: {
    /** Input 너비 */
    inputWidth: 'w-[100px]',
    /** 액션 버튼 */
    button: {
      size: 'h-8 w-8',
      iconSize: 'h-4 w-4',
    },
  },

  /** Empty state */
  empty: {
    container: 'text-center py-12',
    icon: 'h-12 w-12 mx-auto mb-4 opacity-50',
    text: 'text-muted-foreground',
  },
} as const;

/**
 * 카드 토큰
 *
 * 필터 카드, 항목 테이블 카드
 */
export const CARD_TOKENS = {
  /** 기본 카드 */
  default: {
    /** Elevation */
    shadow: `shadow-${ELEVATION_TOKENS.shadow.subtle}`,
    /** Border radius */
    radius: 'rounded-lg',
    /** Spacing */
    padding: 'p-6 md:p-4',
  },

  /** 헤더 */
  header: {
    title: 'text-lg font-semibold',
    description: 'text-sm text-muted-foreground',
    spacing: 'space-y-1.5',
  },

  /** Content */
  content: {
    spacing: 'space-y-4 md:space-y-3',
  },
} as const;

/**
 * 액션 버튼 토큰
 *
 * 교정계획서 상세 페이지의 액션 버튼:
 * - 검토 요청, 확인 완료, 최종 승인, 반려, 삭제
 */
export const ACTION_BUTTON_TOKENS = {
  /** Primary action (검토 요청, 확인 완료, 최종 승인) */
  primary: {
    /** Size: WCAG AAA */
    size: toTailwindSize(INTERACTIVE_TOKENS.size.comfortable, 'h'),
    /** Icon size */
    iconSize: toTailwindSize(INTERACTIVE_TOKENS.icon.standard, 'h'),
    /** Spacing */
    gap: 'gap-2',
    /** Focus */
    focus: FOCUS_TOKENS.classes.default,
    /** Hover: subtle scale */
    hover: 'hover:scale-[1.02]',
    /** Transition */
    transition: getTransitionClasses('fast', ['transform', 'background-color']),
  },

  /** Destructive action (반려, 삭제) */
  destructive: {
    size: toTailwindSize(INTERACTIVE_TOKENS.size.comfortable, 'h'),
    iconSize: toTailwindSize(INTERACTIVE_TOKENS.icon.standard, 'h'),
    gap: 'gap-2',
    focus: FOCUS_TOKENS.classes.default,
    hover: 'hover:scale-[1.02]',
    transition: getTransitionClasses('fast', ['transform', 'background-color']),
  },

  /** Ghost action (목록으로, 취소) */
  ghost: {
    size: toTailwindSize(INTERACTIVE_TOKENS.size.standard, 'h'),
    iconSize: toTailwindSize(INTERACTIVE_TOKENS.icon.standard, 'h'),
    gap: 'gap-2',
    focus: FOCUS_TOKENS.classes.default,
    hover: 'hover:bg-muted/50',
    transition: getTransitionClasses('fast', ['background-color']),
  },

  /** Inline action (품질책임자 확인 완료) */
  inline: {
    size: 'h-8', // Compact for inline use
    iconSize: 'h-4 w-4',
    gap: 'gap-1',
    focus: FOCUS_TOKENS.classes.default,
    hover: 'hover:bg-muted/50',
    transition: getTransitionClasses('fast', ['background-color', 'transform']),
  },
} as const;

/**
 * 다이얼로그 토큰
 *
 * 검토 요청, 승인, 반려, 삭제 확인 다이얼로그
 */
export const DIALOG_TOKENS = {
  /** Overlay */
  overlay: {
    zIndex: ELEVATION_TOKENS.layer.overlay,
    /** Backdrop blur */
    backdrop: 'backdrop-blur-sm',
    /** Background */
    background: 'bg-black/50',
  },

  /** Content */
  content: {
    zIndex: ELEVATION_TOKENS.layer.modal,
    shadow: `shadow-${ELEVATION_TOKENS.shadow.dramatic}`,
    radius: 'rounded-lg',
    /** Max width */
    maxWidth: 'max-w-md',
    /** Motion */
    entrance: {
      duration: MOTION_PRIMITIVES.duration.moderate,
      easing: MOTION_PRIMITIVES.easing.decelerate,
    },
  },

  /** Header */
  header: {
    title: 'text-lg font-semibold',
    description: 'text-sm text-muted-foreground mt-1.5',
  },

  /** Footer */
  footer: {
    gap: toTailwindGap(SPACING_PRIMITIVES.gap.comfortable),
    alignment: 'justify-end',
  },
} as const;

/**
 * Motion Presets (Animation variants)
 */
export const CALIBRATION_PLAN_MOTION = {
  /** 타임라인 노드 등장 */
  timelineNodeEntrance: (index: number) => ({
    style: {
      animationDelay: getStaggerDelay(index, 'grid'),
    },
    className: 'motion-safe:animate-fadeIn',
  }),

  /** 카드 등장 */
  cardEntrance: {
    className: 'motion-safe:animate-fadeIn',
    duration: MOTION_PRIMITIVES.duration.fast,
  },

  /** 테이블 행 등장 */
  tableRowEntrance: (index: number) => ({
    style: {
      animationDelay: getStaggerDelay(index, 'list'),
    },
    className: 'motion-safe:animate-fadeIn',
  }),

  /** 로딩 spinner */
  spinner: {
    /** Web Interface Guidelines: Animate only transform */
    className: 'motion-safe:animate-spin',
    icon: 'h-4 w-4',
  },
} as const;

/**
 * Collapsible 토큰 (품질책임자 의견란)
 *
 * 공간 절약 + 접근성:
 * - 기본 숨김
 * - "의견 추가" 클릭 시 펼침
 * - Enter/Space로 토글 가능
 */
export const COLLAPSIBLE_TOKENS = {
  /** Trigger */
  trigger: {
    fontSize: 'text-xs',
    color: 'text-muted-foreground hover:text-primary',
    gap: 'gap-1',
    iconSize: 'h-3 w-3',
    /** Web Interface Guidelines: Interactive elements need focus-visible */
    focus: FOCUS_TOKENS.classes.default,
    /** Transition */
    transition: getTransitionClasses('fast', ['color']),
  },

  /** Content */
  content: {
    /** Spacing */
    marginTop: 'mt-2',
    /** Input */
    input: {
      width: 'w-32',
      height: 'h-8',
      fontSize: 'text-xs',
    },
  },
} as const;

/**
 * Badge 토큰 (확인됨 배지)
 *
 * 항목 테이블의 "확인" 컬럼에 표시
 */
export const CONFIRMATION_BADGE_TOKENS = {
  /** 확인됨 상태 */
  confirmed: {
    background: 'bg-brand-ok/10',
    border: 'border-brand-ok/20',
    text: 'text-brand-ok',
    icon: 'h-3 w-3',
    gap: 'gap-1',
  },

  /** 미확인 상태 */
  unconfirmed: {
    text: 'text-muted-foreground',
  },
} as const;

/**
 * Alert 토큰 (반려 사유, 확인 의견)
 *
 * 반려 시 사유 표시, 확인 완료 시 의견 표시
 */
export const ALERT_TOKENS = {
  /** 반려 (destructive) */
  rejected: {
    variant: 'destructive',
    icon: 'h-4 w-4',
    title: 'font-semibold',
    description: 'text-sm',
  },

  /** 확인 의견 (info) */
  review: {
    variant: 'default',
    icon: 'h-4 w-4',
    title: 'font-semibold',
    description: 'text-sm',
  },
} as const;

/**
 * 스켈레톤 토큰 (로딩 상태)
 *
 * React Query placeholderData 사용 시 초기 로딩 최소화
 * 하지만 에러 시 fallback으로 스켈레톤 표시
 */
export const SKELETON_TOKENS = {
  /** 카드 스켈레톤 */
  card: {
    height: 'h-24',
    width: 'w-full',
    radius: 'rounded-lg',
  },

  /** 테이블 행 스켈레톤 */
  tableRow: {
    height: 'h-12',
    width: 'w-full',
  },

  /** 타임라인 노드 스켈레톤 */
  timelineNode: {
    size: toTailwindSize(SIZE_PRIMITIVES.touch.minimal, 'h'),
    radius: 'rounded-full',
  },
} as const;

// ============================================================================
// Component Helper Functions (즉시 사용 가능한 조합)
// ============================================================================

/**
 * 교정계획서 상태 배지 클래스 생성
 */
export function getCalibrationPlanStatusBadgeClasses(status: CalibrationPlanStatusType): string {
  const token = CALIBRATION_PLAN_STATUS_TOKENS[status];
  return [token.color, token.textColor, token.animation || ''].filter(Boolean).join(' ');
}

/**
 * 타임라인 노드 클래스 생성
 */
export function getCalibrationPlanTimelineNodeClasses(
  state: 'active' | 'completed' | 'pending' | 'rejected'
): string {
  const stateToken = CALIBRATION_PLAN_TIMELINE_TOKENS.state[state];
  const nodeToken = CALIBRATION_PLAN_TIMELINE_TOKENS.node;

  return [
    toTailwindSize(nodeToken.size, 'w'),
    toTailwindSize(nodeToken.size, 'h'),
    nodeToken.radius,
    stateToken.background,
    stateToken.text,
    stateToken.animation,
    'flex items-center justify-center',
    /** Web Interface Guidelines: Specific property transitions */
    getTransitionClasses('fast', ['background-color', 'transform']),
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * 타임라인 연결선 클래스 생성
 */
export function getCalibrationPlanTimelineConnectorClasses(completed: boolean): string {
  const connector = CALIBRATION_PLAN_TIMELINE_TOKENS.connector;
  return [
    connector.height,
    'flex-1',
    completed ? connector.completed : connector.pending,
    connector.transition,
  ].join(' ');
}

/**
 * 필터 Select 클래스 생성
 */
export function getFilterSelectClasses(): string {
  return [FILTER_TOKENS.select.focus, FILTER_TOKENS.select.hover, FILTER_TOKENS.select.transition]
    .filter(Boolean)
    .join(' ');
}

/**
 * 테이블 행 클래스 생성
 */
export function getTableRowClasses(): string {
  return [TABLE_TOKENS.row.hover, TABLE_TOKENS.row.transition].filter(Boolean).join(' ');
}

/**
 * 액션 버튼 클래스 생성
 */
export function getActionButtonClasses(
  variant: 'primary' | 'destructive' | 'ghost' | 'inline'
): string {
  const token = ACTION_BUTTON_TOKENS[variant];
  return [token.size, token.gap, token.focus, token.hover, token.transition]
    .filter(Boolean)
    .join(' ');
}

/**
 * 확인 배지 클래스 생성
 */
export function getConfirmationBadgeClasses(): string {
  const token = CONFIRMATION_BADGE_TOKENS.confirmed;
  return [
    token.background,
    token.border,
    token.text,
    token.gap,
    'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * 로딩 스피너 애니메이션
 *
 * Web Interface Guidelines: "Animate only transform and opacity"
 */
export function getLoadingSpinnerClasses(): string {
  return [CALIBRATION_PLAN_MOTION.spinner.className, CALIBRATION_PLAN_MOTION.spinner.icon]
    .filter(Boolean)
    .join(' ');
}

/**
 * Web Interface Guidelines: Font-variant-numeric for counts
 *
 * "Apply tabular-nums for number columns and comparisons"
 */
export const NUMERIC_TOKENS = {
  /** 숫자 컬럼 (테이블, 통계) */
  tabular: CONTENT_TOKENS.numeric.tabular,
} as const;

/**
 * 숫자 표시 클래스 (등폭 숫자)
 */
export function getNumericClasses(): string {
  return NUMERIC_TOKENS.tabular;
}
