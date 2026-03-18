/**
 * Calibration Factors Registry Component Tokens
 *
 * 보정계수 대장 페이지 디자인 토큰
 *
 * Layer 3 (Component): 즉시 사용 가능한 클래스 조합
 * Layer 2 (Semantic) 참조: TRANSITION_PRESETS, FOCUS_TOKENS
 *
 * SSOT 역할:
 * - CAL_FACTORS_HEADER_TOKENS: 페이지 헤더
 * - CAL_FACTORS_STATS_TOKENS: 요약 통계 카드 (3개)
 * - CAL_FACTORS_COLLAPSIBLE_TOKENS: 장비별 접을 수 있는 그룹
 * - CAL_FACTORS_TABLE_TOKENS: 보정계수 테이블
 * - CAL_FACTORS_EMPTY_STATE_TOKENS: 빈 상태
 * - CAL_FACTORS_SEARCH_TOKENS: 검색 + 확장/축소 바
 */

import { TRANSITION_PRESETS } from '../motion';
import { getSemanticStatusClasses } from '../brand';
import { PAGE_HEADER_TOKENS } from './page-layout';

// ─────────────────────────────────────────────────────────────────────────────
// 1. 페이지 헤더
// ─────────────────────────────────────────────────────────────────────────────

export const CAL_FACTORS_HEADER_TOKENS = {
  ...PAGE_HEADER_TOKENS,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 2. 요약 통계 카드 (3개)
// ─────────────────────────────────────────────────────────────────────────────

export const CAL_FACTORS_STATS_TOKENS = {
  grid: 'grid gap-4 md:grid-cols-3',

  card: {
    header: 'flex flex-row items-center justify-between space-y-0 pb-2',
    titleText: 'text-sm font-medium',
    icon: 'h-4 w-4 text-muted-foreground',
  },

  value: 'text-2xl font-bold tabular-nums',
  desc: 'text-xs text-muted-foreground',

  /** 카드별 아이콘 의미론적 색상 */
  iconBg: {
    equipment: getSemanticStatusClasses('info'),
    factors: getSemanticStatusClasses('purple'),
    generatedAt: getSemanticStatusClasses('neutral'),
  } as Record<string, string>,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 3. 검색 + 확장/축소 컨트롤 바
// ─────────────────────────────────────────────────────────────────────────────

export const CAL_FACTORS_SEARCH_TOKENS = {
  container: 'flex items-center justify-between',
  controls: 'flex items-center gap-2',
  inputWrapper: 'relative',
  inputIcon:
    'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none',
  input: 'pl-9 w-[300px]',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 4. 장비별 접을 수 있는 그룹
// ─────────────────────────────────────────────────────────────────────────────

export const CAL_FACTORS_COLLAPSIBLE_TOKENS = {
  list: 'space-y-2',

  trigger: [
    'flex items-center justify-between p-4 border rounded-lg cursor-pointer',
    'hover:bg-muted/50',
    TRANSITION_PRESETS.fastBg,
  ].join(' '),

  triggerInfo: 'flex items-center gap-4',
  chevron: 'h-5 w-5 flex-shrink-0',

  /** 장비 ID 링크 */
  equipmentLink: ['font-medium hover:underline', TRANSITION_PRESETS.fastColor].join(' '),
  factorCount: 'text-sm text-muted-foreground',

  /** 미리보기 배지 영역 */
  badgePreview: 'flex items-center gap-2',
  overflowBadge: 'text-xs',

  /** 확장된 콘텐츠 테이블 래퍼 */
  contentWrapper: 'ml-9 mt-2 border rounded-lg overflow-hidden',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 5. 보정계수 테이블
// ─────────────────────────────────────────────────────────────────────────────

export const CAL_FACTORS_TABLE_TOKENS = {
  row: [TRANSITION_PRESETS.fastBg, 'hover:bg-muted/30'].join(' '),
  cellName: 'font-medium',
  cellValue: 'font-mono tabular-nums',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 6. 빈 상태
// ─────────────────────────────────────────────────────────────────────────────

export const CAL_FACTORS_EMPTY_STATE_TOKENS = {
  container: 'text-center py-12 text-muted-foreground',
  icon: 'h-12 w-12 mx-auto mb-4 opacity-50',
} as const;
