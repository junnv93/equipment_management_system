/**
 * Non-Conformance Component Tokens
 *
 * 도메인 상태 → 시멘틱 색상 매핑 레이어 (SSOT).
 * 실제 색상 스타일은 brand.ts의 getSemanticBadgeClasses() / getSemanticContainerClasses()를 사용.
 */

import type { SemanticColorKey } from '../brand';
import type { NonConformanceStatus } from '@equipment-management/schemas';

/** NC 상태 → 시멘틱 색상 매핑 (SSOT) */
const NC_STATUS_SEMANTIC_MAP: Record<NonConformanceStatus, SemanticColorKey> = {
  open: 'critical',
  analyzing: 'warning',
  corrected: 'info',
  closed: 'ok',
};

/**
 * 부적합 상태 → 시멘틱 색상 키 변환
 *
 * @example
 * // 배지
 * getSemanticBadgeClasses(ncStatusToSemantic(nc.status))
 * // 컨테이너
 * getSemanticContainerClasses(ncStatusToSemantic(nc.status))
 */
export function ncStatusToSemantic(status: string): SemanticColorKey {
  return NC_STATUS_SEMANTIC_MAP[status as NonConformanceStatus] ?? 'neutral';
}

// ─────────────────────────────────────────────────────────────────────────────
// 컴포넌트 레벨 토큰
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 부적합 배너 (NonConformanceBanner)
 * 장비 상세에서 부적합 상태일 때 표시되는 경고 배너
 */
export const NC_BANNER_TOKENS = {
  alert: 'border-brand-critical bg-brand-critical/5',
  icon: 'h-5 w-5 text-brand-critical',
  title: 'text-brand-critical font-semibold text-lg',
  desc: 'text-brand-critical/80',
  detailCard: 'bg-card p-3 rounded-lg border border-brand-critical/20',
  detailText: 'text-sm text-foreground',
} as const;

/**
 * 수리 연결 배지 (Repair Linked)
 * 부적합에 수리 이력이 연결된 경우 표시
 */
export const NC_REPAIR_LINKED_TOKENS = {
  badge:
    'px-2 py-1 text-xs font-medium rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/30 motion-safe:transition-colors motion-reduce:transition-none',
  text: 'flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400',
} as const;

/**
 * 승인 버튼 (Close/Approve)
 */
export const NC_APPROVE_BUTTON_TOKENS = {
  approve:
    'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white',
} as const;
