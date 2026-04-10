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
