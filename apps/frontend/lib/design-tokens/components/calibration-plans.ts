/**
 * Calibration Plans Design Tokens (Layer 3: Component)
 *
 * 교정계획서 페이지 전용 디자인 토큰
 * - 3단계 승인 플로우 (작성 → 확인 → 승인)
 * - 필터링 시스템
 * - 항목 테이블
 * - 상태 타임라인
 * - 목록 헤더 + KPI 스트립
 * - 컴팩트 로우 레이아웃
 *
 * SSOT: 모든 교정계획서 관련 스타일은 이 파일에서만 정의
 */

import {
  INTERACTIVE_TOKENS,
  ELEVATION_TOKENS,
  FOCUS_TOKENS,
  CONTENT_TOKENS,
  MOTION_TOKENS,
  toTailwindSize,
  toTailwindGap,
  getStaggerDelay,
  TRANSITION_PRESETS,
  ANIMATION_PRESETS,
} from '../index';
import { getSemanticLeftBorderClasses, getSemanticStatusClasses } from '../brand';
import { PAGE_HEADER_TOKENS, SUB_PAGE_HEADER_TOKENS } from './page-layout';

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
    labelKey: 'calibration.planStatus.draft',
    animation: '',
  },
  pending_review: {
    color: 'bg-brand-warning',
    textColor: 'text-white',
    borderColor: 'border-brand-warning',
    labelKey: 'calibration.planStatus.pending_review',
    /** Web Interface Guidelines: Specific property animations */
    animation: 'motion-safe:animate-pulse',
  },
  pending_approval: {
    color: 'bg-brand-info',
    textColor: 'text-white',
    borderColor: 'border-brand-info',
    labelKey: 'calibration.planStatus.pending_approval',
    animation: '',
  },
  approved: {
    color: 'bg-brand-ok',
    textColor: 'text-white',
    borderColor: 'border-brand-ok',
    labelKey: 'calibration.planStatus.approved',
    animation: '',
  },
  rejected: {
    color: 'bg-brand-critical',
    textColor: 'text-white',
    borderColor: 'border-brand-critical',
    labelKey: 'calibration.planStatus.rejected',
    animation: '',
  },
} as const;

export type CalibrationPlanStatusType = keyof typeof CALIBRATION_PLAN_STATUS_TOKENS;

/**
 * 교정계획서 상태 배지 색상 (Badge className 직접 사용)
 *
 * SSOT: calibration-plans-api.ts의 CALIBRATION_PLAN_STATUS_COLORS를 토큰으로 이관
 * - 기존 5곳에서 import하던 하드코딩 제거
 * - brand CSS 변수 기반 → dark mode 자동 대응
 */
export const CALIBRATION_PLAN_STATUS_BADGE_COLORS: Record<string, string> = {
  draft: 'bg-brand-neutral/10 text-brand-neutral',
  pending_review: 'bg-brand-warning/10 text-brand-warning border border-brand-warning/20',
  pending_approval: 'bg-brand-info/10 text-brand-info border border-brand-info/20',
  approved: 'bg-brand-ok/10 text-brand-ok border border-brand-ok/20',
  rejected: 'bg-brand-critical/10 text-brand-critical border border-brand-critical/20',
};

// ============================================================================
// 목록 페이지 헤더 토큰
// ============================================================================

/**
 * 교정계획서 목록 페이지 헤더 — PAGE_HEADER_TOKENS 기반 확장
 */
export const CALIBRATION_PLAN_HEADER_TOKENS = {
  ...PAGE_HEADER_TOKENS,
  /** 반응형 컨테이너 (모바일 세로 → 데스크톱 가로) */
  container: 'flex flex-col sm:flex-row sm:items-center justify-between gap-3',
  /** subtitle에 scope 아이콘 결합 시 flex 레이아웃 */
  subtitle: `${PAGE_HEADER_TOKENS.subtitle} flex items-center gap-1.5`,
  /** 스코프 배지 (역할 기반 필터 안내) */
  scopeBadge: 'text-xs text-brand-text-muted bg-muted/60 px-2 py-0.5 rounded-md',
} as const;

// ============================================================================
// KPI 스트립 토큰 (상태별 건수 요약)
// ============================================================================

/**
 * 교정계획서 KPI 스트립 — APPROVAL_KPI_STRIP_TOKENS 패턴 참조
 *
 * 5가지 variant: total(neutral), draft(info), pendingReview(warning),
 *                pendingApproval(info), approved(ok)
 */
export const CALIBRATION_PLAN_KPI_TOKENS = {
  container: 'grid grid-cols-2 lg:grid-cols-5 gap-3',
  card: {
    base: 'bg-card border border-border rounded-lg p-3 flex items-start gap-3 border-l-4',
    hover: [`hover:${ELEVATION_TOKENS.shadow.subtle}`, TRANSITION_PRESETS.fastShadowBorder].join(
      ' '
    ),
    focus: FOCUS_TOKENS.classes.default,
    /** 클릭 가능 카드 (필터 적용) */
    clickable: 'cursor-pointer',
    /** 활성 상태 (현재 필터) — 깊이 차등: raised elevation */
    active: `ring-2 ring-primary/30 ${ELEVATION_TOKENS.shadow.subtle}`,
  },
  /** AP-03: 타이포 드라마 — KPI 값은 2xl로 키워 라벨 대비 4:1 비율 */
  value: 'text-2xl font-bold tabular-nums leading-tight',
  label: 'text-xs text-muted-foreground',
  borderColors: {
    total: 'border-l-border',
    draft: getSemanticLeftBorderClasses('info'),
    pendingReview: getSemanticLeftBorderClasses('warning'),
    pendingApproval: getSemanticLeftBorderClasses('info'),
    approved: getSemanticLeftBorderClasses('ok'),
  },
  iconBg: {
    total: getSemanticStatusClasses('neutral'),
    draft: getSemanticStatusClasses('info'),
    pendingReview: getSemanticStatusClasses('warning'),
    pendingApproval: getSemanticStatusClasses('info'),
    approved: getSemanticStatusClasses('ok'),
  },
  iconContainer: 'rounded-md p-2 flex-shrink-0',
  /** AP-06: 모션 — KPI 카드 stagger fade-in */
  motion: {
    entrance: ANIMATION_PRESETS.slideUpFade,
    duration: 'motion-safe:duration-300',
    /** stagger delay 계산 유틸 */
    getDelay: (index: number) => getStaggerDelay(index, 'grid'),
  },
} as const;

export type CalibrationPlanKpiVariant = keyof typeof CALIBRATION_PLAN_KPI_TOKENS.borderColors;

// ============================================================================
// 목록 컴팩트 로우 토큰
// ============================================================================

/**
 * 교정계획서 목록 컴팩트 로우
 *
 * Desktop: 6-column grid [Year][Site][Team][Status][Author][CreatedAt]
 * Mobile: stacked flex
 */
export const CALIBRATION_PLAN_LIST_GRID_COLS =
  'lg:grid-cols-[120px_120px_1fr_140px_140px_110px_80px]' as const;

export const CALIBRATION_PLAN_LIST_TOKENS = {
  /** 로우 컨테이너 */
  container: {
    base: 'group relative border-b border-border last:border-b-0',
    desktop: `lg:grid ${CALIBRATION_PLAN_LIST_GRID_COLS} lg:items-center lg:gap-3 lg:px-4 lg:py-3`,
    mobile: 'flex flex-col gap-2 p-4 lg:p-0',
    /** 헤더 행 — AP-03: 타이포 드라마 — uppercase tracking-wide로 데이터 행과 구분 */
    header: `hidden lg:grid ${CALIBRATION_PLAN_LIST_GRID_COLS} lg:gap-3 lg:px-4 lg:py-2 bg-muted/30 border-b border-border text-[11px] font-medium text-muted-foreground uppercase tracking-wide`,
    /** 목록 외곽 래퍼 — AP-04: 깊이 차등 — raised surface */
    wrapper: `rounded-xl border border-brand-border-subtle bg-brand-bg-surface ${ELEVATION_TOKENS.shadow.subtle}`,
  },
  /** 호버 스타일 — AP-06: 모션 — fast bg transition */
  hover: ['hover:bg-muted/40', TRANSITION_PRESETS.fastBg].join(' '),
  /** 첫 번째 셀 좌측 여백 — 데이터 행과 헤더 행에서 공유 */
  firstCellPadding: 'pl-1',
  /** 연도 셀 (강조) */
  yearCell: 'font-semibold tabular-nums pl-1',
  /** 사이트 셀 */
  siteCell: 'flex items-center gap-1.5 text-sm',
  /** 팀 셀 (optional) */
  teamCell: 'text-sm text-muted-foreground truncate',
  /** 작성자 셀 */
  authorCell: 'text-sm',
  /** 날짜 셀 */
  dateCell: 'text-sm text-muted-foreground tabular-nums',
  /** 액션 영역 */
  actions: {
    container: 'flex items-center gap-1',
    iconButton: 'h-8 w-8 p-0',
  },
  /** Empty state */
  empty: {
    container: 'py-16 text-center',
    iconContainer: 'mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center',
    icon: 'h-8 w-8 text-muted-foreground/50',
    text: 'text-muted-foreground',
  },
} as const;

// ============================================================================
// 목록 인라인 필터 바 토큰
// ============================================================================

/**
 * 교정계획서 필터 바 — 인라인 스타일 (Card 래핑 제거)
 *
 * 패턴: AUDIT_FILTER_TOKENS 참조
 */
export const CALIBRATION_PLAN_FILTER_TOKENS = {
  /** 필터 바 컨테이너 */
  bar: 'flex flex-wrap items-end gap-3 rounded-xl border border-brand-border-subtle bg-brand-bg-surface p-3',
  /** 필드 라벨 */
  fieldLabel: 'text-xs font-medium text-muted-foreground mb-1',
  /** Select 공통 스타일 */
  select: 'h-8 text-xs',
} as const;

// ============================================================================
// 상세 페이지 헤더 토큰
// ============================================================================

/**
 * 교정계획서 상세 페이지 헤더 — SUB_PAGE_HEADER_TOKENS 기반 확장
 */
export const CALIBRATION_PLAN_DETAIL_HEADER_TOKENS = {
  /** 반응형 컨테이너: 좌-타이틀 | 우-액션 */
  container: 'flex flex-col sm:flex-row sm:items-start justify-between gap-4',
  /** 제목 영역 (뒤로가기 + 제목 + 배지) */
  titleArea: SUB_PAGE_HEADER_TOKENS.container,
  /** 제목 텍스트 */
  title: SUB_PAGE_HEADER_TOKENS.title,
  /** 메타 정보 (작성자/작성일) */
  meta: SUB_PAGE_HEADER_TOKENS.subtitle,
  /** 액션 버튼 그룹 */
  actionsGroup: 'flex flex-wrap gap-2',
  /** AP-04: 깊이 차등 — 상세 페이지 주요 Card에 raised elevation */
  cardElevation: ELEVATION_TOKENS.shadow.subtle,
} as const;

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
    size: INTERACTIVE_TOKENS.size.standard, // 44px mobile, 40px desktop (WCAG AAA)
    /** Web Interface Guidelines: Use border-radius for circular elements */
    radius: 'rounded-full',
  },

  /** 노드 상태별 스타일 */
  state: {
    /** 현재 진행 중 — pulse는 "타인의 액션 대기" 단계에만 적절 */
    active: {
      background: 'bg-brand-info',
      text: 'text-white',
      animation: '',
      icon: 'opacity-100',
    },
    /** 현재 진행 중 + 액션 대기 — pending_review/pending_approval에서 사용 */
    activeWaiting: {
      background: 'bg-brand-info',
      text: 'text-white',
      /** 다른 역할의 액션을 기다리는 상태 → 은은한 ring glow (4초 주기) */
      animation: 'motion-safe:animate-timeline-glow',
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
    /** 수평 연결선 (Desktop) */
    height: 'h-0.5',
    /** 수직 연결선 (Mobile) */
    verticalWidth: 'w-0.5',
    verticalHeight: 'h-6',
    /** 완료된 구간 */
    completed: 'bg-brand-ok',
    /** 대기 중 구간 */
    pending: 'bg-brand-neutral/30',
    /** AP-06: 모션 — moderate transition으로 연결선 상태 변화 시각화 */
    transition: TRANSITION_PRESETS.fastBg,
  },

  /** AP-08: 접근성 — 타임라인 ARIA 속성 */
  a11y: {
    /** 타임라인 컨테이너 role */
    role: 'group' as const,
    /** 현재 진행 단계 표시 */
    currentStep: 'step' as const,
  },

  /** 반응형 레이아웃 */
  layout: {
    /** Desktop: 수평 (sm 이상) */
    horizontal: 'hidden sm:flex items-center justify-between',
    /** Mobile: 수직 (sm 미만) */
    vertical: 'flex sm:hidden flex-col items-start gap-0',
    /** 수직 모드의 각 단계 행 */
    verticalStep: 'flex items-start gap-3',
    /** 수직 모드의 연결선 래퍼 */
    verticalConnectorWrap: 'flex items-center pl-[18px] py-0',
  },

  /** 라벨 스타일 */
  label: {
    title: 'mt-2 sm:mt-2 text-sm font-medium',
    subtitle: 'text-xs text-muted-foreground',
    timestamp: 'text-xs text-muted-foreground',
  },

  /** Motion: Progressive Reveal */
  motion: {
    /** 각 노드의 stagger delay */
    staggerDelay: MOTION_TOKENS.stagger.grid, // 60ms
    /** 등장 애니메이션 */
    entrance: {
      duration: MOTION_TOKENS.transition.moderate.duration, // 300ms
      easing: MOTION_TOKENS.transition.emphasized.easing,
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
    gap: toTailwindGap(INTERACTIVE_TOKENS.spacing.gap), // gap-3 md:gap-2
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
    transition: TRANSITION_PRESETS.fastBgBorder,
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
    transition: TRANSITION_PRESETS.instantBg,
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
    transition: TRANSITION_PRESETS.fastBgTransform,
  },

  /** Destructive action (반려, 삭제) */
  destructive: {
    size: toTailwindSize(INTERACTIVE_TOKENS.size.comfortable, 'h'),
    iconSize: toTailwindSize(INTERACTIVE_TOKENS.icon.standard, 'h'),
    gap: 'gap-2',
    focus: FOCUS_TOKENS.classes.default,
    hover: 'hover:scale-[1.02]',
    transition: TRANSITION_PRESETS.fastBgTransform,
  },

  /** Ghost action (목록으로, 취소) */
  ghost: {
    size: toTailwindSize(INTERACTIVE_TOKENS.size.standard, 'h'),
    iconSize: toTailwindSize(INTERACTIVE_TOKENS.icon.standard, 'h'),
    gap: 'gap-2',
    focus: FOCUS_TOKENS.classes.default,
    hover: 'hover:bg-muted/50',
    transition: TRANSITION_PRESETS.fastBg,
  },

  /** Inline action (품질책임자 확인 완료) */
  inline: {
    size: 'h-8', // Compact for inline use
    iconSize: 'h-4 w-4',
    gap: 'gap-1',
    focus: FOCUS_TOKENS.classes.default,
    hover: 'hover:bg-muted/50',
    transition: TRANSITION_PRESETS.fastBgTransform,
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
      duration: MOTION_TOKENS.transition.moderate.duration,
      easing: MOTION_TOKENS.transition.emphasized.easing,
    },
  },

  /** Header */
  header: {
    title: 'text-lg font-semibold',
    description: 'text-sm text-muted-foreground mt-1.5',
  },

  /** Footer */
  footer: {
    gap: toTailwindGap(INTERACTIVE_TOKENS.spacing.gap),
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
    duration: MOTION_TOKENS.transition.fast.duration,
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
    transition: TRANSITION_PRESETS.fastColor,
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
    size: toTailwindSize(INTERACTIVE_TOKENS.size.standard, 'h'),
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
  state: 'active' | 'activeWaiting' | 'completed' | 'pending' | 'rejected'
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
    TRANSITION_PRESETS.fastBgTransform,
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * 타임라인 수평 연결선 클래스 생성 (Desktop)
 */
export function getCalibrationPlanTimelineConnectorClasses(completed: boolean): string {
  const connector = CALIBRATION_PLAN_TIMELINE_TOKENS.connector;
  return [
    connector.height,
    'flex-1',
    completed ? connector.completed : connector.pending,
    connector.transition,
    // AP-06: 모션 — 커넥터 등장 시 수평 grow (완료된 구간만)
    completed ? `${ANIMATION_PRESETS.fadeIn} motion-safe:duration-500 origin-left` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * 타임라인 수직 연결선 클래스 생성 (Mobile)
 */
export function getCalibrationPlanTimelineVerticalConnectorClasses(completed: boolean): string {
  const connector = CALIBRATION_PLAN_TIMELINE_TOKENS.connector;
  return [
    connector.verticalWidth,
    connector.verticalHeight,
    completed ? connector.completed : connector.pending,
    connector.transition,
    // AP-06: 모션 — 커넥터 등장 시 수직 grow (완료된 구간만)
    completed ? `${ANIMATION_PRESETS.fadeIn} motion-safe:duration-500 origin-top` : '',
  ]
    .filter(Boolean)
    .join(' ');
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

// ============================================================================
// 테이블 컬럼 그룹 토큰 (W-2: 스냅샷 vs 계획 시각적 구분)
// ============================================================================

/**
 * 교정계획서 항목 테이블 컬럼 그룹 배경색
 *
 * 10+ 컬럼 테이블에서 "기본정보 / 현황(스냅샷) / 계획" 영역을
 * 배경색으로 시각적 앵커 제공 → 사용자의 시선 이동 최소화
 *
 * SSOT: brand CSS 변수 기반 → dark mode 자동 대응
 */
export const PLAN_TABLE_COLUMN_GROUP_TOKENS = {
  /** 기본정보 (순번, 관리번호, 장비명) — 투명 배경 */
  base: {
    cell: '',
    header: 'bg-muted/30',
  },
  /** 현황 스냅샷 (유효일자, 주기, 교정기관) — 파란 틴트 */
  snapshot: {
    cell: 'bg-brand-info/[0.03]',
    header: 'bg-brand-info/[0.08]',
    /** 그룹 시작 경계선 */
    borderStart: 'border-l-2 border-l-brand-info/20',
  },
  /** 계획 (예정일, 교정기관, 확인, 비고) — 앰버 틴트 */
  plan: {
    cell: 'bg-brand-warning/[0.03]',
    header: 'bg-brand-warning/[0.08]',
    /** 그룹 시작 경계선 */
    borderStart: 'border-l-2 border-l-brand-warning/20',
  },
  /** 그룹 헤더 라벨 (1행) */
  groupHeader: {
    text: 'text-xs font-semibold uppercase tracking-wider',
    icon: 'h-3.5 w-3.5 opacity-60',
    gap: 'inline-flex items-center gap-1',
  },
  /** 서브 헤더 (2행) */
  subHeader: {
    text: 'text-xs font-medium text-muted-foreground',
    bg: 'bg-muted/30',
  },
} as const;

// ============================================================================
// 확인 진행률 바 토큰 (W-1: 승인 후 항목 확인 트래킹)
// ============================================================================

/**
 * 교정계획서 항목 확인 진행률
 *
 * approved 상태에서만 표시 — 각 항목의 confirmedBy 유무로 진행률 계산
 * shimmer 애니메이션으로 "진행 중" 느낌 전달
 */
export const PLAN_PROGRESS_TOKENS = {
  /** 전체 컨테이너 */
  container: 'flex items-center gap-4 px-5 py-3 bg-muted/20 border-b border-brand-border-subtle',
  /** 라벨 */
  label: 'text-sm font-semibold text-brand-text-secondary whitespace-nowrap',
  /** 프로그레스 바 래퍼 */
  barWrap: 'flex-1 flex items-center gap-3',
  /** 트랙 */
  track: 'flex-1 h-2 bg-muted rounded-full overflow-hidden',
  /** 채움 (ok 색상 그라데이션) */
  fill: 'h-full bg-gradient-to-r from-brand-ok to-brand-ok/80 rounded-full',
  /** 텍스트 (숫자) */
  text: 'text-sm font-bold font-mono text-brand-ok whitespace-nowrap min-w-[72px] text-right tabular-nums',
  /** 100% 완료 시 */
  textComplete:
    'text-sm font-bold font-mono text-brand-ok whitespace-nowrap min-w-[72px] text-right tabular-nums',
  /** 0% 시 */
  textEmpty:
    'text-sm font-bold font-mono text-muted-foreground whitespace-nowrap min-w-[72px] text-right tabular-nums',
  /** 애니메이션 (progress bar는 의도적으로 느린 500ms) */
  transition:
    'motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out motion-reduce:transition-none',
} as const;

// ============================================================================
// 테이블 스크롤 힌트 토큰 (모바일 가로 스크롤 인지)
// ============================================================================

/**
 * 모바일에서 테이블이 가로 스크롤 가능함을 시각적으로 안내
 *
 * 우측 그라데이션 fade로 "더 있음"을 암시
 * sm 이상에서는 테이블이 충분히 넓으므로 숨김
 */
export const TABLE_SCROLL_HINT_TOKENS = {
  /** 상대 위치 래퍼 */
  wrapper: 'relative',
  /** 우측 그라데이션 오버레이 */
  fadeRight: [
    'absolute right-0 top-0 bottom-0 w-8 pointer-events-none z-10',
    'bg-gradient-to-l from-card to-transparent',
    'sm:hidden',
  ].join(' '),
} as const;

// ============================================================================
// 접이식 버전 이력 토큰 (W-3: Collapsible)
// ============================================================================

/**
 * 버전 이력을 details/summary 기반 접이식으로 표시
 *
 * 메인 콘텐츠(테이블)에 집중하도록 기본 접힘
 * 카드 하단에 배치하여 스크롤 감소
 */
export const VERSION_HISTORY_COLLAPSIBLE_TOKENS = {
  /** details 래퍼 */
  wrapper: 'border-t border-brand-border-subtle',
  /** summary 트리거 */
  trigger: [
    'flex items-center gap-2 w-full px-5 py-3',
    'text-sm font-semibold text-brand-text-secondary',
    'cursor-pointer select-none',
    'hover:bg-muted/40',
    FOCUS_TOKENS.classes.default,
    TRANSITION_PRESETS.fastBg,
  ].join(' '),
  /** chevron 아이콘 (CSS rotate) */
  icon: `h-4 w-4 shrink-0 ${TRANSITION_PRESETS.fastTransform}`,
  /** 열림 시 아이콘 회전 */
  iconOpen: 'rotate-90',
  /** 콘텐츠 패딩 */
  content: 'px-5 pb-4',
} as const;

// ============================================================================
// 교정계획서 생성 페이지 토큰
// ============================================================================

/**
 * 교정계획서 생성 페이지 — CALIBRATION_PLAN_DETAIL_HEADER_TOKENS 기반
 *
 * 헤더, 프리뷰 테이블, 폼 액션 영역
 */
export const CALIBRATION_PLAN_CREATE_TOKENS = {
  /** 페이지 헤더 (뒤로가기 + 제목) — SUB_PAGE_HEADER_TOKENS 기반 */
  header: {
    container: SUB_PAGE_HEADER_TOKENS.container,
    title: SUB_PAGE_HEADER_TOKENS.title,
    subtitle: SUB_PAGE_HEADER_TOKENS.subtitle,
  },
  /** 폼 그리드 */
  form: {
    grid: 'grid grid-cols-1 md:grid-cols-3 gap-6',
  },
  /** 프리뷰 테이블 래퍼 */
  preview: {
    scrollArea: 'max-h-[400px] overflow-auto',
    count: 'mb-4 text-sm text-muted-foreground',
  },
  /** 하단 액션 버튼 영역 */
  actions: {
    container: 'flex justify-end gap-4',
  },
} as const;
