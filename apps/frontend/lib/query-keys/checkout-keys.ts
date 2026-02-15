/**
 * Cross-page cache invalidation keys for checkout/approval workflows.
 *
 * React Query's invalidateQueries uses prefix matching:
 * invalidateQueries({ queryKey: ['checkouts'] }) invalidates all keys
 * starting with 'checkouts' (e.g., ['checkouts', 'detail', 'abc-123']).
 *
 * Only active queries (mounted components) will refetch — idle queries
 * are simply marked stale (Vercel `client-swr-dedup` pattern).
 *
 * SSOT: queryKeys factory from lib/api/query-config.ts
 */

import type { QueryKey } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-config';

/** Invalidate when a checkout is approved or rejected */
export const CHECKOUT_APPROVAL_INVALIDATE_KEYS: QueryKey[] = [
  queryKeys.checkouts.all,
  queryKeys.approvals.all,
  queryKeys.approvals.counts(),
];

/** Invalidate when a return is approved */
export const RETURN_APPROVAL_INVALIDATE_KEYS: QueryKey[] = [
  queryKeys.checkouts.all,
  queryKeys.approvals.all,
  queryKeys.approvals.counts(),
];

/** Invalidate when a return is submitted (checkout → returned status) */
export const CHECKOUT_RETURN_INVALIDATE_KEYS: QueryKey[] = [
  queryKeys.checkouts.all,
  queryKeys.approvals.all,
  queryKeys.approvals.counts(),
];
