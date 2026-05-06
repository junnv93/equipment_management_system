'use client';

import { useTranslations } from 'next-intl';
import { CHECKOUT_PAGINATION_TOKENS } from '@/lib/design-tokens';
import { DEFAULT_PAGE_SIZE } from '@equipment-management/shared-constants';

export interface CheckoutListPaginationProps {
  /** 현재 페이지 (1-based) */
  current: number;
  /** 전체 페이지 수 */
  totalPages: number;
  /** 전체 항목 수 (info 라벨용) */
  total: number;
  /** 페이지당 항목 수 — 미지정 시 DEFAULT_PAGE_SIZE 사용 */
  pageSize?: number;
  /** 페이지 변경 핸들러 (1 ≤ page ≤ totalPages) */
  onPageChange: (page: number) => void;
  /** 로딩 중 → 이전/다음 disabled (체감 안정성) */
  isLoading?: boolean;
}

/**
 * 반출 목록 페이지네이션 (presentation only).
 *
 * SSOT: `CHECKOUT_PAGINATION_TOKENS` (`lib/design-tokens/components/checkouts.ts`).
 * 동작 동등: 페이지 표시 (현재 ±2 윈도) + 첫/끝 페이지 + 줄임표 + 이전/다음.
 *
 * 부모는 `totalPages > 1` 조건만 검증해 렌더 여부를 결정. 본 컴포넌트는 page math만 담당.
 *
 * a11y: `aria-current="page"` (활성 버튼) + 이전/다음 `aria-label` (i18n) 보존.
 */
export function CheckoutListPagination({
  current,
  totalPages,
  total,
  pageSize,
  onPageChange,
  isLoading = false,
}: CheckoutListPaginationProps) {
  const t = useTranslations('checkouts');

  const effectivePageSize = pageSize ?? DEFAULT_PAGE_SIZE;
  const delta = 2;
  const left = Math.max(1, current - delta);
  const right = Math.min(totalPages, current + delta);
  const pageNumbers: number[] = [];
  for (let i = left; i <= right; i++) pageNumbers.push(i);

  const from = (current - 1) * effectivePageSize + 1;
  const to = Math.min(current * effectivePageSize, total);

  return (
    <div className={CHECKOUT_PAGINATION_TOKENS.container}>
      <p className={CHECKOUT_PAGINATION_TOKENS.info}>
        {t('outbound.paginationInfo', { total, from, to })}
      </p>
      <div className={CHECKOUT_PAGINATION_TOKENS.buttons}>
        <button
          type="button"
          className={`${CHECKOUT_PAGINATION_TOKENS.btn.base} ${
            current === 1
              ? CHECKOUT_PAGINATION_TOKENS.btn.disabled
              : CHECKOUT_PAGINATION_TOKENS.btn.default
          }`}
          onClick={() => current > 1 && onPageChange(current - 1)}
          disabled={current === 1 || isLoading}
          aria-label={t('actions.previous')}
        >
          ‹
        </button>

        {left > 1 && (
          <>
            <button
              type="button"
              className={`${CHECKOUT_PAGINATION_TOKENS.btn.base} ${CHECKOUT_PAGINATION_TOKENS.btn.default}`}
              onClick={() => onPageChange(1)}
            >
              1
            </button>
            {left > 2 && <span className={CHECKOUT_PAGINATION_TOKENS.ellipsis}>…</span>}
          </>
        )}

        {pageNumbers.map((p) => (
          <button
            key={p}
            type="button"
            className={`${CHECKOUT_PAGINATION_TOKENS.btn.base} ${
              p === current
                ? CHECKOUT_PAGINATION_TOKENS.btn.active
                : CHECKOUT_PAGINATION_TOKENS.btn.default
            }`}
            onClick={() => p !== current && onPageChange(p)}
            aria-current={p === current ? 'page' : undefined}
          >
            {p}
          </button>
        ))}

        {right < totalPages && (
          <>
            {right < totalPages - 1 && (
              <span className={CHECKOUT_PAGINATION_TOKENS.ellipsis}>…</span>
            )}
            <button
              type="button"
              className={`${CHECKOUT_PAGINATION_TOKENS.btn.base} ${CHECKOUT_PAGINATION_TOKENS.btn.default}`}
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          className={`${CHECKOUT_PAGINATION_TOKENS.btn.base} ${
            current === totalPages
              ? CHECKOUT_PAGINATION_TOKENS.btn.disabled
              : CHECKOUT_PAGINATION_TOKENS.btn.default
          }`}
          onClick={() => current < totalPages && onPageChange(current + 1)}
          disabled={current === totalPages || isLoading}
          aria-label={t('actions.next')}
        >
          ›
        </button>
      </div>
    </div>
  );
}
