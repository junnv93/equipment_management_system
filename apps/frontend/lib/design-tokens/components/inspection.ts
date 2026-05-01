/**
 * Inspection Component Tokens (Layer 3: Component-Specific)
 *
 * 중간점검 / 자체점검 폼 컴포넌트 전용 디자인 토큰
 * - judgment 상태 시각화 (pass/fail/conditional)
 * - 빈 상태 스타일
 * - 폼 간격 계층 (section > group > field)
 * - 모션 프리셋
 * - 접근성 포커스
 *
 * SSOT: inspections 디렉토리의 모든 스타일은 여기서만 정의
 * Cross-site: InspectionFormDialog + SelfInspectionFormDialog 공유
 */

import { FOCUS_TOKENS } from '../semantic';
import { TRANSITION_PRESETS, ANIMATION_PRESETS } from '../motion';
import {
  getSemanticBadgeClasses,
  getSemanticStatusClasses,
  getSemanticLeftBorderClasses,
  getSemanticContainerColorClasses,
  getSemanticContainerTextClasses,
} from '../brand';
import type { SemanticColorKey } from '../brand';

// ============================================================================
// 1. INSPECTION_JUDGMENT — 판정 상태 시각화
// ============================================================================

/**
 * 판정 값 → 시멘틱 색상 매핑
 *
 * SSOT: judgment/result 값에 대한 색상 매핑을 1곳에서 정의.
 * InspectionFormDialog, SelfInspectionFormDialog 모두 이 매핑 사용.
 */
const JUDGMENT_SEMANTIC_MAP: Record<string, SemanticColorKey> = {
  pass: 'ok',
  fail: 'critical',
  conditional: 'warning',
  na: 'neutral',
};

/**
 * 판정 상태별 카드 스타일 (좌측 보더 + 배경 틴트)
 *
 * - pass: 좌측 green 보더 + green 틴트
 * - fail: 좌측 red 보더 + red 틴트
 * - conditional: 좌측 yellow 보더 + yellow 틴트
 * - ''/undefined: 기본 (보더 없음)
 */
export function getJudgmentCardClasses(judgment: string | undefined): string {
  if (!judgment) return '';
  const semantic = JUDGMENT_SEMANTIC_MAP[judgment];
  if (!semantic) return '';
  return `${getSemanticLeftBorderClasses(semantic)} border-l-4 ${getSemanticContainerColorClasses(semantic)}`;
}

/**
 * 판정 상태별 배지 스타일
 */
export function getJudgmentBadgeClasses(judgment: string | undefined): string {
  if (!judgment) return '';
  const semantic = JUDGMENT_SEMANTIC_MAP[judgment];
  if (!semantic) return '';
  return getSemanticBadgeClasses(semantic);
}

/**
 * 종합 결과 상태 텍스트 색상
 */
export function getResultTextClasses(result: string | undefined): string {
  if (!result) return '';
  const semantic = JUDGMENT_SEMANTIC_MAP[result];
  if (!semantic) return '';
  return getSemanticContainerTextClasses(semantic);
}

/**
 * 종합 결과 상태 배지
 */
export function getResultBadgeClasses(result: string | undefined): string {
  if (!result) return '';
  const semantic = JUDGMENT_SEMANTIC_MAP[result];
  if (!semantic) return '';
  return getSemanticStatusClasses(semantic);
}

// ============================================================================
// 2. INSPECTION_EMPTY_STATE — 빈 상태
// ============================================================================

/**
 * 빈 상태 스타일 (CALIBRATION_EMPTY_STATE 패턴)
 */
export const INSPECTION_EMPTY_STATE = {
  container: 'flex flex-col items-center justify-center py-8 text-center',
  icon: 'h-10 w-10 text-muted-foreground mb-3',
  title: 'text-sm font-medium text-muted-foreground',
  description: 'text-xs text-muted-foreground/70 mt-1',
  cta: 'mt-3',
} as const;

// ============================================================================
// 3. INSPECTION_SPACING — 계층적 간격 체계
// ============================================================================

/**
 * 폼 간격 계층 (3-level)
 *
 * - section: 폼의 대 섹션 간 (메타데이터 ↔ 점검항목 ↔ 결과섹션)
 * - group: 섹션 내 그룹 간 (필드 그룹들)
 * - field: 개별 필드 간 (Label + Input)
 */
export const INSPECTION_SPACING = {
  section: 'space-y-6',
  group: 'space-y-4',
  field: 'space-y-2',
  /** Label + 인풋 등 타이트한 간격 */
  tight: 'space-y-1',
  /** 섹션 구분선 위아래 여백 */
  divider: 'my-6',
} as const;

// ============================================================================
// 4. INSPECTION_MOTION — 모션 프리셋
// ============================================================================

/**
 * 점검 폼 모션 토큰
 */
export const INSPECTION_MOTION = {
  /** 점검 항목 카드 hover */
  itemCard: TRANSITION_PRESETS.fastBgBorder,
  /** 결과 섹션 카드 hover */
  sectionCard: TRANSITION_PRESETS.fastShadowBorder,
  /** 아이템 추가 entrance */
  itemEntrance: ANIMATION_PRESETS.slideUpFade,
  /** 버튼 hover */
  button: TRANSITION_PRESETS.fastBg,
} as const;

// ============================================================================
// 5. INSPECTION_ITEM_CARD — 점검 항목 카드
// ============================================================================

/**
 * 점검 항목 카드 스타일
 */
export const INSPECTION_ITEM_CARD = {
  /** 기본 카드 */
  base: ['border rounded-lg p-3 relative', INSPECTION_MOTION.itemCard].join(' '),
  /** 항목 번호 */
  number: 'text-sm font-medium text-muted-foreground',
  /** 그리드 레이아웃 */
  fieldGrid: 'grid grid-cols-2 gap-3',
  /** 필드 라벨 */
  fieldLabel: 'text-xs',
} as const;

// ============================================================================
// 6. INSPECTION_SECTION_CARD — 결과 섹션 카드
// ============================================================================

/**
 * 결과 섹션 카드 스타일
 */
export const INSPECTION_SECTION_CARD = {
  base: ['relative', INSPECTION_MOTION.sectionCard].join(' '),
  /** 액션 버튼 그룹 */
  actions: 'mt-2 flex gap-1',
  /** 액션 버튼 공통 */
  actionButton: 'h-7 w-7',
} as const;

// ============================================================================
// 7. INSPECTION_TABLE — 테이블 프리미엄
// ============================================================================

/**
 * 결과 섹션의 data_table / rich_table 스타일
 */
export const INSPECTION_TABLE = {
  wrapper: 'overflow-x-auto rounded border',
  stripe: 'even:bg-muted/30 dark:even:bg-muted/20',
  rowHover: ['hover:bg-muted/50', TRANSITION_PRESETS.instantBg].join(' '),
  numericCell: 'font-mono tabular-nums text-sm',
} as const;

// ============================================================================
// 8. INSPECTION_FOCUS — 접근성 포커스
// ============================================================================

/**
 * 포커스 클래스 (FOCUS_TOKENS 재사용)
 */
export const INSPECTION_FOCUS = FOCUS_TOKENS.classes;

// ============================================================================
// 9. INSPECTION_PREFILL — 자동 입력 배지
// ============================================================================

/**
 * Prefill 배지 스타일
 */
export const INSPECTION_PREFILL = {
  badge: 'ml-2 text-xs font-normal',
  icon: 'mr-1 h-3 w-3',
} as const;

// ============================================================================
// 10. INSPECTION_TABLE_PASTE_MODE — Phase 0A (P0 데이터 안전성)
// ============================================================================

/**
 * Paste-fill 동작 모드
 *
 * SSOT: VisualTableEditor의 paste 영역 라디오 + 모드별 placeholder/툴팁.
 * - append (default): 기존 행 보존, 끝에 추가 — 데이터 보존 default
 * - replace: 전체 덮어쓰기 — 기존 데이터 감지 시 destructive toast 강제
 *
 * WCAG: SC 3.3.4 (Error Prevention) — replace는 의도적 명시 + 행 수 표시
 */
export const INSPECTION_TABLE_PASTE_MODE = {
  /** 모드 라디오 컨테이너 */
  radioGroup: 'flex items-center gap-3 text-xs',
  /** 모드 라디오 단위 (label + radio) */
  radioItem: 'flex items-center gap-1.5',
  /** append (default) 모드 라벨 */
  appendLabel: 'text-muted-foreground',
  /** replace (warning) 모드 라벨 + 경고 아이콘 강조 */
  replaceLabel: 'text-warning-foreground font-medium',
  /** replace 선택 시 행 수 표시 row */
  replaceWarning:
    'mt-1 flex items-center gap-1.5 text-xs text-warning-foreground bg-warning/10 border border-warning/30 rounded-md px-2 py-1',
  /** replace 모드 placeholder (한국어 경고 톤) */
  replacePlaceholder: '⚠ 기존 행이 모두 삭제됩니다. 헤더와 데이터를 모두 붙여넣으세요.',
  /** append 모드 placeholder (한국어 친화) */
  appendPlaceholder: '예: 주파수(GHz)\t이득(dB)\t규격\n1.0\t44.12\t45 ± 2.5',
} as const;

export type InspectionPasteMode = 'append' | 'replace';

// ============================================================================
// 11. INSPECTION_KEYBOARD_HINT — Phase 0A (P0 키보드 발견성)
// ============================================================================

/**
 * VisualTableEditor toolbar 옆 키보드 단축키 힌트 bar
 *
 * - dismissible: 첫 진입 후 사용자가 닫으면 같은 세션에는 다시 보이지 않음
 * - kbd 시각: 모노스페이스 + 작은 inline 코드 스타일
 * - WCAG: SC 2.1.1 (Keyboard) Level A — 키보드 동선 발견성 보강
 */
export const INSPECTION_KEYBOARD_HINT = {
  /** 힌트 bar 컨테이너 */
  bar: 'flex items-center gap-2 text-xs text-muted-foreground tabular-nums',
  /** 힌트 항목 */
  item: 'inline-flex items-center gap-1',
  /** kbd 키 시각 (--text-2xs = 10px) */
  kbd: 'inline-flex items-center justify-center rounded border bg-muted px-1.5 py-0.5 font-mono text-2xs font-medium text-foreground/80',
  /** dismiss 버튼 */
  dismissButton: 'ml-auto text-muted-foreground/60 hover:text-foreground',
} as const;

// ============================================================================
// 12. INSPECTION_INLINE_DELETE_CONFIRM — Phase 0A (P0 inline 삭제 안전망)
// ============================================================================

/**
 * 결과 섹션 inline 삭제 후 5초 toast undo 패턴
 *
 * SSOT: 다이얼로그 띄우는 대신 즉시 삭제 + 5초 toast의 "되돌리기" action.
 * - 표 30셀 작성 후 1클릭 손실은 paste-fill과 동등 P0
 * - 토스트 자체는 useToast 사용. 토큰은 메시지/액션 카피와 표시 시각 SSOT.
 *
 * WCAG: SC 3.3.4 (Error Prevention)
 */
export const INSPECTION_INLINE_DELETE_CONFIRM = {
  /** 토스트 표시 시간 (ms) */
  toastDurationMs: 5000,
  /** 토스트 컨테이너 variant — useToast 호출 시 사용 */
  toastVariant: 'default' as const,
  /** 토스트 액션 버튼 카피 i18n key 후보 (호출자에서 t() 적용) */
  i18nKey: {
    description: 'resultSections.inlineDelete.toastDescription',
    action: 'resultSections.inlineDelete.undo',
  },
} as const;

// ============================================================================
// 13. INSPECTION_STATUS_BADGE — Phase 0B (P1 상태 가시성)
// ============================================================================

/**
 * 점검 상태 (중간점검 5상태 + 자체점검 4상태) → semantic mapping
 *
 * 중간점검: draft / submitted(1차 대기) / reviewed(최종 대기) / approved / rejected
 * 자체점검: draft / submitted(승인 대기) / approved / rejected
 *
 * 색은 동일 매핑 (단계 차이는 i18n 라벨로 분리, 디자인 리뷰 b8):
 * - rejected → critical (즉시 시선)
 * - submitted/reviewed → warning (대기 = 누군가 액션 필요)
 * - approved → ok
 * - draft → neutral
 *
 * Nielsen IA-3 (Visibility of system status) 위배 차단.
 * SSOT: getSemanticBadgeClasses 재사용으로 brand 분리 불필요.
 */
export type InspectionStatusKey = 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected';

/**
 * 색은 단계 차이 가시화 (반환값 → getSemanticBadgeClasses):
 * - submitted (1차 검토 대기) = info — 첫 번째 액션 단계 신호
 * - reviewed (최종 승인 대기) = purple — 다른 신호로 진행 단계 강조
 *
 * 자체점검은 reviewed 단계 없이 submitted = info (단일 단계 승인 대기)
 *
 * SSOT: 로컬 STATUS_SEMANTIC_MAP / APPROVAL_SEMANTIC_MAP 중복 제거 위해 export.
 */
export const INSPECTION_STATUS_SEMANTIC_MAP: Record<InspectionStatusKey, SemanticColorKey> = {
  draft: 'neutral',
  submitted: 'info',
  reviewed: 'purple',
  approved: 'ok',
  rejected: 'critical',
};

/** 호환을 위한 helper — semantic key 자체 반환 (left border / dot 등 추가 사용처) */
export function getInspectionStatusSemantic(status: string | undefined): SemanticColorKey {
  if (!status || !(status in INSPECTION_STATUS_SEMANTIC_MAP)) return 'neutral';
  return INSPECTION_STATUS_SEMANTIC_MAP[status as InspectionStatusKey];
}

export const INSPECTION_STATUS_BADGE = {
  /** size sm — 목록 row */
  sm: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
  /** size lg — DialogHeader */
  lg: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium',
  /** 반려 사유 inline alert (DialogHeader 내) */
  rejectionAlert:
    'mt-2 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs',
  /** "전체 보기" 버튼 */
  rejectionExpand: 'ml-auto shrink-0 text-xs underline-offset-2 hover:underline text-destructive',
  /** 반려 사유 첫 80자 발췌 시 글자 수 한도 */
  rejectionExcerptMax: 80,
} as const;

export function getInspectionStatusBadgeClasses(
  status: InspectionStatusKey | string | undefined,
  size: 'sm' | 'lg' = 'sm'
): string {
  const semantic = getInspectionStatusSemantic(status);
  // sm/lg는 layout 클래스만 별도. 색은 semantic helper에서.
  return [INSPECTION_STATUS_BADGE[size], getSemanticBadgeClasses(semantic)].join(' ');
}

// ============================================================================
// 14. INSPECTION_TABLE_FOCUS_RING — Phase 0B (P1 셀 시인성)
// ============================================================================

/**
 * VisualTableEditor 셀 focus 시각 강화 (디자인 리뷰 b6/b7/b11)
 *
 * 기존 ring-primary/40 (대비 1.5:1 추정) → ring-primary + bg-primary/5
 * WCAG SC 1.4.11 (Non-text Contrast 3:1) 충족.
 *
 * SSOT: 셀 td.className에 직접 적용. focus-visible 우선.
 */
export const INSPECTION_TABLE_FOCUS_RING = {
  /** 활성 셀 — focus-visible 시 ring-2 + bg tint */
  cell: 'ring-2 ring-inset ring-primary bg-primary/5',
  /** focus-visible 모드용 (키보드만 강조, mouse click hover 시 약하게) */
  cellFocusVisible: 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
} as const;

// ============================================================================
// 15. INSPECTION_NESTED_DIALOG_BACKDROP — Phase 0B (P1 다이얼로그 위계)
// ============================================================================

/**
 * 자식 다이얼로그(ResultSectionFormDialog) 열림 시 부모 backdrop 강조 (디자인 리뷰 b7/b11)
 *
 * 부모 backdrop opacity 0.4 → 0.6 + shadow elevation +1
 * "다이얼로그 위 다이얼로그" 시각 평면 문제 해결.
 *
 * SSOT: 자식 dialog의 portal에 추가 layer. body[data-nested-dialog="true"] 패턴 활용.
 * Tailwind arbitrary 회피 위해 utility 조합.
 */
export const INSPECTION_NESTED_DIALOG_BACKDROP = {
  /** 자식 다이얼로그 표시 시 body에 data-attribute 부여 (CSS selector hook) */
  bodyAttribute: 'data-inspection-nested-dialog',
  /** 자식 dialog overlay 추가 강조 */
  overlayBoost: 'bg-black/60',
  /** 자식 dialog content shadow elevation */
  contentElevation: 'shadow-2xl',
} as const;

// ============================================================================
// 16. INSPECTION_SECTION_TYPE_CHIP — Phase 0B (P1 한국어 칩 길이 균등화)
// ============================================================================

/**
 * 인라인 결과 섹션 타입 선택 칩 (table / photo / text) 한국어 길이 차이 균등화
 * (디자인 리뷰 b6: "데이터 표/사진/텍스트" hit area 들쭉날쭉)
 *
 * 적용: InlineResultSectionsEditor의 isAwaitingType 분기.
 * SSOT: min-w 강제 + flex-1 grid로 동일 폭. WCAG SC 2.5.5 (Target Size) 보강.
 */
export const INSPECTION_SECTION_TYPE_CHIP = {
  /** chip 컨테이너 — 3개 칩 동일 폭 grid */
  group: 'mt-2 grid grid-cols-3 gap-1.5',
  /** chip 단위 — min-w 강제 + 32px hit height + 아이콘 + 텍스트 */
  chip: 'inline-flex h-8 min-w-20 items-center justify-center gap-1 rounded-md border bg-background px-2 text-xs font-medium hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-primary',
  /** chip 아이콘 */
  icon: 'h-3 w-3',
} as const;

// ============================================================================
// 17. INSPECTION_PREFILL_NOTICE — Phase 1A (P1 prefill 안내 banner)
// ============================================================================

/**
 * 직전 점검 구조 prefill 적용 시 노출되는 inline notice (디자인 리뷰 b9/b16)
 *
 * - role="status" + aria-live="polite" — 즉시 인터럽트 X (안내성)
 * - sky-50 + border-sky-200 — info 톤 (warning 아님)
 * - dismissible — 사용자가 한 번 보면 닫을 수 있음
 *
 * SSOT: InspectionFormDialog DialogHeader 아래 inline.
 */
export const INSPECTION_PREFILL_NOTICE = {
  /** banner 컨테이너 */
  banner:
    'flex items-start gap-2 rounded-md border border-sky-200 bg-sky-50 dark:bg-sky-950/30 dark:border-sky-900 px-3 py-2 text-xs',
  /** 아이콘 (info 시각) */
  icon: 'h-4 w-4 shrink-0 text-sky-700 dark:text-sky-300 mt-0.5',
  /** 본문 */
  body: 'flex-1 text-sky-900 dark:text-sky-100',
  /** 메타 (이전 점검 v3 · 2026-04-15 · 김OO) */
  meta: 'mt-0.5 text-2xs text-sky-700/80 dark:text-sky-300/80',
  /** dismiss 버튼 */
  dismissButton: 'shrink-0 text-sky-700/70 hover:text-sky-900',
} as const;

// ============================================================================
// 18. INSPECTION_CELL_PROVENANCE — Phase 1A (P1 셀 provenance 시각)
// ============================================================================

/**
 * 표 셀의 prefill 출처 시각 (디자인 리뷰 b5/b6/b9/b11/b16)
 *
 * - prefilled: 직전 점검 구조에서 가져옴 — sky-300 left border + 우상단 dot
 * - userModified: 사용자가 입력 또는 변경 — primary left border
 * - empty: 빈 상태 — 시각 없음
 *
 * SSOT: VisualTableEditor 셀 td 클래스에 추가.
 * 출처 추적: provenanceMap?: Set<string> ('${ri}:${ci}' 형태)
 */
export const INSPECTION_CELL_PROVENANCE = {
  prefilled: 'border-l-2 border-l-sky-300 dark:border-l-sky-600',
  userModified: 'border-l-2 border-l-primary',
  empty: '',
  /** 우상단 dot 마이크로 hint */
  prefillDot: 'absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-sky-400 dark:bg-sky-500',
  /** 이전엔 사진이었던 셀 hint */
  imageConvertedHint: 'absolute bottom-0.5 right-0.5 h-3 w-3 text-amber-500',
} as const;

// ============================================================================
// 19. INSPECTION_TABLE_CELL_STATE — Phase 1A (P1 셀 5상태 시각, 디자인 리뷰 b5/b10)
// ============================================================================

/**
 * 표 셀 5상태 시각 (디자인 리뷰 WF-06)
 *
 * - empty: 빈 셀 — slate-50 bg + dashed border
 * - dirty: 사용자 입력 중, commit 안 됨 — amber-50 + ⚠
 * - committed: 입력 완료 — white bg
 * - outOfSpec: spec 위반 (1B의 measurement 메타 의존) — rose-50 + ❌
 * - focus: 활성 셀 — INSPECTION_TABLE_FOCUS_RING과 연동
 *
 * 1A 적용 범위: empty / dirty / committed (out-of-spec은 1B-backend 의존, focus는 0B 연동).
 * WCAG SC 1.4.1 — 색만 의존 X, 아이콘 + border 보강.
 */
export const INSPECTION_TABLE_CELL_STATE = {
  empty: 'bg-slate-50/40 dark:bg-slate-900/40',
  dirty: 'bg-amber-50/50 dark:bg-amber-950/30 border-l-2 border-l-amber-300',
  committed: 'bg-background',
  outOfSpec: 'bg-rose-50/60 dark:bg-rose-950/30 border-l-2 border-l-rose-400',
  /** focus는 0B의 INSPECTION_TABLE_FOCUS_RING과 결합 */
  /** 5상태 아이콘 (색만 의존 X) */
  dirtyIcon: 'h-2.5 w-2.5 text-amber-600',
  outOfSpecIcon: 'h-2.5 w-2.5 text-rose-600',
} as const;

// ============================================================================
// 20. INSPECTION_CHECKITEM_ROW_STATE — Phase 0C (자체점검 정합성)
// ============================================================================

/**
 * 자체점검 항목 row 시각 (디자인 리뷰 b6/b7/b11)
 *
 * - row tint + left border 4px (pass/fail/na)
 * - segmented control 합부 선택 (pass/fail/na 색·아이콘 강화)
 * - WCAG 1.4.1 색만 의존 X — 아이콘·텍스트·border 보강
 */
export const INSPECTION_CHECKITEM_ROW_STATE = {
  /** row 컨테이너 — 합부 선택 시 left border + bg tint */
  rowBase: 'flex items-center gap-2 rounded-md border bg-card px-2 py-1.5 transition-colors',
  rowPass: 'border-l-4 border-l-emerald-500 bg-emerald-50/40',
  rowFail: 'border-l-4 border-l-rose-500 bg-rose-50/40',
  rowNa: 'border-l-4 border-l-slate-400 bg-slate-50/40',
  rowNone: '',
  /** segmented control 단위 */
  segGroup: 'inline-flex rounded-md border border-input shadow-sm overflow-hidden',
  /** 각 segment button base (h-8 = 32px hit area) */
  segItem:
    'inline-flex h-8 min-w-[44px] items-center justify-center gap-1 px-2.5 text-xs font-medium border-r border-input last:border-r-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
  segPass: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300',
  segFail: 'bg-rose-100 text-rose-700 ring-1 ring-rose-300',
  segNa: 'bg-slate-100 text-slate-700 ring-1 ring-slate-300',
  segInactive: 'bg-background text-muted-foreground hover:bg-muted/50',
  /** 정합성 alert (항목 fail 1+ + 종합 pass 시) */
  consistencyAlert:
    'flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm',
  consistencyAlertTitle: 'font-medium text-destructive',
  consistencyAlertBody: 'text-destructive/80 text-xs',
} as const;

// ============================================================================
// 18. INSPECTION_KIND_BADGE — Phase 0B (분류 시각: 자체 vs 중간점검)
// ============================================================================

/**
 * 점검 종류 시각 구분 (디자인 리뷰 b8: 분류 badge만으로 부족)
 *
 * - intermediate: 교정 사이 drift 감지 (3단계 승인) — emerald 톤
 * - self: 교정 비대상 자체 검증 (1단계 승인) — indigo 톤
 *
 * 두 점검의 *법적 무게*가 다르므로 색·라벨로 구분 (UL-QP-18-03 vs 18-05).
 * SSOT: list / card / DialogHeader 모두 동일 토큰.
 */
export const INSPECTION_KIND_BADGE = {
  intermediate:
    'inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700',
  self: 'inline-flex items-center gap-1 rounded-md border border-indigo-300 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700',
} as const;
