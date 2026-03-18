/**
 * Page Layout Component Tokens (Layer 3: Component-Specific)
 *
 * 대시보드 내 모든 페이지의 컨테이너 레이아웃 SSOT.
 * header.ts, sidebar.ts 패턴을 따라 Layer 2 → Layer 3 참조 구조.
 *
 * Tailwind container 설정 (tailwind.config.js):
 *   center: true, padding: '2rem', screens: { '2xl': '1400px' }
 *
 * SSOT: 페이지 컨테이너의 모든 스타일은 여기서만 정의
 */

/** 페이지 컨테이너 variant */
export type PageContainerVariant = 'list' | 'detail' | 'form' | 'centered';

/**
 * 페이지 컨테이너 max-width variants
 *
 * - list: 전체 너비 (container의 2xl: 1400px 제한)
 * - detail: 넓은 폼/상세 (56rem)
 * - form: 좁은 폼 (42rem)
 * - centered: 전체 너비 + 수직 중앙 정렬 (로딩/빈 상태)
 */
const PAGE_MAX_WIDTH: Record<PageContainerVariant, string> = {
  list: '',
  detail: 'max-w-4xl',
  form: 'max-w-2xl',
  centered: '',
} as const;

/**
 * 페이지 컨테이너 클래스 생성
 *
 * @param variant - 페이지 유형 (기본: 'list')
 * @param spacing - 자식 간 수직 간격 클래스 (기본: 'space-y-6')
 * @returns 조합된 Tailwind 클래스 문자열
 *
 * @example
 * // 목록 페이지 (장비, 반출입, 교정 등)
 * <div className={getPageContainerClasses()}>
 *
 * // 상세/편집 페이지
 * <div className={getPageContainerClasses('detail')}>
 *
 * // 좁은 폼 페이지 (생성, 체크)
 * <div className={getPageContainerClasses('form')}>
 *
 * // 로딩/빈 상태 (수직 중앙)
 * <div className={getPageContainerClasses('centered')}>
 *
 * // 커스텀 간격
 * <div className={getPageContainerClasses('list', 'space-y-4')}>
 */
export function getPageContainerClasses(
  variant: PageContainerVariant = 'list',
  spacing: string = 'space-y-6'
): string {
  const base = 'container mx-auto py-6';
  const maxWidth = PAGE_MAX_WIDTH[variant];

  if (variant === 'centered') {
    return [base, 'flex items-center justify-center min-h-[400px]'].join(' ');
  }

  return [base, maxWidth, spacing].filter(Boolean).join(' ');
}
