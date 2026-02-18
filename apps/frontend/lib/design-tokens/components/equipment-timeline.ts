/**
 * Equipment Timeline Component Tokens
 *
 * 4개 타임라인 탭에서 공유하는 스타일 (SSOT)
 * - LocationHistoryTab
 * - MaintenanceHistoryTab
 * - CheckoutHistoryTab
 * - IncidentHistoryTab
 */

import { getTransitionClasses } from '../motion';

/**
 * 타임라인 스타일
 */
export const TIMELINE_TOKENS = {
  /** 타임라인 세로 선 */
  line: {
    container: 'absolute left-6 top-0 bottom-0 w-0.5',
    color: 'bg-border',
  },

  /** 타임라인 노드 (원형) */
  node: {
    container: 'flex h-12 w-12 items-center justify-center rounded-full border-2',
    icon: 'h-5 w-5',
  },

  /** 최신 항목 배지 */
  latestBadge: {
    container: 'ml-2 px-2 py-0.5 text-xs font-medium rounded-full',
    classes: 'bg-ul-info/10 text-ul-info border border-ul-info/20',
  },

  /** 타임라인 카드 */
  card: {
    base: 'rounded-lg border bg-card p-4',
    hover: ['hover:shadow-md', getTransitionClasses('fast', ['box-shadow'])].join(' '),
  },

  /** 항목 간 간격 */
  spacing: {
    itemGap: 'space-y-8',
    contentLeftPadding: 'pl-20', // 노드(48px) + 간격
  },

  /** 빈 상태 */
  empty: {
    container: 'flex flex-col items-center justify-center py-12 text-center',
    icon: 'h-12 w-12 text-muted-foreground mb-4',
    text: 'text-muted-foreground',
  },
} as const;

/**
 * Utility: 타임라인 노드 클래스 생성
 *
 * @param iconBgColor - 아이콘 배경 색상 (예: 'bg-ul-midnight', 'bg-ul-green')
 * @returns Tailwind 클래스 문자열
 *
 * @example
 * getTimelineNodeClasses('bg-ul-midnight')
 * // → 'flex h-12 w-12 items-center justify-center rounded-full border-2 bg-ul-midnight text-white border-ul-midnight-dark'
 */
export function getTimelineNodeClasses(iconBgColor: string): string {
  // iconBgColor에서 색상 추출 (예: 'bg-ul-midnight' → 'ul-midnight')
  const colorName = iconBgColor.replace('bg-', '');
  const borderColor = `border-${colorName}-dark`;
  const textColor = 'text-white'; // 모든 노드는 흰색 텍스트

  return [TIMELINE_TOKENS.node.container, iconBgColor, textColor, borderColor].join(' ');
}

/**
 * Utility: 타임라인 카드 클래스 생성
 *
 * @returns Tailwind 클래스 문자열
 */
export function getTimelineCardClasses(): string {
  return [TIMELINE_TOKENS.card.base, TIMELINE_TOKENS.card.hover].join(' ');
}

/**
 * 타임라인 스켈레톤 스타일
 */
export const TIMELINE_SKELETON_TOKENS = {
  node: 'h-12 w-12 rounded-full',
  card: 'h-24 rounded-lg',
  line: 'h-4 rounded',
} as const;
