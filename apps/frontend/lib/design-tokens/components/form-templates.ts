/**
 * Form Templates 컴포넌트 Design Token
 *
 * Layer 3 (Component): 즉시 사용 가능한 클래스 조합
 * Layer 2 (Semantic) 참조: INTERACTIVE_TOKENS, MOTION_TOKENS, FOCUS_TOKENS
 *
 * SSOT 역할:
 * - FORM_TEMPLATES_HEADER_TOKENS: 페이지 헤더
 * - FORM_TEMPLATES_STATS_TOKENS: 요약 통계 strip
 * - FORM_TEMPLATES_TABLE_TOKENS: 양식 테이블
 * - FORM_TEMPLATES_STATUS_TOKENS: 등록/미등록 상태 표현
 * - FORM_TEMPLATES_EMPTY_STATE_TOKENS: 빈 상태
 * - FORM_TEMPLATES_ERROR_STATE_TOKENS: 에러 상태
 * - FORM_TEMPLATES_HISTORY_TOKENS: 이력 다이얼로그
 * - FORM_TEMPLATES_UPLOAD_TOKENS: 업로드 다이얼로그
 * - FORM_TEMPLATES_MOTION: 모션 프리셋
 */

import { TRANSITION_PRESETS } from '../motion';
import {
  getSemanticBadgeClasses,
  getSemanticDotClasses,
  getSemanticStatusClasses,
  getSemanticContainerClasses,
} from '../brand';
import { FOCUS_TOKENS } from '../semantic';
import { PAGE_HEADER_TOKENS } from './page-layout';

// ─────────────────────────────────────────────────────────────────────────────
// 1. 페이지 헤더
// ─────────────────────────────────────────────────────────────────────────────

export const FORM_TEMPLATES_HEADER_TOKENS = {
  ...PAGE_HEADER_TOKENS,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 2. 요약 통계 strip
// ─────────────────────────────────────────────────────────────────────────────

export const FORM_TEMPLATES_STATS_TOKENS = {
  /** 가로 배치 (3열) */
  grid: 'grid grid-cols-3 gap-3',

  /** 개별 stat 카드 */
  card: [
    'flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card',
    TRANSITION_PRESETS.fastShadowBorder,
    'hover:shadow-sm hover:border-border/80',
  ].join(' '),

  /** 아이콘 컨테이너 */
  iconContainer: 'h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0',

  /** 아이콘 배경 변형 */
  iconBg: {
    total: getSemanticStatusClasses('info'),
    registered: getSemanticStatusClasses('ok'),
    unregistered: getSemanticStatusClasses('warning'),
  } as Record<string, string>,

  /** 라벨 */
  label: 'text-xs text-muted-foreground font-medium',

  /** 값 */
  value: 'text-xl font-bold tabular-nums text-foreground leading-none',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 3. 상태 표현 (등록/미등록)
// ─────────────────────────────────────────────────────────────────────────────

export const FORM_TEMPLATES_STATUS_TOKENS = {
  /** 등록 완료 상태 */
  registered: {
    badge: getSemanticBadgeClasses('ok'),
    dot: getSemanticDotClasses('ok'),
  },

  /** 미등록 상태 */
  unregistered: {
    badge: getSemanticBadgeClasses('warning'),
    dot: getSemanticDotClasses('warning'),
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 4. 양식 테이블
// ─────────────────────────────────────────────────────────────────────────────

export const FORM_TEMPLATES_TABLE_TOKENS = {
  /** 테이블 외부 컨테이너 — raised elevation */
  container:
    'rounded-lg border border-brand-border-subtle bg-brand-bg-surface overflow-hidden shadow-sm',

  /** 헤더 행 — sticky 대응 */
  headerRow: 'bg-muted/50 border-b-2 border-brand-border-default',

  /** 헤더 셀 */
  headerCell: 'text-xs font-semibold uppercase tracking-wider text-muted-foreground',

  /** Row hover — 좌측 accent bar (inset box-shadow) */
  rowHover: [
    'hover:bg-brand-info/[0.03] hover:shadow-[inset_3px_0_0_hsl(var(--brand-color-info))]',
    'dark:hover:bg-brand-info/[0.06]',
    TRANSITION_PRESETS.instantBg,
  ].join(' '),

  /** 짝수 행 stripe */
  rowStripe: 'even:bg-muted/30 dark:even:bg-muted/10',

  /** 양식 번호 (mono font — 코드 스타일 강조) */
  formNumber: 'font-mono font-medium text-sm tabular-nums',

  /** 버전 표시 */
  version: 'font-mono text-xs tabular-nums',

  /** 날짜 표시 */
  date: 'text-xs text-muted-foreground tabular-nums',

  /** 파일명 (truncate) */
  filename: 'max-w-[200px] truncate text-sm',

  /** 액션 버튼 그룹 */
  actionGroup: 'flex items-center justify-end gap-1',

  /** 개별 액션 버튼 */
  actionBtn: [
    'inline-flex items-center gap-1.5 text-xs',
    TRANSITION_PRESETS.fastBgColor,
    FOCUS_TOKENS.classes.default,
  ].join(' '),

  /** 상태 dot (등록/미등록 인라인 표시) */
  statusDot: 'inline-block h-2 w-2 rounded-full flex-shrink-0',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 5. 빈 상태
// ─────────────────────────────────────────────────────────────────────────────

export const FORM_TEMPLATES_EMPTY_STATE_TOKENS = {
  container: 'flex flex-col items-center justify-center py-16 text-center',
  icon: 'h-12 w-12 text-muted-foreground/30 mb-4',
  title: 'text-base font-semibold text-muted-foreground',
  description: 'text-sm text-muted-foreground/70 mt-1 max-w-[320px]',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 6. 에러 상태
// ─────────────────────────────────────────────────────────────────────────────

export const FORM_TEMPLATES_ERROR_STATE_TOKENS = {
  container: [
    'flex flex-col items-center justify-center py-16 text-center',
    getSemanticContainerClasses('critical'),
  ].join(' '),
  icon: 'h-12 w-12 text-brand-critical/60 mb-4',
  title: 'text-base font-semibold text-foreground',
  description: 'text-sm text-muted-foreground mt-1',
  retryBtn: ['mt-4 inline-flex items-center gap-2', TRANSITION_PRESETS.fastBg].join(' '),
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 7. 이력 다이얼로그
// ─────────────────────────────────────────────────────────────────────────────

export const FORM_TEMPLATES_HISTORY_TOKENS = {
  /** 테이블 컨테이너 */
  tableContainer: 'rounded-md border overflow-hidden',

  /** 헤더 행 */
  headerRow: 'bg-muted/50',

  /** Body 행 */
  bodyRow: [
    'border-b border-border last:border-b-0',
    TRANSITION_PRESETS.fastBg,
    'hover:bg-muted/30',
  ].join(' '),

  /** 활성 버전 배지 */
  activeBadge: getSemanticBadgeClasses('ok'),

  /** 이전 버전 배지 */
  inactiveBadge: getSemanticBadgeClasses('neutral'),

  /** 버전 번호 */
  version: 'font-mono text-sm tabular-nums font-medium',

  /** 파일명 */
  filename: 'max-w-[220px] truncate text-sm',

  /** 날짜 */
  date: 'text-sm text-muted-foreground tabular-nums',

  /** 빈 상태 */
  empty: 'py-8 text-center text-sm text-muted-foreground',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 8. 업로드 다이얼로그
// ─────────────────────────────────────────────────────────────────────────────

export const FORM_TEMPLATES_UPLOAD_TOKENS = {
  /** 파일 선택 드롭존 */
  dropzone: [
    'w-full flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-8',
    'cursor-pointer',
    TRANSITION_PRESETS.fastBgBorder,
    'hover:border-primary/50 hover:bg-primary/[0.02]',
    FOCUS_TOKENS.classes.default,
  ].join(' '),

  /** 드롭존 활성 상태 (파일 선택됨) */
  dropzoneActive: 'border-primary/50 bg-primary/[0.03]',

  /** 드롭존 아이콘 */
  dropzoneIcon: 'h-8 w-8 text-muted-foreground/40',

  /** 드롭존 텍스트 */
  dropzoneText: 'text-sm font-medium text-foreground',

  /** 드롭존 보조 텍스트 */
  dropzoneHint: 'text-xs text-muted-foreground',

  /** 선택된 파일명 */
  selectedFile: 'text-sm font-medium text-primary truncate max-w-full',

  /** 업로드 버튼 */
  uploadBtn: 'w-full',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 9. 과거 번호 검색바
// ─────────────────────────────────────────────────────────────────────────────

export const FORM_TEMPLATES_SEARCH_BAR_TOKENS = {
  /** 검색바 컨테이너 */
  container: [
    'rounded-lg border border-border bg-card p-4',
    TRANSITION_PRESETS.fastShadowBorder,
    'hover:border-border/80',
  ].join(' '),

  /** 입력 행 (아이콘 + 입력 + 버튼) */
  inputRow: 'flex items-center gap-2',

  /** 안내 아이콘 */
  leadingIcon: 'h-4 w-4 text-muted-foreground',

  /** 결과 영역 */
  resultBlock: 'mt-3 space-y-2 text-sm',

  /** 결과 없음/보조 텍스트 */
  secondaryText: 'text-sm text-muted-foreground',

  /** 현행 → 과거 화살표 행 */
  relationRow: 'flex items-center justify-between gap-3',

  /** 과거 번호 배지 (탈락 상태) */
  supersededBadge: 'opacity-70',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 10. 모션
// ─────────────────────────────────────────────────────────────────────────────

export const FORM_TEMPLATES_MOTION = {
  /** 테이블 행 hover 트랜지션 */
  rowTransition: TRANSITION_PRESETS.instantBg,

  /** 스켈레톤 → 데이터 전환 */
  contentEntrance: 'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300',

  /** 액션 버튼 누름 피드백 */
  buttonPress: 'active:scale-[0.97]',
} as const;
