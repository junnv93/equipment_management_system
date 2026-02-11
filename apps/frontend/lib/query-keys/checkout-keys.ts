/**
 * Cross-page cache invalidation keys for checkout/approval workflows.
 *
 * React Query's invalidateQueries uses prefix matching:
 * invalidateQueries({ queryKey: ['checkouts'] }) invalidates all keys
 * starting with 'checkouts' (e.g., ['checkouts', 'abc-123']).
 *
 * Only active queries (mounted components) will refetch — idle queries
 * are simply marked stale (Vercel `client-swr-dedup` pattern).
 */

/** Invalidate when a checkout is approved or rejected */
export const CHECKOUT_APPROVAL_INVALIDATE_KEYS: string[][] = [
  ['checkouts'],
  ['approvals'],
  ['approval-counts'],
  ['pending-approval-counts'],
];

/** Invalidate when a return is approved */
export const RETURN_APPROVAL_INVALIDATE_KEYS: string[][] = [
  ['checkouts'],
  ['approvals'],
  ['approval-counts'],
  ['pending-approval-counts'],
  ['return-pending-approvals'],
];

/** Invalidate when a return is submitted (checkout → returned status) */
export const CHECKOUT_RETURN_INVALIDATE_KEYS: string[][] = [
  ['checkouts'],
  ['return-pending-approvals'],
  ['approvals'],
  ['pending-approval-counts'],
];
