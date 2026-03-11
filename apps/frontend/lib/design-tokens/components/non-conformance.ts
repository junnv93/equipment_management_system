/**
 * Non-Conformance Component Tokens
 *
 * 도메인 상태 → 시멘틱 색상 매핑 레이어 (SSOT).
 *
 * 색상 원칙:
 * - 모든 색상은 brand.ts의 시맨틱 시스템 경유 (CSS 변수 기반)
 * - bg-green-*, bg-emerald-* 등 raw 색상 직접 사용 금지
 * - brand-ok = 성공/완료/연결됨, brand-critical = 부적합/위험
 *
 * Layer 참조:
 * - Layer 2: getSemanticBadgeClasses(), getSemanticContainerClasses() (brand.ts)
 * - Layer 2: getTransitionClasses() (motion.ts)
 * - Layer 3: 이 파일 — 컴포넌트별 조합
 */

import type { SemanticColorKey } from '../brand';
import { TRANSITION_PRESETS } from '../motion';
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
// 컴포넌트 레벨 토큰 (Layer 3 — Layer 2 시맨틱 참조)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 부적합 배너 (NonConformanceBanner)
 *
 * 모든 색상이 brand-critical CSS 변수를 참조 → 다크 모드 자동 대응
 */
export const NC_BANNER_TOKENS = {
  /** Alert 컨테이너 — brand-critical 배경 + 테두리 */
  alert: 'border-brand-critical bg-brand-critical/5',
  icon: 'h-5 w-5 text-brand-critical',
  title: 'text-brand-critical font-semibold text-lg',
  desc: 'text-brand-critical/80',
  detailCard: 'bg-card p-3 rounded-lg border border-brand-critical/20',
  detailText: 'text-sm text-foreground',
} as const;

/**
 * 수리 연결 배지 (Repair Linked)
 *
 * brand-ok = 성공/완료 시맨틱 → CSS 변수 기반 다크 모드 자동 대응
 * getSemanticBadgeClasses('ok')를 기반으로 hover/transition 확장
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

/**
 * 승인/종결 버튼
 *
 * brand-ok 기반 CTA 버튼 — 배경색은 불투명(가시성 확보)
 */
export const NC_APPROVE_BUTTON_TOKENS = {
  approve: ['bg-brand-ok hover:bg-brand-ok/90 text-white', TRANSITION_PRESETS.fastBg].join(' '),
} as const;
