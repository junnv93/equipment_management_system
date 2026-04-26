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
import {
  getSemanticContainerColorClasses,
  getSemanticContainerTextClasses,
  getSemanticSolidBgClasses,
} from '../brand';
import { TRANSITION_PRESETS } from '../motion';
import {
  ELEVATION_TOKENS,
  FOCUS_TOKENS,
  MICRO_TYPO,
  getSectionRhythm,
  type CalloutVariant,
  type CalloutEmphasis,
  type RoleChipKey,
} from '../semantic';
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
// 0.5. NC_ELEVATION — 3단계 elevation 체계 (SSOT)
// ============================================================================

// ============================================================================
// 1. NC_BANNER_TOKENS — 부적합 배너 (장비 상세 페이지)
// ============================================================================

/**
 * 부적합 배너 (NonConformanceBanner)
 * 모든 색상이 brand-critical CSS 변수를 참조 → 다크 모드 자동 대응
 *
 * variant:
 *   - full (기존): lg title + desc + detailCard + Button. 장비 리스트/대시보드 등 주목도 필요.
 *   - compact: 한 줄 inline strip (count + 최장 경과일 + 링크). 장비 상세 페이지 전용.
 *     → 이유: journey상 NC 상세로 drill-down할 때 시각 무게는 Callout(hero)에 남김.
 */
export const NC_BANNER_TOKENS = {
  alert: 'border-brand-critical bg-brand-critical/5',
  icon: 'h-5 w-5 text-brand-critical',
  title: 'text-brand-critical font-semibold text-lg',
  desc: 'text-brand-critical/80',
  detailCard: 'bg-card p-3 rounded-lg border border-brand-critical/20',
  /** detailCard의 링크 래퍼 — hover 포함 (Link 내부 div에 사용) */
  detailCardLink:
    'bg-card p-3 rounded-lg border border-brand-critical/20 hover:border-brand-critical/40 cursor-pointer',
  detailText: 'text-sm text-foreground',
  /** 상태 기반 경고 Alert — NC 기록 없이 non_conforming/calibration_overdue일 때 사용 */
  statusAlert:
    'border-brand-critical/20 bg-brand-critical/5 dark:border-brand-critical/30 dark:bg-brand-critical/10',
  statusAlertIcon: 'h-4 w-4 text-brand-critical',
  // -- compact variant (inline-strip) --
  /** 컴팩트 Alert 컨테이너 — 한 줄 inline strip */
  alertCompact: 'border-brand-critical bg-brand-critical/5 flex items-center gap-3 py-2.5 px-3.5',
  /** 컴팩트 아이콘 */
  iconCompact: 'h-4 w-4 text-brand-critical shrink-0',
  /** 컴팩트 제목 (인라인) */
  titleCompact: 'text-sm font-semibold text-brand-critical',
  /** 컴팩트 경과일 텍스트 (제목 우측 · opacity 80%) */
  compactOverdue: 'text-brand-critical/80 ml-2',
  /** 컴팩트 CTA 링크 (우측) */
  compactCta: 'text-sm font-semibold text-brand-critical underline underline-offset-[3px]',
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
  /** 제목 — SUB_PAGE_HEADER_TOKENS(text-xl)보다 한 단계 더 큰 text-2xl로 타이포 드라마 강화 */
  title: 'text-2xl font-bold tracking-tight text-foreground',
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
    ELEVATION_TOKENS.surface.raised,
    TRANSITION_PRESETS.fastBgBorder,
  ].join(' '),
  /** 카드 hover — hover: prefix 필요로 NC_ELEVATION 직접 참조 불가 (Tailwind JIT 제약).
   *  raised(shadow-sm) → hover 시 floating 수준(shadow-md)으로 한 단계 승격 */
  cardHover: 'hover:border-border hover:shadow-md cursor-pointer',
  /** 카드 active — hover와 동일 이유로 shadow-md 직접 사용.
   *  active 상태는 floating 시각 무게를 유지 (filter 적용됨 명시) */
  cardActive: 'border-border bg-muted/30 shadow-md',
  /** 아이콘 래퍼 */
  iconWrap: 'w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0',
  /** 라벨 */
  label: 'text-xs text-muted-foreground font-medium tracking-wide',
  /** 값 */
  value: 'text-2xl font-bold tabular-nums leading-tight',
  /** 필터 토글 힌트 (접근성 — 클릭 의미 전달) */
  filterHint: `${MICRO_TYPO.badge} text-muted-foreground/60 mt-0.5 leading-none`,
  /** hero 값 — open count > 0 시 강조 (P9) */
  heroValue: 'text-3xl font-bold tabular-nums leading-tight',
  /** hero 카드 — open 카드 최우선 강조 (P9) */
  heroCard: 'shadow-md ring-1 ring-brand-critical/15',
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
  'lg:grid lg:grid-cols-[130px_100px_1fr_1.2fr_90px_70px_90px] lg:gap-3 lg:items-center';

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
  /** 단일 Link 래퍼 (stripe, border, hover, overdue 적용 단위 — 접근성 중복 Link 방지) */
  itemWrapper: [
    'block border-b border-border/40 last:border-b-0 even:bg-muted/20',
    'hover:bg-muted/30',
    TRANSITION_PRESETS.instantBg,
  ].join(' '),
  /** 데스크톱 레이아웃 div (lg 이상 grid, hover는 부모 Link 담당) */
  desktopRow: ['hidden lg:grid px-4 py-3.5 w-full', NC_LIST_GRID_COLS].join(' '),
  /** 모바일 레이아웃 div (lg 미만 카드, hover는 부모 Link 담당) */
  mobileRow: 'lg:hidden flex flex-col gap-1.5 py-3 px-4',
  /** 장기 미조치 행 (14일+) */
  rowOverdue: 'border-l-4 border-l-brand-critical bg-brand-critical/[0.03]',
  /** 장비 링크 */
  equipmentLink: [
    'text-sm text-brand-info hover:underline inline-flex items-center gap-1',
    TRANSITION_PRESETS.fastColor,
  ].join(' '),
  /** 관리번호 */
  managementNumber: `font-mono ${MICRO_TYPO.meta} text-muted-foreground tabular-nums`,
  /** 원인 주 텍스트 */
  causeMain: 'text-sm text-foreground',
  /** 원인 부가 정보 (괄호 등) */
  causeDetail: 'text-xs text-muted-foreground mt-0.5',
  /** 날짜 */
  date: 'text-sm text-muted-foreground tabular-nums',
  /** 액션 영역 장식 Eye 인디케이터 (Link 내부 span — 클릭 동작 없음) */
  actionIndicator: [
    'w-8 h-8 flex items-center justify-center rounded-md',
    'border border-border/60 text-muted-foreground',
    'hover:bg-muted hover:text-foreground',
    TRANSITION_PRESETS.fastBgColor,
  ].join(' '),
} as const;

/**
 * 리스트 행 액션 chip — 기본 형태 클래스 (크기·타이포·모양·줄바꿈 방지)
 * variant 색상은 getActionChipClasses(variant) 조합
 */
export const ACTION_CHIP_BASE =
  'text-[10px] font-semibold px-1.5 py-0 rounded-full whitespace-nowrap';

/**
 * 리스트 행 액션 chip 변형 (role-aware: my-turn/approval=warning, blocked=warning, done=neutral)
 * 하드코딩 방지 — 호출처는 getActionChipClasses(chip.variant) 경유
 */
type ActionChipVariant = 'warning' | 'critical' | 'neutral';
const ACTION_CHIP_VARIANT_CLASSES = {
  warning: 'bg-brand-warning/10 text-brand-warning',
  critical: 'bg-brand-critical/10 text-brand-critical',
  neutral: 'bg-muted text-muted-foreground',
} as const satisfies Record<ActionChipVariant, string>;

export function getActionChipClasses(variant: ActionChipVariant): string {
  return ACTION_CHIP_VARIANT_CLASSES[variant];
}

/**
 * 모바일 카드 레이아웃 토큰 (lg 미만)
 */
export const NC_LIST_MOBILE_TOKENS = {
  /** 상단 행: 상태배지 + 유형칩 / 경과일 */
  topRow: 'flex items-center justify-between gap-2',
  /** 중간 행: 장비명 + 관리번호 */
  middleRow: 'flex items-center gap-2 min-w-0',
  /** 하단 행: 원인 + Eye 버튼 */
  bottomRow: 'flex items-center justify-between gap-2 mt-0.5',
  /** 장비명 */
  equipmentName: 'text-sm font-medium text-foreground truncate',
  /** 관리번호 */
  managementNum: `font-mono ${MICRO_TYPO.meta} text-muted-foreground shrink-0`,
  /** 원인 텍스트 */
  causeText: 'text-sm text-muted-foreground truncate flex-1',
} as const;

/**
 * NC 유형 chip 스타일
 */
export const NC_TYPE_CHIP_TOKENS = {
  base: [
    'inline-flex items-center gap-1 px-2 py-0.5 rounded',
    `${MICRO_TYPO.meta} font-medium`,
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
    if (currentStepIndex === NC_TERMINAL_STEP_INDEX) return [dot.base, dot.done].join(' ');
    if (isLongOverdue && currentStepIndex === NC_OPEN_STEP_INDEX)
      return [dot.base, dot.currentCritical].join(' ');
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
  /** 전체 컨테이너 — ELEVATION_TOKENS.surface.raised (raised 계층: 워크플로우는 카드보다 상위 정보) */
  container: [
    `bg-card border border-border/60 rounded-lg p-6 sm:p-7 ${ELEVATION_TOKENS.surface.raised}`,
  ].join(' '),
  /**
   * 컴팩트 컨테이너 — Callout hero 승격 시 Timeline을 horizontal strip으로 축소.
   * GuidanceCallout이 hero로 렌더되어 "지금 할 일"이 주인공일 때, Timeline(기록)의 시각 무게를 낮춤.
   */
  containerCompact: [
    `bg-card border border-border/60 rounded-lg px-3.5 py-3 flex items-center gap-3 ${ELEVATION_TOKENS.surface.raised}`,
  ].join(' '),
  /** 컨테이너 — 긴급 (장기 미조치) */
  containerUrgent: 'border-brand-critical/30',
  /** 스텝 레이아웃 — flex sibling 패턴, relative 불필요 */
  stepsLayout: 'flex items-start',
  /** 개별 스텝 */
  step: 'flex flex-col items-center',
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
    base: `mt-2.5 ${MICRO_TYPO.detail} font-semibold text-center`,
    completed: 'text-brand-ok',
    current: 'text-brand-warning',
    currentCritical: 'text-brand-critical',
    currentInfo: 'text-brand-info',
    pending: 'text-muted-foreground',
  },
  /** 날짜 */
  date: `mt-1 ${MICRO_TYPO.meta} text-muted-foreground tabular-nums`,
  /** 담당자 */
  actor: `mt-0.5 ${MICRO_TYPO.meta} text-foreground/60`,
  /** 커넥터 (스텝 사이 수평선) — flex sibling 패턴 (절대 포지셔닝 제거) */
  connector: {
    base: 'flex-1 h-[2px] self-start mt-5',
    done: 'bg-brand-ok',
    pending: 'bg-border/60',
  },
  /** Compact 모드 — GuidanceCallout hero 시 mini dot strip */
  compactDot: {
    base: 'w-3 h-3 rounded-full border-2 shrink-0',
    completed: 'bg-brand-ok border-brand-ok',
    current: 'bg-brand-warning/20 border-brand-warning shadow-[0_0_0_3px_rgba(245,158,11,0.12)]',
    currentCritical:
      'bg-brand-critical/20 border-brand-critical shadow-[0_0_0_3px_rgba(239,68,68,0.12)]',
    pending: 'bg-muted border-border',
  },
  /** Compact 커넥터 */
  compactConnector: {
    base: 'flex-1 h-[1.5px]',
    done: 'bg-brand-ok',
    pending: 'bg-border/60',
  },
  /** Compact 현재 단계 라벨 */
  compactCurrentLabel: 'text-[11px] font-semibold text-foreground/80 shrink-0',
  /** Compact 현재 단계 날짜 */
  compactCurrentDate: 'text-[11px] tabular-nums text-muted-foreground shrink-0',
} as const;

/**
 * NC 워크플로우 3단계 스텝 정의 (SSOT)
 *
 * 리스트(MiniWorkflow) + 상세(WorkflowTimeline) 양쪽에서 재사용.
 * 스텝 순서 변경 시 이 배열만 수정하면 됩니다.
 */
export const NC_WORKFLOW_STEPS = NON_CONFORMANCE_STATUS_VALUES;

/** closed 상태: 워크플로우 마지막 스텝 인덱스 (terminal state) */
export const NC_TERMINAL_STEP_INDEX = NC_WORKFLOW_STEPS.length - 1;

/** 상태 → 워크플로우 스텝 인덱스 매핑 (NC_WORKFLOW_STEPS 배열에서 파생 — SSOT) */
export const NC_STATUS_STEP_INDEX = Object.fromEntries(
  NC_WORKFLOW_STEPS.map((status, index) => [status, index])
) as Record<NonConformanceStatus, number>;

/** open 상태 스텝 인덱스 (overdue 분기용) */
export const NC_OPEN_STEP_INDEX = NC_STATUS_STEP_INDEX['open'];

/** corrected 상태 스텝 인덱스 (node/label 분기용) */
export const NC_CORRECTED_STEP_INDEX = NC_STATUS_STEP_INDEX['corrected'];

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
    if (currentStepIndex === NC_TERMINAL_STEP_INDEX) return [node.base, node.completed].join(' ');
    if (isLongOverdue && currentStepIndex === NC_OPEN_STEP_INDEX)
      return [node.base, node.currentCritical].join(' ');
    if (currentStepIndex === NC_CORRECTED_STEP_INDEX)
      return [node.base, node.currentInfo].join(' ');
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
    if (currentStepIndex === NC_TERMINAL_STEP_INDEX) return [label.base, label.completed].join(' ');
    if (isLongOverdue && currentStepIndex === NC_OPEN_STEP_INDEX)
      return [label.base, label.currentCritical].join(' ');
    if (currentStepIndex === NC_CORRECTED_STEP_INDEX)
      return [label.base, label.currentInfo].join(' ');
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

/**
 * Utility: compact 모드 dot 클래스 (hero Callout 시 mini progress dots)
 */
export function getNCWorkflowCompactDotClasses(
  stepIndex: number,
  currentStepIndex: number,
  isLongOverdue: boolean
): string {
  const { compactDot } = NC_WORKFLOW_TOKENS;
  if (stepIndex < currentStepIndex) return `${compactDot.base} ${compactDot.completed}`;
  if (stepIndex === currentStepIndex) {
    if (currentStepIndex === NC_TERMINAL_STEP_INDEX)
      return `${compactDot.base} ${compactDot.completed}`;
    if (isLongOverdue && currentStepIndex === NC_OPEN_STEP_INDEX)
      return `${compactDot.base} ${compactDot.currentCritical}`;
    return `${compactDot.base} ${compactDot.current}`;
  }
  return `${compactDot.base} ${compactDot.pending}`;
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
  card: `bg-card border border-border/60 rounded-lg p-5 ${ELEVATION_TOKENS.surface.raised}`,
  /** 카드 제목 */
  cardTitle: 'text-xs font-semibold text-muted-foreground tracking-wide uppercase mb-3.5',
  /** 정보 행 */
  infoRow: 'flex justify-between items-start py-2 border-b border-border/40 last:border-b-0',
  /** 정보 행 — 세로 (긴 텍스트) */
  infoRowVertical: 'flex flex-col gap-1.5 py-2 border-b border-border/40 last:border-b-0',
  /** 라벨 */
  infoLabel: `${MICRO_TYPO.detail} text-muted-foreground flex-shrink-0 mr-4`,
  /** 값 */
  infoValue: `${MICRO_TYPO.detail} text-foreground text-right`,
  /** 값 — 여러 줄 */
  infoValueMultiline: `${MICRO_TYPO.detail} text-foreground leading-relaxed`,
  /** 수리 연결됨 카드 */
  repairLinkedCard: 'border-brand-ok/30 bg-brand-ok/[0.03]',
  /** 수리 연결됨 제목 */
  repairLinkedTitle: 'text-brand-ok',
  /** 수리 필요 카드 */
  repairNeededCard: 'border-brand-warning/30 bg-brand-warning/[0.03]',
  /** 수리 필요 제목 */
  repairNeededTitle: 'text-brand-warning',
  /** 수리 연결 시 그리드 비율 조정 — 기본정보(5필드) 카드가 더 넓어야 함 */
  gridRepairLinked: 'grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-4',
  /** 수리/교정 등록·보기 링크 버튼 공통 스타일 */
  registerLink: 'text-sm text-brand-info hover:underline inline-flex items-center gap-1',
} as const;

// ============================================================================
// 11. NC_COLLAPSIBLE_TOKENS — 분석/조치/종결 Collapsible 섹션
// ============================================================================

/**
 * Collapsible 섹션 (COLLAPSIBLE_TOKENS 패턴)
 */
export const NC_COLLAPSIBLE_TOKENS = {
  /** 컨테이너 (overflow-hidden을 contentWrapper로 이동 — shadow 클리핑 방지) */
  container: `bg-card border border-border/60 rounded-lg ${ELEVATION_TOKENS.surface.raised}`,
  /** 트리거 버튼 */
  trigger: [
    'flex items-center justify-between w-full px-5 py-4',
    'text-sm font-semibold text-foreground',
    'hover:bg-muted/30',
    TRANSITION_PRESETS.instantBg,
  ].join(' '),
  /** 트리거 아이콘 */
  triggerIcon: 'text-muted-foreground',
  /** 애니메이션 래퍼 — grid-rows 높이 트랜지션 (항상 DOM에 존재, CSS로만 펼침/접힘) */
  contentWrapper: ['grid overflow-hidden rounded-b-lg', TRANSITION_PRESETS.fastGridRows].join(' '),
  /** 애니메이션 내부 래퍼 — min-h-0은 grid-rows 트랜지션 필수 */
  contentInner: 'min-h-0',
  /** 콘텐츠 영역 */
  content: 'px-5 pb-5',
  /** 필드 그룹 */
  fieldGroup: 'mb-4 last:mb-0',
  /** 필드 라벨 */
  fieldLabel: 'text-xs font-semibold text-muted-foreground tracking-wide mb-1.5',
  /** 필드 값 */
  fieldValue: `${MICRO_TYPO.detail} text-foreground leading-relaxed`,
  /** 필드 메타 (날짜, 작성자) */
  fieldMeta: `${MICRO_TYPO.meta} text-muted-foreground mt-1`,
  /** 빈 상태 래퍼 — 아이콘 + 텍스트 수직 중앙 정렬 */
  emptyState: 'flex flex-col items-center justify-center py-6 gap-2',
  /** 빈 상태 아이콘 */
  emptyStateIcon: 'h-8 w-8 text-muted-foreground/40',
  /** 빈 상태 텍스트 */
  emptyStateText: 'text-sm text-muted-foreground',
} as const;

// ============================================================================
// 12. NC_ACTION_BAR_TOKENS — 하단 액션 바
// ============================================================================

/**
 * 하단 액션 바 (역할별 동적)
 */
export const NC_ACTION_BAR_TOKENS = {
  /** sticky 래퍼 — 스크롤 시 하단 고정 */
  stickyWrapper: 'sticky bottom-4 z-10',
  /** 컨테이너 — ELEVATION_TOKENS.surface.floating으로 ActionBar가 카드보다 시각적으로 우선 */
  container: [
    'flex flex-col sm:flex-row items-center justify-between gap-3',
    `bg-card border border-border/60 rounded-lg px-5 py-4 ${ELEVATION_TOKENS.surface.floating}`,
  ].join(' '),
  /** 좌측 (상태 변경 + 저장) */
  left: 'flex items-center gap-2',
  /** 우측 (승인/반려) */
  right: 'flex items-center gap-2',
  /** 역할 힌트 텍스트 (보조 — OPEN 상태 전제조건 안내) */
  roleHint: 'text-xs text-muted-foreground',
  /** 역할 힌트 강조 (유일 안내인 경우 — CORRECTED+!canClose) */
  roleHintActive: 'text-sm text-foreground font-medium',
  /** 대기 상태 안내 컨테이너 (Clock + 텍스트) */
  waitingGuidance: 'flex items-center gap-2 text-sm text-brand-info',
  /** 대기 상태 안내 아이콘 */
  waitingGuidanceIcon: 'h-4 w-4 text-brand-info flex-shrink-0',
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
  description: `${MICRO_TYPO.detail} text-muted-foreground mt-1 leading-relaxed`,
  date: `${MICRO_TYPO.meta} text-brand-critical/70 mt-1.5`,
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
  base: `font-semibold tabular-nums ${MICRO_TYPO.detail}`,
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
  /** collapsible 섹션 내부용 — 과도한 공백 방지 */
  collapsible: 'text-center py-6',
  icon: 'h-12 w-12 text-muted-foreground',
  title: 'text-base font-medium tracking-tight text-foreground mt-4',
  description: 'text-sm text-muted-foreground mt-1 leading-relaxed',
  /** hasFilters=false 시 워크플로우 진입 CTA 래퍼 */
  ctaWrapper: 'mt-4 flex flex-col items-center gap-2',
  /** 장비 목록 진입 링크 */
  ctaLink: 'text-sm text-brand-info hover:underline',
} as const;

// ============================================================================
// 16. NC_SPACING_TOKENS — 리스트 페이지 섹션 간격 리듬
// ============================================================================

/**
 * NC 리스트/상세 페이지 섹션별 간격 리듬.
 * outer wrapper의 space-y-5가 기본 리듬을 담당하며,
 * 여기서는 특정 섹션에 의미 있는 추가 강조가 필요한 경우만 정의한다.
 */
export const NC_SPACING_TOKENS = {
  /** 헤더 → KPI 간격: space-y-5보다 넓어 섹션 경계를 시각화 */
  afterHeader: 'mt-6',
  detail: {
    /** 페이지 최상위 wrapper — 그룹 경계는 mt-* 처리하므로 space-y-0 */
    pageWrapper: 'space-y-0',
    /** 그룹 1 (상태 파악): Header + RejectionAlert + Timeline + GuidanceCallout */
    statusGroup: getSectionRhythm('tight'),
    /** 그룹 1 → 2 경계 */
    statusToContextGap: 'mt-8',
    /** 그룹 2 (컨텍스트): InfoCards + Collapsibles + Docs */
    contextGroup: getSectionRhythm('comfortable'),
    /** 그룹 2 → 3 경계 (액션 직전) */
    contextToActionGap: 'mt-6',
    /** GuidanceCallout과 compact Timeline 사이 간격 (statusGroup space-y-3로 처리) */
    calloutTimelineGap: 'mt-3',
  },
} as const;

// ============================================================================
// 17. NC_MOTION — 모션 프리셋
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
// 18. NC_PAGINATION_TOKENS — 페이지네이션
// ============================================================================

export const NC_PAGINATION_TOKENS = {
  container: 'flex items-center justify-between py-3 text-sm text-muted-foreground',
  info: 'tabular-nums',
  buttons: 'flex gap-1',
  pageButton: [
    'w-8 h-8 flex items-center justify-center rounded-md',
    `border border-border/60 text-muted-foreground tabular-nums ${MICRO_TYPO.detail}`,
    'hover:bg-muted hover:text-foreground',
    TRANSITION_PRESETS.fastBgColor,
  ].join(' '),
  pageButtonActive: 'bg-primary text-primary-foreground border-transparent hover:bg-primary/90',
} as const;

// ============================================================================
// 20. NC_WORKFLOW_GUIDANCE_TOKENS — 상태×역할 다음 단계 가이던스 매트릭스
// ============================================================================

export type NCGuidanceStatusKey =
  | 'open'
  | 'openRejected'
  | 'openBlockedRepair'
  | 'openBlockedRecalibration'
  | 'corrected'
  | 'closed';

export type NCGuidanceRole = 'operator' | 'manager' | 'quality_manager' | 'all';

/** 모든 가능한 조합. 실제 도달 가능한 키는 NCGuidanceKeyReachable 사용. */
export type NCGuidanceKey = `${NCGuidanceStatusKey}_${NCGuidanceRole}`;

/**
 * resolveNCGuidanceKey가 실제로 반환하는 12개 키.
 * NC_WORKFLOW_GUIDANCE_TOKENS 인덱싱 및 컴포넌트 prop에 이 타입을 사용한다.
 */
export type NCGuidanceKeyReachable =
  | `${'open' | 'openRejected' | 'openBlockedRepair' | 'openBlockedRecalibration' | 'corrected'}_${'operator' | 'manager'}`
  | 'openBlockedRecalibration_quality_manager'
  | 'closed_all';

export interface NCGuidanceEntry {
  variant: CalloutVariant;
  emphasis: CalloutEmphasis;
  icon: 'AlertTriangle' | 'Wrench' | 'Clock' | 'CheckCircle2' | 'Lock' | 'ShieldCheck';
  stepBadgeKey: 'one' | 'two' | 'three';
  ctaKind: 'primary' | 'repairLink' | 'calibrationLink' | 'none';
  scrollTarget?: 'actionBar' | 'infoRepairCard';
  /**
   * Role chip — "누구의 차례인가"를 variant 색과 독립적으로 전달.
   * GuidanceCallout에서 step badge 옆에 렌더. i18n 키: detail.guidance.roleChip.{key}
   */
  roleChip: RoleChipKey;
}

export const NC_WORKFLOW_GUIDANCE_TOKENS = {
  open_operator: {
    variant: 'warning',
    emphasis: 'leftBorder',
    icon: 'AlertTriangle',
    stepBadgeKey: 'one',
    ctaKind: 'primary',
    scrollTarget: 'actionBar',
    roleChip: 'my-turn',
  },
  open_manager: {
    variant: 'info',
    emphasis: 'leftBorder',
    icon: 'Clock',
    stepBadgeKey: 'one',
    ctaKind: 'none',
    roleChip: 'waiting',
  },
  openRejected_operator: {
    variant: 'warning',
    emphasis: 'leftBorder',
    icon: 'AlertTriangle',
    stepBadgeKey: 'one',
    ctaKind: 'primary',
    scrollTarget: 'actionBar',
    roleChip: 'my-turn',
  },
  openRejected_manager: {
    variant: 'info',
    emphasis: 'leftBorder',
    icon: 'Clock',
    stepBadgeKey: 'one',
    ctaKind: 'none',
    roleChip: 'waiting',
  },
  openBlockedRepair_operator: {
    variant: 'critical',
    emphasis: 'leftBorder',
    icon: 'Wrench',
    stepBadgeKey: 'one',
    ctaKind: 'repairLink',
    scrollTarget: 'infoRepairCard',
    roleChip: 'blocked',
  },
  openBlockedRepair_manager: {
    variant: 'critical',
    emphasis: 'leftBorder',
    icon: 'Wrench',
    stepBadgeKey: 'one',
    ctaKind: 'none',
    roleChip: 'blocked',
  },
  openBlockedRecalibration_operator: {
    variant: 'critical',
    emphasis: 'leftBorder',
    icon: 'Wrench',
    stepBadgeKey: 'one',
    ctaKind: 'calibrationLink',
    roleChip: 'blocked',
  },
  openBlockedRecalibration_manager: {
    variant: 'critical',
    emphasis: 'leftBorder',
    icon: 'Wrench',
    stepBadgeKey: 'one',
    ctaKind: 'none',
    roleChip: 'blocked',
  },
  openBlockedRecalibration_quality_manager: {
    variant: 'critical',
    emphasis: 'leftBorder',
    icon: 'Wrench',
    stepBadgeKey: 'one',
    ctaKind: 'none',
    roleChip: 'blocked',
  },
  corrected_operator: {
    variant: 'info',
    emphasis: 'leftBorder',
    icon: 'Clock',
    stepBadgeKey: 'two',
    ctaKind: 'none',
    roleChip: 'waiting',
  },
  corrected_manager: {
    variant: 'warning',
    emphasis: 'leftBorder',
    icon: 'ShieldCheck',
    stepBadgeKey: 'two',
    ctaKind: 'primary',
    scrollTarget: 'actionBar',
    roleChip: 'approval',
  },
  closed_all: {
    variant: 'ok',
    emphasis: 'leftBorder',
    icon: 'Lock',
    stepBadgeKey: 'three',
    ctaKind: 'none',
    roleChip: 'done',
  },
} as const satisfies Record<NCGuidanceKeyReachable, NCGuidanceEntry>;

export function resolveNCGuidanceKey(args: {
  status: NonConformanceStatus;
  canCloseNC: boolean;
  needsRepair: boolean;
  needsRecalibration: boolean;
  hasRejection: boolean;
  canCreateCalibration?: boolean;
}): NCGuidanceKeyReachable {
  const {
    status,
    canCloseNC,
    needsRepair,
    needsRecalibration,
    hasRejection,
    canCreateCalibration,
  } = args;
  const role: NCGuidanceRole = canCloseNC ? 'manager' : 'operator';
  if (status === 'closed') return 'closed_all';
  if (status === 'corrected') return `corrected_${role}`;
  if (needsRepair) return `openBlockedRepair_${role}`;
  if (needsRecalibration) {
    if (!canCloseNC && canCreateCalibration === false)
      return 'openBlockedRecalibration_quality_manager';
    return `openBlockedRecalibration_${role}`;
  }
  if (hasRejection) return `openRejected_${role}`;
  return `open_${role}`;
}

/**
 * NC Guidance CTA 버튼 토큰
 *
 * GuidanceCallout의 CTA 버튼 스타일 — ctaKind에 따라 분기.
 *   primary       → solid button (variant별 배경색 + 흰 텍스트) — "지금 할 일" 강조
 *   repair/calibrationLink → outlined — 전제조건 이동 (파괴적 아님, 주목도 낮춤)
 *
 * 동적 보간(`bg-brand-${variant}`) 금지 원칙에 따라 `getSemanticSolidBgClasses` 경유.
 *
 * Performance: primarySolid는 모듈 초기화 시 사전 생성 (5 variant) — 매 렌더 string concat 없음.
 */
const NC_GUIDANCE_CTA_BASE = [
  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold',
  'hover:brightness-110',
  TRANSITION_PRESETS.fastBg,
].join(' ');

const NC_GUIDANCE_CTA_PRIMARY_SOLID = {
  info: `${NC_GUIDANCE_CTA_BASE} ${getSemanticSolidBgClasses('info')}`,
  warning: `${NC_GUIDANCE_CTA_BASE} ${getSemanticSolidBgClasses('warning')}`,
  critical: `${NC_GUIDANCE_CTA_BASE} ${getSemanticSolidBgClasses('critical')}`,
  ok: `${NC_GUIDANCE_CTA_BASE} ${getSemanticSolidBgClasses('ok')}`,
  neutral: `${NC_GUIDANCE_CTA_BASE} ${getSemanticSolidBgClasses('neutral')}`,
} as const satisfies Record<CalloutVariant, string>;

export const NC_GUIDANCE_CTA_TOKENS = {
  /** ctaKind='primary' — variant별 solid button (사전 생성 O(1) 룩업) */
  primarySolid: (v: CalloutVariant): string => NC_GUIDANCE_CTA_PRIMARY_SOLID[v],
  /** ctaKind='repairLink' | 'calibrationLink' — outlined secondary */
  secondaryOutlined: [
    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm',
    'border border-border hover:bg-muted/50',
    TRANSITION_PRESETS.fastBg,
  ].join(' '),
} as const;

export const NC_GUIDANCE_STEP_BADGE_TOKENS = {
  base: [
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
    `${MICRO_TYPO.badge} font-semibold tabular-nums`,
  ].join(' '),
  variant: {
    info: 'bg-brand-info/10 text-brand-info',
    warning: 'bg-brand-warning/10 text-brand-warning',
    critical: 'bg-brand-critical/10 text-brand-critical',
    ok: 'bg-brand-ok/10 text-brand-ok',
    neutral: 'bg-muted text-muted-foreground',
  } satisfies Record<CalloutVariant, string>,
  /** step badge + role chip 행 레이아웃 */
  chipRow: 'flex items-center gap-2 mb-1 flex-wrap',
} as const;

// ============================================================================
// 22. NC_REJECTION_BADGE_TOKENS — 반려 배지 (리스트 행)
// ============================================================================

export const NC_REJECTION_BADGE_TOKENS = {
  badge: [
    `inline-flex items-center px-1.5 py-0.5 rounded ${MICRO_TYPO.badge} font-medium`,
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
      `inline-flex items-center px-2 py-0.5 rounded-full ${MICRO_TYPO.meta} font-medium`,
      getSemanticContainerColorClasses('ok'),
      'text-brand-ok',
    ].join(' '),
    partial: [
      `inline-flex items-center px-2 py-0.5 rounded-full ${MICRO_TYPO.meta} font-medium`,
      getSemanticContainerColorClasses('warning'),
      'text-brand-warning',
    ].join(' '),
    failed: [
      `inline-flex items-center px-2 py-0.5 rounded-full ${MICRO_TYPO.meta} font-medium`,
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

// ============================================================================
// 25. NC_DOCUMENTS_SECTION_TOKENS — 첨부 문서 섹션
// ============================================================================

/**
 * NC 첨부 문서 섹션 토큰 (NCDocumentsSection)
 *
 * 기존 raw Tailwind 직접 사용 제거 — NC_*_TOKENS 체계 일관성 확보
 */
export const NC_DOCUMENTS_SECTION_TOKENS = {
  container: `rounded-lg border border-border/60 bg-card p-4 space-y-3 ${ELEVATION_TOKENS.surface.raised}`,
  header: 'flex items-center justify-between',
  title: 'text-sm font-semibold flex items-center gap-2',
  titleIcon: 'h-4 w-4',
  countBadge: 'text-xs text-muted-foreground font-normal',
  emptyText: 'text-sm text-muted-foreground',
  grid: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3',
  toggleGroup: 'inline-flex border rounded-md overflow-hidden text-xs',
  /** 뷰 전환 버튼 기본 (첫 번째/두 번째 공용) */
  toggleButtonBase: [
    'px-2 py-1 inline-flex items-center gap-1',
    TRANSITION_PRESETS.fastBgColor,
  ].join(' '),
  /** 뷰 전환 버튼 활성 상태 */
  toggleButtonActive: 'bg-muted font-semibold',
  listRow:
    'grid grid-cols-[40px_1fr_90px_110px_32px] gap-3 items-center px-3 py-2.5 hover:bg-muted/30',
  deleteButton: [
    'w-8 h-8 flex items-center justify-center rounded-md',
    'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
    TRANSITION_PRESETS.fastBgColor,
  ].join(' '),
  gridItem: 'group relative space-y-1',
} as const;

// ============================================================================
// NC_DIALOG_TOKENS — NCEditDialog / NCRepairDialog 공용 토큰
// ============================================================================

/**
 * NC 다이얼로그 공용 토큰 (Edit + Repair)
 * - changeSummaryModified: 변경 요약 카드 "수정됨" 강조 텍스트
 * - repairSubmit: 수리 등록 확인 단계 "등록" 버튼 색상 오버라이드
 */
export const NC_DIALOG_TOKENS = {
  changeSummaryModified: `${getSemanticContainerTextClasses('ok')} font-semibold`,
  repairSubmit: `${getSemanticSolidBgClasses('ok')} text-white hover:brightness-110`,
} as const;
