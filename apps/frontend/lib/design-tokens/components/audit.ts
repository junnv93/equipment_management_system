/**
 * Audit Component Tokens (Layer 3: Component-Specific)
 *
 * 감사로그 컴포넌트의 모든 디자인 값을 정의하는 SSOT
 * - 12개 액션별 배지 스타일 (brand CSS 변수 기반 → 다크모드 자동 지원)
 * - 테이블/상세/Diff/엔티티 링크/빈 상태/페이지네이션 스타일
 * - 필터 바 / 헤더 토큰 (Layer 3 확장)
 * - Motion system (specific property transitions, no transition-all)
 * - Responsive breakpoints (Summary grid, Sheet width)
 * - WCAG minimum font size compliance (≥11px)
 */

import { type AuditAction } from '@equipment-management/schemas';
import { FOCUS_TOKENS } from '../semantic';
import { TRANSITION_PRESETS } from '../motion';
import { getSemanticBadgeClasses } from '../brand';
import { PAGE_HEADER_TOKENS } from './page-layout';

// ============================================================================
// 1. Audit Action Badge Tokens (12개 액션 색상)
// ============================================================================

/**
 * 액션별 배지 스타일
 *
 * brand CSS 변수 기반으로 다크모드를 자동 지원합니다.
 * getSemanticBadgeClasses()는 brand.ts의 CSS 변수를 사용합니다.
 *
 * 4색 체계 (사용자 요청):
 *   CREATE  → ok(초록)
 *   UPDATE  → info(파랑)
 *   DELETE  → critical(빨강)
 *   APPROVE → purple(보라)
 *
 * CRITICAL: 키 이름 변경 금지 (AuditLogDetailDialog, AuditLogsContent 공용)
 */
export const AUDIT_ACTION_BADGE_TOKENS: Record<AuditAction, string> = {
  create: getSemanticBadgeClasses('ok'),
  update: getSemanticBadgeClasses('info'),
  delete: getSemanticBadgeClasses('critical'),
  approve: getSemanticBadgeClasses('purple'),
  reject: getSemanticBadgeClasses('warning'),
  checkout: getSemanticBadgeClasses('purple'),
  return: getSemanticBadgeClasses('ok'),
  cancel: getSemanticBadgeClasses('neutral'),
  login: getSemanticBadgeClasses('info'),
  logout: getSemanticBadgeClasses('neutral'),
  close: getSemanticBadgeClasses('neutral'),
  reject_correction: getSemanticBadgeClasses('critical'),
};

/**
 * 기본 액션 배지 (알 수 없는 액션)
 */
export const DEFAULT_AUDIT_ACTION_BADGE = getSemanticBadgeClasses('neutral');

// ============================================================================
// 2. Audit Table Tokens (테이블 스타일)
// ============================================================================

/**
 * 감사로그 테이블 스타일
 */
export const AUDIT_TABLE_TOKENS = {
  /** Row hover + focus (interactive) */
  rowInteractive: [
    'cursor-pointer',
    'hover:bg-muted/50',
    TRANSITION_PRESETS.instantBg,
    FOCUS_TOKENS.classes.default,
  ].join(' '),

  /** Timestamp column (mono font + tabular-nums + muted color) */
  timestamp: 'font-mono text-xs tabular-nums text-brand-text-muted',

  /** IP Address column */
  ipAddress: 'font-mono text-xs text-brand-text-muted tabular-nums',

  /** Numeric content (tabular-nums for alignment) */
  numeric: 'tabular-nums',
} as const;

// ============================================================================
// 3. Audit Diff Tokens (변경 사항 Diff Viewer)
// ============================================================================

/**
 * Diff Viewer 스타일 (변경 전후 비교)
 */
export const AUDIT_DIFF_TOKENS = {
  /** 삭제된 값 (빨강) */
  removed: 'bg-brand-critical/10',

  /** 추가된 값 (초록) */
  added: 'bg-brand-ok/10',

  /** Empty state */
  empty: 'text-center py-8 text-muted-foreground',
} as const;

// ============================================================================
// 4. Audit Entity Link Tokens (엔티티 링크)
// ============================================================================

/**
 * 엔티티 링크 스타일 (EntityLinkCell 컴포넌트)
 */
export const AUDIT_ENTITY_LINK_TOKENS = {
  /** 활성 링크 (hover 포함) */
  link: [
    'text-brand-info',
    'hover:text-brand-info/80',
    'hover:underline',
    TRANSITION_PRESETS.fastColor,
  ].join(' '),

  /** 비활성 (라우팅 불가능한 엔티티) */
  inactive: 'text-muted-foreground',
} as const;

// ============================================================================
// 5. Audit Detail Tokens (상세 다이얼로그)
// ============================================================================

/**
 * 감사로그 상세 다이얼로그 스타일
 */
export const AUDIT_DETAIL_TOKENS = {
  /** 코드 블록 배경 (추가 정보 섹션) */
  codeBlock: 'bg-muted/50 dark:bg-muted/30 rounded-md',

  /** Mono font (ID, IP, 메타데이터) */
  mono: 'font-mono text-xs',
} as const;

// ============================================================================
// 6. Audit Empty State Tokens (빈 상태)
// ============================================================================

/**
 * 빈 상태 스타일
 */
export const AUDIT_EMPTY_STATE_TOKENS = {
  /** 전체 컨테이너 */
  container: 'text-center py-16 text-brand-text-muted',

  /** 아이콘 */
  icon: 'h-10 w-10 mx-auto mb-3 opacity-30',

  /** 텍스트 */
  text: 'text-sm',
} as const;

// ============================================================================
// 7. Audit Pagination Tokens (페이지네이션)
// ============================================================================

/**
 * 페이지네이션 스타일
 */
export const AUDIT_PAGINATION_TOKENS = {
  /** 페이지 정보 텍스트 (tabular-nums for alignment) */
  info: 'text-xs text-brand-text-muted tabular-nums font-mono',

  /** 현재 페이지 번호 (tabular-nums for alignment) */
  pageNumber: 'text-xs tabular-nums font-mono text-brand-text-muted',
} as const;

// ============================================================================
// 8. Audit Motion (애니메이션)
// ============================================================================

/**
 * 감사로그 모션 토큰
 *
 * Web Interface Guidelines 준수: specific property transitions, no transition-all
 */
export const AUDIT_MOTION = {
  /** 테이블 row hover: 배경색만 전환 */
  rowHover: TRANSITION_PRESETS.instantBg,

  /** 엔티티 링크 색상 전환 */
  linkColor: TRANSITION_PRESETS.fastColor,

  /** 새로고침 버튼 회전 */
  refreshSpin: 'motion-safe:animate-spin',
} as const;

/**
 * Refetch Overlay는 Layer 2 (semantic.ts)로 승격됨.
 * → import { REFETCH_OVERLAY_TOKENS } from '@/lib/design-tokens';
 * 모든 리스트 페이지에서 공통으로 사용.
 */

// ============================================================================
// 9. Audit Summary Bar Tokens (액션별 요약 바)
// ============================================================================

/**
 * 요약 바 그리드 레이아웃
 *
 * 좌측 색상 라인 패턴: 승인/반출/부적합/장비 KPI 카드와 동일
 * (이전 상단 stripe → 좌측 border-l 통일)
 */
export const AUDIT_SUMMARY_TOKENS = {
  /** 반응형 그리드: 모바일 2열 → 태블릿 3열 → 데스크탑 5열 */
  grid: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3',

  /** 액션 라벨 */
  label: 'text-xs font-medium text-brand-text-muted',

  /** 총 건수 (전체 카드에만) — tabular-nums로 숫자 정렬, font-sans 유지 */
  count: 'text-xl font-bold tabular-nums tracking-tight',

  /** 서브 라벨 (WCAG: ≥11px) */
  sublabel: 'text-[11px] text-brand-text-muted mt-0.5',

  /** 로딩 중 액션 배지 폴백 (summary 미제공 시) — 기존 인라인 하드코딩 토큰화 */
  fallbackBadge: 'text-[11px] px-1.5 py-0.5 self-start mt-0.5',

  /** 건수 로딩 플레이스홀더 (summary 미제공 시 "—" 표시용) */
  loadingPlaceholder: 'opacity-30',
} as const;

/**
 * 색상 체계: 액션 타입별 (leftBorder + count 색상)
 *
 * leftBorder: 좌측 3px 라인 색상 (border-l-brand-*)
 * count: 건수 텍스트 색상
 */
export const AUDIT_SUMMARY_COLOR_MAP = {
  all: { leftBorder: 'border-l-brand', count: 'text-brand-text-primary' },
  create: { leftBorder: 'border-l-brand-ok', count: 'text-brand-ok' },
  update: { leftBorder: 'border-l-brand-info', count: 'text-brand-info' },
  delete: { leftBorder: 'border-l-brand-critical', count: 'text-brand-critical' },
  approve: { leftBorder: 'border-l-brand-purple', count: 'text-brand-purple' },
} as const;

/**
 * 요약 카드 클래스 생성 (active / inactive)
 */
/**
 * 활성/비활성 배경색 맵
 *
 * 활성 상태에서 해당 색상의 연한 배경을 적용하여
 * border + stripe만으로는 부족한 시각적 구분력을 강화합니다.
 */
const SUMMARY_ACTIVE_BG: Record<keyof typeof AUDIT_SUMMARY_COLOR_MAP, string> = {
  all: 'bg-brand/[0.06]',
  create: 'bg-brand-ok/[0.06]',
  update: 'bg-brand-info/[0.06]',
  delete: 'bg-brand-critical/[0.06]',
  approve: 'bg-brand-purple/[0.06]',
};

export function getAuditSummaryCardClasses(
  isActive: boolean,
  color: keyof typeof AUDIT_SUMMARY_COLOR_MAP
): string {
  const base = [
    'flex flex-col gap-0.5 p-4 rounded-lg border border-l-4 text-left cursor-pointer',
    AUDIT_SUMMARY_COLOR_MAP[color].leftBorder,
    TRANSITION_PRESETS.instantBgBorder,
    FOCUS_TOKENS.classes.default,
  ].join(' ');

  const borderActive: Record<keyof typeof AUDIT_SUMMARY_COLOR_MAP, string> = {
    all: 'border-brand/40',
    create: 'border-brand-ok/40',
    update: 'border-brand-info/40',
    delete: 'border-brand-critical/40',
    approve: 'border-brand-purple/40',
  };

  return isActive
    ? `${base} ${SUMMARY_ACTIVE_BG[color]} ${borderActive[color]} shadow-sm`
    : `${base} bg-brand-bg-surface border-brand-border-subtle hover:border-brand-border-default hover:bg-brand-bg-elevated`;
}

// ============================================================================
// 10. Audit Timeline Tokens (타임라인 피드)
// ============================================================================

/**
 * 날짜 그룹 헤더 스타일
 */
export const AUDIT_TIMELINE_TOKENS = {
  /** 타임라인 피드 외부 컨테이너 카드 */
  container: 'rounded-lg border border-brand-border-subtle bg-brand-bg-surface p-4',

  /**
   * 그룹 헤더 행 (sticky)
   *
   * ⚠️ bg-brand-bg-surface: 타임라인 피드는 항상 bg-brand-bg-surface 카드 내부에
   * 렌더링되므로 bg-brand-bg-page가 아닌 bg-brand-bg-surface를 사용해야 함.
   * sticky 헤더 배경이 컨테이너 배경과 일치해야 시각적 일관성 보장.
   */
  groupHeader: 'flex items-center gap-3 py-2 sticky top-0 z-10 bg-brand-bg-surface',

  /** 날짜 라벨 */
  /** 날짜 라벨 — "오늘", "어제" 등 한국어 텍스트이므로 font-sans 유지 */
  groupDate: 'text-[11px] font-bold text-brand-text-muted tracking-widest uppercase shrink-0',

  /** 구분선 */
  groupLine: 'flex-1 h-px bg-brand-border-subtle',

  /** 건수 배지 (WCAG: ≥11px) */
  /** 건수 배지 — "3건" 등 한글 포함이므로 font-sans, 숫자만 tabular-nums */
  groupCount: [
    'text-[11px] tabular-nums text-brand-text-muted shrink-0',
    'px-2 py-0.5 rounded-full border border-brand-border-subtle bg-brand-bg-elevated',
  ].join(' '),

  /** 엔트리 컨테이너 */
  entries: 'flex flex-col gap-0.5',

  /** 빈 상태 (border + rounded-lg 포함 — 컨테이너 카드 내부에서 독립 표시) */
  emptyState:
    'text-center py-16 text-brand-text-muted border border-brand-border-subtle rounded-lg',

  /** 단일 엔트리 (3열 그리드: time | spine | content)
   *
   * ✅ `relative`는 ChevronRight absolute 포지셔닝의 기준점이므로 필수.
   * ✅ `group`은 호버 화살표의 group-hover 클래스를 위해 필수.
   */
  entry: [
    'grid gap-x-3 px-3 py-2.5 rounded-lg cursor-pointer group relative',
    'hover:bg-brand-bg-elevated',
    TRANSITION_PRESETS.instantBg,
    FOCUS_TOKENS.classes.default,
  ].join(' '),

  /** 엔트리 grid template columns — 시간 | 스파인 | 콘텐츠 */
  entryGridCols: '56px 16px 1fr' as const,

  /** 시간 컬럼 */
  time: 'font-mono text-[11px] text-brand-text-muted pt-0.5 text-right tabular-nums leading-none',

  /**
   * 스파인 (점 + 연결선)
   *
   * dot ring: bg-brand-bg-surface와 일치 (컨테이너 배경색과 동일해야 ring이 자연스러움)
   */
  spineWrapper: 'flex flex-col items-center',
  dot: 'w-2 h-2 rounded-full mt-1 ring-2 ring-brand-bg-surface shrink-0',
  line: 'w-px flex-1 bg-brand-border-subtle mt-1',

  /** 본문 컬럼 */
  contentWrapper: 'min-w-0 pb-0.5',
  mainRow: 'flex items-baseline flex-wrap gap-1.5',
  actor: 'text-[13px] font-semibold text-brand-text-primary leading-none',
  targetText: 'text-[12px] text-brand-text-secondary',
  targetId: 'font-semibold',
  entityBadge: [
    'inline-flex items-center px-1.5 py-0.5 text-[11px] rounded-md border',
    'border-brand-border-subtle bg-brand-bg-elevated text-brand-text-muted',
  ].join(' '),

  /** 위험 액션(delete) 강조 배지 — 토큰화하여 인라인 하드코딩 제거 (WCAG: ≥11px) */
  dangerLabel: [
    'inline-flex items-center px-1.5 py-0.5 text-[11px] rounded-md font-semibold',
    'bg-brand-critical/10 text-brand-critical border border-brand-critical/20',
  ].join(' '),

  subRow: 'flex items-center flex-wrap gap-2.5 mt-1',
  subItem: 'flex items-center gap-1 text-[11px] text-brand-text-muted',
  subMono: 'font-mono text-[11px] text-brand-text-muted',

  /** 인라인 Diff 미리보기 */
  diffPreview: [
    'mt-1.5 px-2.5 py-1.5 rounded-lg border border-brand-border-subtle',
    'bg-brand-bg-elevated font-mono text-[11px] flex items-center gap-2 max-w-full overflow-hidden',
  ].join(' '),
  diffOld: 'text-brand-critical truncate shrink-0 max-w-[30%]',
  diffArrow: 'text-brand-text-muted shrink-0',
  diffNew: 'text-brand-ok truncate shrink-0 max-w-[40%]',

  /** 호버 시 오른쪽 화살표 (absolute — 부모 entry가 relative여야 함) */
  hoverArrow: [
    'absolute right-3 top-1/2 -translate-y-1/2',
    'opacity-0 group-hover:opacity-100 text-brand-text-muted',
    TRANSITION_PRESETS.instantOpacity,
  ].join(' '),

  /** 고위험(delete) 엔트리 강조 테두리 */
  dangerEntry: 'bg-brand-critical/[0.03] border border-brand-critical/10 rounded-lg',
} as const;

/**
 * 액션 타입별 dot 색상
 *
 * SSOT: AUDIT_ACTION_BADGE_TOKENS와 동일한 색상 시맨틱을 사용.
 * badge 색상과 dot 색상이 일치해야 시각적 일관성이 보장됨.
 *
 *   Badge getSemanticBadgeClasses('ok')     → dot bg-brand-ok
 *   Badge getSemanticBadgeClasses('info')   → dot bg-brand-info
 *   Badge getSemanticBadgeClasses('critical')→ dot bg-brand-critical
 *   Badge getSemanticBadgeClasses('purple') → dot bg-brand-purple
 *   Badge getSemanticBadgeClasses('warning')→ dot bg-brand-warning
 *   Badge getSemanticBadgeClasses('neutral')→ dot bg-brand-text-muted
 */
export const AUDIT_TIMELINE_DOT_COLORS: Record<string, string> = {
  create: 'bg-brand-ok',
  update: 'bg-brand-info',
  delete: 'bg-brand-critical',
  approve: 'bg-brand-purple',
  reject: 'bg-brand-warning',
  checkout: 'bg-brand-purple', // badge=purple과 일치 (기존: teal 불일치 수정)
  return: 'bg-brand-ok',
  cancel: 'bg-brand-text-muted',
  login: 'bg-brand-info',
  logout: 'bg-brand-text-muted',
  close: 'bg-brand-text-muted',
  reject_correction: 'bg-brand-critical',
};

// ============================================================================
// 11. Audit Detail Sheet Tokens (슬라이드 패널)
// ============================================================================

/**
 * 감사로그 상세 슬라이드 패널 스타일
 *
 * Radix Dialog 기반 Sheet 컴포넌트 사용.
 * - backdrop/positioning/animation/focus-trap → Sheet가 처리
 * - content: SheetContent의 className 오버라이드 (크기/테마/레이아웃)
 * - 이하 토큰: 패널 내부 레이아웃
 */
export const AUDIT_DETAIL_SHEET_TOKENS = {
  /**
   * SheetContent className 오버라이드
   *
   * Sheet 기본값(w-3/4, sm:max-w-sm, bg-background) 대신
   * 감사로그 패널에 맞는 크기/테마/레이아웃 적용.
   * position/z-index/animation/border-side는 Sheet가 처리하므로 미포함.
   */
  content: [
    'w-[480px] max-w-[95vw] sm:max-w-[480px] lg:w-[560px] lg:max-w-[560px] p-0',
    'bg-brand-bg-surface border-brand-border-subtle',
    'flex flex-col shadow-2xl',
  ].join(' '),

  /** 헤더 영역 */
  header: 'px-5 pt-5 pb-4 border-b border-brand-border-subtle flex-shrink-0',
  headerTop: 'flex items-center justify-between mb-3',
  headerLabel: 'text-[11px] font-bold text-brand-text-muted uppercase tracking-widest',
  closeBtn: [
    'w-7 h-7 rounded-md border border-brand-border-subtle bg-transparent',
    'flex items-center justify-center text-brand-text-muted',
    'hover:bg-brand-bg-elevated hover:text-brand-text-primary',
    TRANSITION_PRESETS.instantBgColor,
    FOCUS_TOKENS.classes.default,
  ].join(' '),
  actionRow: 'flex items-center gap-2',
  timestamp: 'font-mono text-[11px] text-brand-text-muted',

  /** 스크롤 본문 */
  body: 'flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4',

  /** 본문 빈 상태 (log === null, 애니메이션 중 빈 콘텐츠 방지) */
  bodyEmpty: 'flex-1 flex items-center justify-center text-brand-text-muted text-sm',

  /** 섹션 */
  sectionLabel: 'text-[11px] font-bold text-brand-text-muted uppercase tracking-widest mb-2',
  sectionCard: 'bg-brand-bg-elevated border border-brand-border-subtle rounded-xl overflow-hidden',
  row: 'flex items-start gap-2 px-3 py-2 text-sm',
  rowBorder: 'border-t border-brand-border-subtle',
  rowKey: 'text-[11px] text-brand-text-muted min-w-20 flex-shrink-0 pt-px',
  rowVal: 'text-[12px] text-brand-text-primary min-w-0 break-all',
  rowValMono: 'font-mono text-[11px] text-brand-text-secondary min-w-0 break-all',

  /** 하단 액션 바 */
  footer: 'px-5 py-3 border-t border-brand-border-subtle flex gap-2 flex-shrink-0',

  /** 링크 스타일 */
  link: ['text-brand-info hover:underline', TRANSITION_PRESETS.fastColor].join(' '),
} as const;

// ============================================================================
// 12. Audit Filter Tokens (필터 바 — 리디자인)
// ============================================================================

/**
 * 감사로그 필터 바 스타일
 *
 * 액션 타입 칩 + 보조 필터(엔티티/날짜/사용자)를 하나의 카드로 통합
 */
export const AUDIT_FILTER_TOKENS = {
  /** 전체 필터 카드 */
  bar: 'p-4 bg-brand-bg-surface border border-brand-border-subtle rounded-lg space-y-3',

  /** 필드 레이블 */
  fieldLabel: 'text-xs font-medium text-brand-text-muted',

  /** 액션 칩 Row */
  actionChipsRow: 'flex flex-wrap gap-1.5',

  /** 보조 필터 Row (날짜, 엔티티, 사용자) */
  secondaryRow: 'flex flex-wrap items-end gap-3 border-t border-brand-border-subtle pt-3',
} as const;

/**
 * 액션 타입 필터 칩 클래스 생성
 *
 * active 상태: elevated 배경 + default 테두리 + primary 텍스트
 * inactive 상태: subtle 테두리 + muted 텍스트 (hover 포함)
 */
export function getAuditActionChipClasses(active: boolean): string {
  const base = [
    'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border',
    TRANSITION_PRESETS.instantBgBorderColor,
    FOCUS_TOKENS.classes.default,
  ].join(' ');

  return active
    ? `${base} bg-brand-bg-elevated border-brand-border-default text-brand-text-primary shadow-sm`
    : `${base} border-brand-border-subtle text-brand-text-muted hover:border-brand-border-default hover:text-brand-text-primary`;
}

// ============================================================================
// 10. Audit Header Tokens (헤더 — 리디자인)
// ============================================================================

/**
 * 감사로그 페이지 헤더 스타일
 *
 * PAGE_HEADER_TOKENS 기반 확장 — 모듈 고유 배지/아이콘만 추가
 */
export const AUDIT_HEADER_TOKENS = {
  ...PAGE_HEADER_TOKENS,

  /** 타이틀 — PAGE_HEADER_TOKENS 기반 (아이콘 없음, 통일) */

  /** 스코프 부제목 (감사로그 전용 — brand-text-muted 사용) */
  subtitle: 'flex items-center gap-1.5 text-sm text-brand-text-muted mt-1',

  /** 총 건수 배지 — 한국어 텍스트 포함("총 N개의 로그")이므로 font-sans, 숫자만 tabular-nums */
  statsBadge:
    'tabular-nums text-xs bg-brand-bg-elevated border border-brand-border-subtle px-2.5 py-1.5 rounded-md text-brand-text-muted',

  /** 활성 필터 수 인디케이터 배지 */
  activeFilterBadge:
    'font-mono tabular-nums text-xs bg-brand-info/10 text-brand-info border border-brand-info/20 px-1.5 py-0.5 rounded-full',

  /** 타이틀 아이콘 (Shield 등) */
  titleIcon: 'h-5 w-5 text-brand-text-muted shrink-0',
} as const;

/**
 * 감사로그 필터 리셋 버튼 스타일
 */
export const AUDIT_FILTER_RESET_TOKENS = {
  button: 'h-8 text-xs text-brand-text-muted hover:text-brand-text-primary',
} as const;

/**
 * 테이블 헤더 행 스타일
 * (기존: TableRow에 인라인 className → 토큰 통합)
 */
export const AUDIT_TABLE_HEADER_ROW =
  'bg-brand-bg-elevated hover:bg-brand-bg-elevated border-b border-brand-border-subtle';
