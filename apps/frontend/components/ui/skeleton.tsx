/**
 * BC re-export — 기존 호출자(`from '@/components/ui/skeleton'`)는 동작 100% 보존.
 *
 * 신규 코드는 부품집 활용을 권장:
 *   import { SkeletonText, SkeletonCard, SkeletonTableRow, SkeletonHero, SkeletonForm }
 *     from '@/components/ui/skeleton';
 *
 * @see components/ui/skeleton/index.ts
 */
export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTableRow,
  SkeletonHero,
  SkeletonForm,
} from './skeleton/index';

export type {
  SkeletonTextProps,
  SkeletonCardProps,
  SkeletonTableRowProps,
  SkeletonHeroProps,
  SkeletonFormProps,
} from './skeleton/index';
