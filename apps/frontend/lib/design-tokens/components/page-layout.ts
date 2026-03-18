/**
 * Page Layout Component Tokens (Layer 3: Component-Specific)
 *
 * 대시보드 내 모든 페이지의 컨테이너 + 헤더 레이아웃 SSOT.
 * header.ts, sidebar.ts 패턴을 따라 Layer 2 → Layer 3 참조 구조.
 *
 * Tailwind container 설정 (tailwind.config.js):
 *   center: true, padding: '2rem', screens: { '2xl': '1400px' }
 *
 * SSOT:
 * - 페이지 컨테이너: getPageContainerClasses()
 * - 페이지 헤더 타이포그래피: PAGE_HEADER_TOKENS (리스트), SUB_PAGE_HEADER_TOKENS (생성/편집/상세)
 * - 모듈별 *_HEADER_TOKENS는 이 토큰을 spread하여 확장
 */

/** 페이지 컨테이너 variant */
export type PageContainerVariant = 'list' | 'detail' | 'wide' | 'form' | 'centered';

/**
 * 페이지 컨테이너 max-width variants
 *
 * - list: 전체 너비 (container의 2xl: 1400px 제한)
 * - detail: 넓은 폼/상세 (56rem)
 * - wide: 넓은 폼/생성/편집 (64rem) — 장비 등록/수정 등
 * - form: 좁은 폼 (42rem)
 * - centered: 전체 너비 + 수직 중앙 정렬 (로딩/빈 상태)
 */
const PAGE_MAX_WIDTH: Record<PageContainerVariant, string> = {
  list: '',
  detail: 'max-w-4xl',
  wide: 'max-w-5xl',
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
 * // 넓은 폼 페이지 (장비 등록/수정)
 * <div className={getPageContainerClasses('wide')}>
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

// ─────────────────────────────────────────────────────────────────────────────
// 페이지 헤더 토큰 — 전체 페이지 타이포그래피 SSOT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 리스트/관리 페이지 헤더 토큰 (최상위 depth)
 *
 * 적용 대상: 장비, 팀, 반출, 교정, 승인, 부적합 등 리스트 페이지
 * 모듈별 확장: `{ ...PAGE_HEADER_TOKENS, statsBadge: '...' }` 패턴
 *
 * @example
 * ```tsx
 * <div className={PAGE_HEADER_TOKENS.container}>
 *   <div className={PAGE_HEADER_TOKENS.titleGroup}>
 *     <h1 className={PAGE_HEADER_TOKENS.title}>{t('title')}</h1>
 *     <p className={PAGE_HEADER_TOKENS.subtitle}>{t('description')}</p>
 *   </div>
 *   <div className={PAGE_HEADER_TOKENS.actionsGroup}>
 *     <Button>...</Button>
 *   </div>
 * </div>
 * ```
 */
export const PAGE_HEADER_TOKENS = {
  /** 좌(타이틀) — 우(액션) 레이아웃 */
  container: 'flex items-start justify-between gap-4',
  /** 제목 + 부제목 그룹 */
  titleGroup: 'min-w-0 space-y-1',
  /** 페이지 타이틀 (text-2xl: 전 페이지 통일) */
  title: 'text-2xl font-bold tracking-tight text-foreground',
  /** 부제목/설명 */
  subtitle: 'text-sm text-muted-foreground',
  /** 우측 액션 버튼 그룹 */
  actionsGroup: 'flex items-center gap-2 shrink-0',
} as const;

/**
 * 서브 페이지 헤더 토큰 (생성/편집/상세 depth)
 *
 * 적용 대상: 팀 등록/수정, 장비 등록, 교정 등록, 반출 상세/반입/점검 등
 * 뒤로가기 버튼 + 타이틀 조합에 최적화
 *
 * @example
 * ```tsx
 * <div className={SUB_PAGE_HEADER_TOKENS.container}>
 *   <Button variant="outline" size="icon"><ArrowLeft /></Button>
 *   <div className={SUB_PAGE_HEADER_TOKENS.titleGroup}>
 *     <h1 className={SUB_PAGE_HEADER_TOKENS.title}>{t('title')}</h1>
 *     <p className={SUB_PAGE_HEADER_TOKENS.subtitle}>{t('description')}</p>
 *   </div>
 * </div>
 * ```
 */
export const SUB_PAGE_HEADER_TOKENS = {
  /** 뒤로가기 + 타이틀 수평 정렬 */
  container: 'flex items-center gap-4',
  /** 제목 + 부제목 그룹 */
  titleGroup: 'min-w-0',
  /** 서브 페이지 타이틀 (text-xl: 리스트보다 한 단계 작음) */
  title: 'text-xl font-bold tracking-tight text-foreground',
  /** 부제목/설명 */
  subtitle: 'text-sm text-muted-foreground',
} as const;
