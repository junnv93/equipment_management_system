/**
 * Loading SSOT — Route Segment fallback components
 *
 * 모든 `app/**\/loading.tsx`는 이 폴더의 RouteLoading variant 사용.
 * 기존 `RouteLoading` (components/layout/RouteLoading.tsx) 및 `ListPageSkeleton`
 * (components/ui/list-page-skeleton.tsx)은 thin wrapper로 BC 유지하되,
 * Phase 3에서 호출자를 점진 마이그레이션.
 *
 * @see lib/i18n/feedback-keys.ts
 * @see components/ui/skeleton/index.ts
 */
export { RouteLoading, type RouteLoadingProps, type RouteLoadingVariant } from './route-loading';
