'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BulkActionBar as GenericBulkActionBar } from '@/components/common/BulkActionBar';
import { APPROVAL_BULK_BAR_TOKENS, getApprovalActionButtonClasses } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { InboundBulkReceiveModal } from './InboundBulkReceiveModal';
import type { BulkReceiveCondition } from '@/hooks/use-checkout-bulk-receive-mutation';

interface CheckoutInboundBulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  isAllPageSelected: boolean;
  isIndeterminate: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  /**
   * 일괄 수령 확인 콜백 — `Promise<void>` 강제 (mutate fire-and-forget 금지).
   *
   * Modal 내부 handleSubmit이 `await onBulkReceive(condition)` 후 close하므로,
   * 호출자는 반드시 `mutation.mutateAsync()`를 await/return해야 한다.
   */
  onBulkReceive: (condition: BulkReceiveCondition) => Promise<void>;
  isPending?: boolean;
}

export function CheckoutInboundBulkActionBar({
  selectedCount,
  totalCount,
  isAllPageSelected,
  isIndeterminate,
  onSelectAll,
  onClearSelection,
  onBulkReceive,
  isPending = false,
}: CheckoutInboundBulkActionBarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = useTranslations('checkouts');
  const tApprovals = useTranslations('approvals');
  const isVisible = selectedCount > 0;

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isVisible
          ? tApprovals('bulkBar.selectionCount', { count: selectedCount })
          : tApprovals('bulkBar.selectionCleared')}
      </div>

      <div
        className={cn(
          APPROVAL_BULK_BAR_TOKENS.fixedBottom,
          isVisible ? APPROVAL_BULK_BAR_TOKENS.visible : APPROVAL_BULK_BAR_TOKENS.hidden
        )}
        aria-hidden={!isVisible}
        data-testid="inbound-bulk-action-bar"
      >
        {isVisible && (
          <GenericBulkActionBar
            selectedCount={selectedCount}
            totalCount={totalCount}
            isAllPageSelected={isAllPageSelected}
            isIndeterminate={isIndeterminate}
            onSelectAll={onSelectAll}
            onClear={onClearSelection}
            variant="inline"
            ariaLabel={t('inbound.bulk.receive')}
            className={APPROVAL_BULK_BAR_TOKENS.genericOverride}
            actions={
              <Button
                type="button"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                disabled={isPending}
                className={getApprovalActionButtonClasses('approve')}
              >
                <PackageCheck className="h-4 w-4 mr-1.5" aria-hidden="true" />
                {t('inbound.bulk.receive')} ({selectedCount})
              </Button>
            }
          />
        )}
      </div>

      <InboundBulkReceiveModal
        count={selectedCount}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={onBulkReceive}
        isPending={isPending}
      />
    </>
  );
}
