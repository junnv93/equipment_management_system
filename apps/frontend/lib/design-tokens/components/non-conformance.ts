/**
 * Non-Conformance Component Tokens (Layer 3: Component-Specific)
 *
 * 부적합 관리 페이지 전용 디자인 토큰
 * - 3단계 워크플로우 (open → corrected → closed)
 * - 리스트 페이지: KPI 스트립, 필터, 테이블, 미니 워크플로우
 * - 상세 페이지: 워크플로우 타임라인, 정보 카드, 조치 섹션, 액션 바
 * - 경과일 긴급도 시각화
 *
 * 색상 원칙:
 * - 모든 색상은 brand.ts의 시맨틱 시스템 경유 (CSS 변수 기반)
 * - bg-green-*, bg-emerald-* 등 raw 색상 직접 사용 금지
 * - brand-ok = 성공/완료/연결됨, brand-critical = 부적합/위험
 *
 * Layer 참조:
 * - Layer 2: getSemanticBadgeClasses(), getSemanticContainerClasses() (brand.ts)
 * - Layer 2: TRANSITION_PRESETS (motion.ts)
 * - Layer 3: 이 파일 — 컴포넌트별 조합
 *
 * SSOT: 부적합 관리 페이지의 모든 스타일은 여기서만 정의
 */

import type { SemanticColorKey } from '../brand';
import { getSemanticContainerColorClasses, getSemanticLeftBorderClasses } from '../brand';
import { TRANSITION_PRESETS } from '../motion';
import { FOCUS_TOKENS } from '../semantic';
import {
  type NonConformanceStatus,
  NON_CONFORMANCE_STATUS_VALUES,
} from '@equipment-management/schemas';
import { PAGE_HEADER_TOKENS, SUB_PAGE_HEADER_TOKENS } from './page-layout';

// ============================================================================
// 0. NC_STATUS_SEMANTIC — 상태 → 시멘틱 매핑 (SSOT)
// ============================================================================

/** NC 상태 → 시멘틱 색상 매핑 (SSOT) */
const NC_STATUS_SEMANTIC_MAP: Record<NonConformanceStatus, SemanticColorKey> = {
  open: 'critical',
  corrected: 'info',
  closed: 'ok',
};

/**
 * 부적합 상태 → 시멘틱 색상 키 변환
 *
 * @example
 * getSemanticBadgeClasses(ncStatusToSemantic(nc.status))
 * getSemanticContainerClasses(ncStatusToSemantic(nc.status))
 */
export function ncStatusToSemantic(status: string): SemanticColorKey {
  return NC_STATUS_SEMANTIC_MAP[status as NonConformanceStatus] ?? 'neutral';
}

// ============================================================================
// 1. NC_BANNER_TOKENS — 부적합 배너 (장비 상세 페이지)
// ============================================================================

/**
 * 부적합 배너 (NonConformanceBanner)
 * 모든 색상이 brand-critical CSS 변수를 참조 → 다크 모드 자동 대응
 */
export const NC_BANNER_TOKENS = {
  alert: 'border-brand-critical bg-brand-critical/5',
  icon: 'h-5 w-5 text-brand-critical',
  title: 'text-brand-critical font-semibold text-lg',
  desc: 'text-brand-critical/80',
  detailCard: 'bg-card p-3 rounded-lg border border-brand-critical/20',
  detailText: 'text-sm text-foreground',
  /** 상태 기반 경고 Alert — NC 기록 없이 non_conforming/calibration_overdue일 때 사용 */
  statusAlert:
    'border-brand-critical/20 bg-brand-critical/5 dark:border-brand-critical/30 dark:bg-brand-critical/10',
  statusAlertIcon: 'h-4 w-4 text-brand-critical',
} as const;

// ============================================================================
// 2. NC_REPAIR_LINKED_TOKENS — 수리 연결 배지
// ============================================================================

/**
 * 수리 연결 배지 (Repair Linked)
 * brand-ok = 성공/완료 시맨틱 → hover/transition 확장
 */
export const NC_REPAIR_LINKED_TOKENS = {
  badge: [
    'px-2 py-1 text-xs font-medium rounded border',
    'text-brand-ok bg-brand-ok/10 border-brand-ok/20',
    'hover:bg-brand-ok/20',
    TRANSITION_PRESETS.fastBg,
  ].join(' '),
  text: 'flex items-center gap-2 text-sm text-brand-ok',
} as const;

// ============================================================================
// 3. NC_APPROVE_BUTTON_TOKENS — 승인/종결 버튼
// ============================================================================

export const NC_APPROVE_BUTTON_TOKENS = {
  approve: ['bg-brand-ok hover:bg-brand-ok/90 text-white', TRANSITION_PRESETS.fastBg].join(' '),
} as const;

// ============================================================================
// 4. NC_HEADER_TOKENS — 페이지 헤더
// ============================================================================

/**
 * 리스트 페이지 헤더 — PAGE_HEADER_TOKENS 기반
 */
export const NC_HEADER_TOKENS = {
  ...PAGE_HEADER_TOKENS,
} as const;

/**
 * 상세 페이지 헤더 — SUB_PAGE_HEADER_TOKENS 기반 확장
 */
export const NC_DETAIL_HEADER_TOKENS = {
  /** 컨테이너: 좌-타이틀 | 우-액션 (반응형) */
  container: 'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4',
  /** 타이틀 영역 (뒤로가기 + 제목 + 배지) */
  titleArea: SUB_PAGE_HEADER_TOKENS.container,
  /** 제목 */
  title: SUB_PAGE_HEADER_TOKENS.title,
  /** 메타 정보 (장비 링크, 발견일, 경과일) */
  meta: `${SUB_PAGE_HEADER_TOKENS.subtitle} mt-1 flex flex-wrap items-center gap-x-2 gap-y-1`,
  /** 액션 그룹 */
  actionsGroup: PAGE_HEADER_TOKENS.actionsGroup,
} as const;

// ============================================================================
// 5. NC_KPI_TOKENS — KPI 스트립 (4칸)
// ============================================================================

/**
 * KPI variant 타입
 */
export type NCKpiVariant = NonConformanceStatus;

/**
 * KPI 카드 스타일 — 시멘틱 색상 기반
 *
 * - open: critical (미해결 — 빨강)
 * - corrected: info (조치완료 — 파랑)
 * - closed: ok (종결 — 초록)
 */
export const NC_KPI_TOKENS: Record<
  NCKpiVariant,
  { leftBorder: string; iconBg: string; iconColor: string; valueColor: string }
> = {
  open: {
    leftBorder: 'border-l-brand-critical',
    iconBg: 'bg-brand-critical/10',
    iconColor: 'text-brand-critical',
    valueColor: 'text-brand-critical',
  },
  corrected: {
    leftBorder: 'border-l-brand-info',
    iconBg: 'bg-brand-info/10',
    iconColor: 'text-brand-info',
    valueColor: 'text-brand-info',
  },
  closed: {
    leftBorder: 'border-l-brand-ok',
    iconBg: 'bg-brand-ok/10',
    iconColor: 'text-brand-ok',
    valueColor: 'text-brand-ok',
  },
};

/**
 * KPI 카드 공통 스타일
 */
export const NC_KPI_CARD_TOKENS = {
  /** 카드 기본 */
  card: [
    'bg-card border border-border/60 rounded-lg p-4',
    'flex items-center gap-3.5',
    'border-l-4',
    TRANSITION_PRESETS.fastBgBorder,
  ].join(' '),
  /** 카드 hover */
  cardHover: 'hover:border-border hover:shadow-sm cursor-pointer',
  /** 카드 active (필터 적용됨) */
  cardActive: 'border-border bg-muted/30 shadow-sm',
  /** 아이콘 래퍼 */
  iconWrap: 'w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0',
  /** 라벨 */
  label: 'text-xs text-muted-foreground font-medium tracking-wide',
  /** 값 */
  value: 'text-2xl font-bold tabular-nums leading-tight',
} as const;

/**
 * Utility: KPI 카드 클래스 가져오기
 */
export function getNCKpiCardClasses(variant: NCKpiVariant, isActive: boolean): string {
  const v = NC_KPI_TOKENS[variant];
  const base = [NC_KPI_CARD_TOKENS.card, v.leftBorder, NC_KPI_CARD_TOKENS.cardHover];
  if (isActive) base.push(NC_KPI_CARD_TOKENS.cardActive);
  return base.join(' ');
}

// ============================================================================
// 6. NC_FILTER_TOKENS — 필터 바 (CALIBRATION_FILTER_BAR 대칭)
// ============================================================================

/**
 * 필터 바 스타일
 */
export const NC_FILTER_TOKENS = {
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

// ============================================================================
// 7. NC_LIST_TOKENS — 리스트 테이블 / 행
// ============================================================================

/**
 * 리스트 그리드 컬럼 (반응형)
 *
 * 컬럼: 상태+워크플로우 | 유형 | 장비 | 원인 | 발견일 | 경과일 | 액션
 */
export const NC_LIST_GRID_COLS =
  'lg:grid lg:grid-cols-[130px_100px_1fr_1.2fr_90px_70px_50px] lg:gap-3 lg:items-center';

/**
 * 리스트 행 스타일
 */
export const NC_LIST_TOKENS = {
  /** 테이블 외부 컨테이너 */
  wrapper: 'border rounded-lg overflow-hidden',
  /** 헤더 행 */
  headerRow: [
    'hidden lg:grid bg-muted/50 px-4 py-2.5',
    'text-xs font-semibold text-muted-foreground tracking-wide',
    NC_LIST_GRID_COLS,
  ].join(' '),
  /** 데이터 행 */
  row: [
    'px-4 py-3.5 border-b border-border/40 last:border-b-0',
    'hover:bg-muted/30',
    TRANSITION_PRESETS.instantBg,
    NC_LIST_GRID_COLS,
  ].join(' '),
  /** 장기 미조치 행 (14일+) */
  rowOverdue: 'border-l-4 border-l-brand-critical bg-brand-critical/[0.03]',
  /** 장비 링크 */
  equipmentLink: [
    'text-sm text-brand-info hover:underline inline-flex items-center gap-1',
    TRANSITION_PRESETS.fastColor,
  ].join(' '),
  /** 관리번호 */
  managementNumber: 'font-mono text-[11px] text-muted-foreground tabular-nums',
  /** 원인 주 텍스트 */
  causeMain: 'text-sm text-foreground',
  /** 원인 부가 정보 (괄호 등) */
  causeDetail: 'text-xs text-muted-foreground mt-0.5',
  /** 날짜 */
  date: 'text-sm text-muted-foreground tabular-nums',
  /** 액션 버튼 */
  actionButton: [
    'w-8 h-8 flex items-center justify-center rounded-md',
    'border border-border/60 text-muted-foreground',
    'hover:bg-muted hover:text-foreground',
    TRANSITION_PRESETS.fastBgColor,
  ].join(' '),
} as const;

/**
 * NC 유형 chip 스타일
 */
export const NC_TYPE_CHIP_TOKENS = {
  base: [
    'inline-flex items-center gap-1 px-2 py-0.5 rounded',
    'text-[11px] font-medium',
    'bg-muted/60 text-muted-foreground border border-border/40',
  ].join(' '),
} as const;

// ============================================================================
// 8. NC_MINI_WORKFLOW_TOKENS — 테이블 행 내 미니 3-step 프로그레스
// ============================================================================

/**
 * 미니 워크플로우 프로그레스 (리스트 행 내 인라인)
 *
 * 3개 dot + 2개 connector로 open → corrected → closed 표현
 */
export const NC_MINI_WORKFLOW_TOKENS = {
  container: 'flex items-center gap-0 mt-1.5',
  /** dot 공통 */
  dot: {
    base: 'w-[7px] h-[7px] rounded-full relative z-[1]',
    done: 'bg-brand-ok',
    current: 'bg-brand-warning shadow-[0_0_0_3px_rgba(245,158,11,0.15)]',
    currentCritical: 'bg-brand-critical shadow-[0_0_0_3px_rgba(239,68,68,0.15)]',
    pending: 'bg-border',
  },
  /** connector 공통 */
  connector: {
    base: 'w-4 h-[2px]',
    done: 'bg-brand-ok',
    pending: 'bg-border',
  },
} as const;

/**
 * Utility: 워크플로우 단계별 dot 클래스
 */
export function getNCMiniDotClasses(
  stepIndex: number,
  currentStepIndex: number,
  isLongOverdue: boolean
): string {
  const { dot } = NC_MINI_WORKFLOW_TOKENS;
  if (stepIndex < currentStepIndex) return [dot.base, dot.done].join(' ');
  if (stepIndex === currentStepIndex) {
    if (isLongOverdue && currentStepIndex === 0) return [dot.base, dot.currentCritical].join(' ');
    return [dot.base, dot.current].join(' ');
  }
  return [dot.base, dot.pending].join(' ');
}

/**
 * Utility: 워크플로우 connector 클래스
 */
export function getNCMiniConnectorClasses(
  connectorIndex: number,
  currentStepIndex: number
): string {
  const { connector } = NC_MINI_WORKFLOW_TOKENS;
  if (connectorIndex < currentStepIndex) return [connector.base, connector.done].join(' ');
  return [connector.base, connector.pending].join(' ');
}

// ============================================================================
// 9. NC_WORKFLOW_TOKENS — 상세 페이지 3단계 수평 타임라인
// ============================================================================

/**
 * 3단계 워크플로우 타임라인 (ApprovalTimeline 패턴 기반)
 *
 * open → corrected → closed
 */
export const NC_WORKFLOW_TOKENS = {
  /** 전체 컨테이너 */
  container: ['bg-card border border-border/60 rounded-lg p-6 sm:p-7'].join(' '),
  /** 컨테이너 — 긴급 (장기 미조치) */
  containerUrgent: 'border-brand-critical/30',
  /** 스텝 레이아웃 (flex, 4칸 균등) */
  stepsLayout: 'flex items-start relative',
  /** 개별 스텝 */
  step: 'flex-1 flex flex-col items-center relative z-[1]',
  /** 노드 (원형) 공통 */
  node: {
    base: [
      'w-10 h-10 rounded-full flex items-center justify-center',
      'text-sm font-bold border-2',
      TRANSITION_PRESETS.fastBgColorBorder,
    ].join(' '),
    completed: 'bg-brand-ok border-brand-ok text-white',
    current:
      'border-brand-warning bg-brand-warning/10 text-brand-warning shadow-[0_0_0_4px_rgba(245,158,11,0.1)]',
    currentCritical:
      'border-brand-critical bg-brand-critical/10 text-brand-critical shadow-[0_0_0_4px_rgba(239,68,68,0.1)] motion-safe:animate-pulse',
    currentInfo:
      'border-brand-info bg-brand-info/10 text-brand-info shadow-[0_0_0_4px_rgba(59,130,246,0.1)]',
    pending: 'border-border bg-muted text-muted-foreground',
  },
  /** 라벨 */
  label: {
    base: 'mt-2.5 text-[13px] font-semibold text-center',
    completed: 'text-brand-ok',
    current: 'text-brand-warning',
    currentCritical: 'text-brand-critical',
    currentInfo: 'text-brand-info',
    pending: 'text-muted-foreground',
  },
  /** 날짜 */
  date: 'mt-1 text-[11px] text-muted-foreground tabular-nums',
  /** 담당자 */
  actor: 'mt-0.5 text-[11px] text-foreground/60',
  /** 커넥터 (스텝 사이 수평선) */
  connector: {
    base: 'absolute top-5 h-[2px] z-0',
    done: 'bg-brand-ok',
    pending: 'bg-border',
  },
} as const;

/**
 * NC 워크플로우 3단계 스텝 정의 (SSOT)
 *
 * 리스트(MiniWorkflow) + 상세(WorkflowTimeline) 양쪽에서 재사용.
 * 스텝 순서 변경 시 이 배열만 수정하면 됩니다.
 */
export const NC_WORKFLOW_STEPS = NON_CONFORMANCE_STATUS_VALUES;

/** 상태 → 워크플로우 스텝 인덱스 매핑 */
export const NC_STATUS_STEP_INDEX: Record<string, number> = {
  open: 0,
  corrected: 1,
  closed: 2,
};

/**
 * Utility: 워크플로우 노드 클래스
 */
export function getNCWorkflowNodeClasses(
  stepIndex: number,
  currentStepIndex: number,
  isLongOverdue: boolean
): string {
  const { node } = NC_WORKFLOW_TOKENS;
  if (stepIndex < currentStepIndex) return [node.base, node.completed].join(' ');
  if (stepIndex === currentStepIndex) {
    if (isLongOverdue && currentStepIndex === 0) return [node.base, node.currentCritical].join(' ');
    if (currentStepIndex === 1) return [node.base, node.currentInfo].join(' ');
    return [node.base, node.current].join(' ');
  }
  return [node.base, node.pending].join(' ');
}

/**
 * Utility: 워크플로우 라벨 클래스
 */
export function getNCWorkflowLabelClasses(
  stepIndex: number,
  currentStepIndex: number,
  isLongOverdue: boolean
): string {
  const { label } = NC_WORKFLOW_TOKENS;
  if (stepIndex < currentStepIndex) return [label.base, label.completed].join(' ');
  if (stepIndex === currentStepIndex) {
    if (isLongOverdue && currentStepIndex === 0)
      return [label.base, label.currentCritical].join(' ');
    if (currentStepIndex === 1) return [label.base, label.currentInfo].join(' ');
    return [label.base, label.current].join(' ');
  }
  return [label.base, label.pending].join(' ');
}

/**
 * Utility: 워크플로우 커넥터 클래스
 */
export function getNCWorkflowConnectorClasses(
  connectorIndex: number,
  currentStepIndex: number
): string {
  const { connector } = NC_WORKFLOW_TOKENS;
  if (connectorIndex < currentStepIndex) return [connector.base, connector.done].join(' ');
  return [connector.base, connector.pending].join(' ');
}

// ============================================================================
// 10. NC_INFO_CARD_TOKENS — 기본정보 + 수리연결 카드
// ============================================================================

/**
 * 상세 페이지 정보 카드 (2-column grid)
 */
export const NC_INFO_CARD_TOKENS = {
  /** 그리드 레이아웃 */
  grid: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  /** 카드 공통 */
  card: 'bg-card border border-border/60 rounded-lg p-5',
  /** 카드 제목 */
  cardTitle: 'text-xs font-semibold text-muted-foreground tracking-wide uppercase mb-3.5',
  /** 정보 행 */
  infoRow: 'flex justify-between items-start py-2 border-b border-border/40 last:border-b-0',
  /** 정보 행 — 세로 (긴 텍스트) */
  infoRowVertical: 'flex flex-col gap-1.5 py-2 border-b border-border/40 last:border-b-0',
  /** 라벨 */
  infoLabel: 'text-[13px] text-muted-foreground flex-shrink-0 mr-4',
  /** 값 */
  infoValue: 'text-[13px] text-foreground text-right',
  /** 값 — 여러 줄 */
  infoValueMultiline: 'text-[13px] text-foreground leading-relaxed',
  /** 수리 연결됨 카드 */
  repairLinkedCard: 'border-brand-ok/30 bg-brand-ok/[0.03]',
  /** 수리 연결됨 제목 */
  repairLinkedTitle: 'text-brand-ok',
  /** 수리 필요 카드 */
  repairNeededCard: 'border-brand-warning/30 bg-brand-warning/[0.03]',
  /** 수리 필요 제목 */
  repairNeededTitle: 'text-brand-warning',
} as const;

// ============================================================================
// 11. NC_COLLAPSIBLE_TOKENS — 분석/조치/종결 Collapsible 섹션
// ============================================================================

/**
 * Collapsible 섹션 (COLLAPSIBLE_TOKENS 패턴)
 */
export const NC_COLLAPSIBLE_TOKENS = {
  /** 컨테이너 */
  container: 'bg-card border border-border/60 rounded-lg overflow-hidden',
  /** 트리거 버튼 */
  trigger: [
    'flex items-center justify-between w-full px-5 py-4',
    'text-sm font-semibold text-foreground',
    'hover:bg-muted/30',
    TRANSITION_PRESETS.instantBg,
  ].join(' '),
  /** 트리거 아이콘 */
  triggerIcon: 'text-muted-foreground',
  /** 콘텐츠 영역 */
  content: 'px-5 pb-5',
  /** 필드 그룹 */
  fieldGroup: 'mb-4 last:mb-0',
  /** 필드 라벨 */
  fieldLabel: 'text-xs font-semibold text-muted-foreground tracking-wide mb-1.5',
  /** 필드 값 */
  fieldValue: 'text-[13px] text-foreground leading-relaxed',
  /** 필드 메타 (날짜, 작성자) */
  fieldMeta: 'text-[11px] text-muted-foreground mt-1',
} as const;

// ============================================================================
// 12. NC_ACTION_BAR_TOKENS — 하단 액션 바
// ============================================================================

/**
 * 하단 액션 바 (역할별 동적)
 */
export const NC_ACTION_BAR_TOKENS = {
  /** 컨테이너 */
  container: [
    'flex flex-col sm:flex-row items-center justify-between gap-3',
    'bg-card border border-border/60 rounded-lg px-5 py-4',
  ].join(' '),
  /** 좌측 (상태 변경 + 저장) */
  left: 'flex items-center gap-2',
  /** 우측 (승인/반려) */
  right: 'flex items-center gap-2',
  /** 역할 힌트 텍스트 */
  roleHint: 'text-xs text-muted-foreground',
} as const;

// ============================================================================
// 13. NC_REJECTION_ALERT_TOKENS — 반려 사유 알림
// ============================================================================

/**
 * 반려 사유 배너 (brand-critical 기반)
 */
export const NC_REJECTION_ALERT_TOKENS = {
  container: [
    'flex items-start gap-3',
    `${getSemanticContainerColorClasses('critical')} border rounded-lg px-5 py-4`,
  ].join(' '),
  icon: 'text-brand-critical flex-shrink-0 mt-0.5 h-5 w-5',
  title: 'text-sm font-semibold text-brand-critical',
  description: 'text-[13px] text-muted-foreground mt-1 leading-relaxed',
  date: 'text-[11px] text-brand-critical/70 mt-1.5',
} as const;

// ============================================================================
// 14. NC_ELAPSED_DAYS_TOKENS — 경과일 긴급도
// ============================================================================

/**
 * 경과일 임계값 (일수)
 *
 * 부적합 특화 임계값 — APPROVAL_KPI와는 독립적
 */
export const NC_ELAPSED_THRESHOLDS = {
  /** 경고 임계값 (일) */
  WARNING_DAYS: 7,
  /** 위험 임계값 (일) */
  CRITICAL_DAYS: 14,
} as const;

/**
 * 경과일 스타일
 */
export const NC_ELAPSED_DAYS_TOKENS = {
  base: 'font-semibold tabular-nums text-[13px]',
  normal: 'text-muted-foreground',
  warning: 'text-brand-warning',
  critical: 'text-brand-critical',
} as const;

/**
 * Utility: 경과일 클래스 가져오기
 */
export function getNCElapsedDaysClasses(elapsedDays: number): string {
  const { base, normal, warning, critical } = NC_ELAPSED_DAYS_TOKENS;
  if (elapsedDays >= NC_ELAPSED_THRESHOLDS.CRITICAL_DAYS) return [base, critical].join(' ');
  if (elapsedDays >= NC_ELAPSED_THRESHOLDS.WARNING_DAYS) return [base, warning].join(' ');
  return [base, normal].join(' ');
}

/**
 * 경과일이 "장기 미조치"인지 판단
 */
export function isNCLongOverdue(elapsedDays: number): boolean {
  return elapsedDays >= NC_ELAPSED_THRESHOLDS.CRITICAL_DAYS;
}

// ============================================================================
// 15. NC_EMPTY_STATE_TOKENS — 빈 상태
// ============================================================================

export const NC_EMPTY_STATE_TOKENS = {
  container: 'text-center py-16',
  icon: 'h-12 w-12 text-muted-foreground',
  title: 'text-base font-medium tracking-tight text-foreground mt-4',
  description: 'text-sm text-muted-foreground mt-1 leading-relaxed',
} as const;

// ============================================================================
// 16. NC_MOTION — 모션 프리셋
// ============================================================================

export const NC_MOTION = {
  /** KPI 카드 hover */
  kpiCard: TRANSITION_PRESETS.fastBgBorder,
  /** 테이블 행 hover */
  tableRow: TRANSITION_PRESETS.instantBg,
  /** 링크 hover */
  link: TRANSITION_PRESETS.fastColor,
  /** Collapsible 트리거 */
  collapsible: TRANSITION_PRESETS.instantBg,
  /** 버튼 */
  button: TRANSITION_PRESETS.fastBg,
} as const;

// ============================================================================
// 17. NC_FOCUS — 포커스 재export
// ============================================================================

export const NC_FOCUS = FOCUS_TOKENS.classes;

// ============================================================================
// 18. NC_PAGINATION_TOKENS — 페이지네이션
// ============================================================================

export const NC_PAGINATION_TOKENS = {
  container: 'flex items-center justify-between py-3 text-sm text-muted-foreground',
  info: 'tabular-nums',
  buttons: 'flex gap-1',
  pageButton: [
    'w-8 h-8 flex items-center justify-center rounded-md',
    'border border-border/60 text-muted-foreground tabular-nums text-[13px]',
    'hover:bg-muted hover:text-foreground',
    TRANSITION_PRESETS.fastBgColor,
  ].join(' '),
  pageButtonActive: 'bg-primary text-primary-foreground border-transparent hover:bg-primary/90',
} as const;

// ============================================================================
// 19. NC_STAGGER — 스태거 애니메이션 딜레이
// ============================================================================

/**
 * 리스트 행 스태거 딜레이 (ms)
 */
export const NC_STAGGER_DELAY_MS = 60;

// ============================================================================
// 20. NC_LEFT_BORDER_INFO — 안내 배너 (info border-l-4)
// ============================================================================

export const NC_INFO_NOTICE_TOKENS = {
  container: [
    'border-l-4 p-4 rounded-r-md',
    getSemanticLeftBorderClasses('info'),
    getSemanticContainerColorClasses('info'),
  ].join(' '),
  icon: 'h-4 w-4 text-brand-info flex-shrink-0 mt-0.5',
  text: 'text-sm text-muted-foreground leading-relaxed',
} as const;

// ============================================================================
// 21. NC_URGENT_BADGE_TOKENS — 긴급 배지
// ============================================================================

export const NC_URGENT_BADGE_TOKENS = {
  badge: [
    'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold',
    'bg-brand-critical text-white',
  ].join(' '),
} as const;

// ============================================================================
// 22. NC_REJECTION_BADGE_TOKENS — 반려 배지 (리스트 행)
// ============================================================================

export const NC_REJECTION_BADGE_TOKENS = {
  badge: [
    'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium',
    getSemanticContainerColorClasses('critical'),
    'text-brand-critical',
  ].join(' '),
} as const;

// ============================================================================
// 23. NC_COLLAPSIBLE_EDIT_TOKENS — Collapsible 편집 모드
// ============================================================================

export const NC_COLLAPSIBLE_EDIT_TOKENS = {
  textarea: [
    'w-full min-h-[80px] p-3 text-sm rounded-md border border-border bg-background',
    'placeholder:text-muted-foreground/60 resize-y',
    FOCUS_TOKENS.classes.default,
  ].join(' '),
  saveRow: 'flex items-center justify-end gap-2 mt-2',
} as const;

// ============================================================================
// 24. NC_REPAIR_DETAIL_TOKENS — 수리 연결 상세 표시
// ============================================================================

export const NC_REPAIR_DETAIL_TOKENS = {
  row: 'flex items-center justify-between py-1.5 text-sm',
  label: 'text-muted-foreground',
  value: 'text-foreground font-medium',
  repairResultBadge: {
    completed: [
      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
      getSemanticContainerColorClasses('ok'),
      'text-brand-ok',
    ].join(' '),
    partial: [
      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
      getSemanticContainerColorClasses('warning'),
      'text-brand-warning',
    ].join(' '),
    failed: [
      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
      getSemanticContainerColorClasses('critical'),
      'text-brand-critical',
    ].join(' '),
  },
} as const;

/** 수리 결과 라벨 */
export const NC_REPAIR_RESULT_LABELS: Record<string, string> = {
  completed: '완료',
  partial: '부분 수리',
  failed: '실패',
} as const;
