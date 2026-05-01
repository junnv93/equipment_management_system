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
  /** kbd 키 시각 */
  kbd: 'inline-flex items-center justify-center rounded border bg-muted px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-foreground/80',
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
