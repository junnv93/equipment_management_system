/// <reference types="@testing-library/jest-dom" />

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BulkActionBar } from '../BulkActionBar';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}));

jest.mock('@/lib/design-tokens', () => ({
  APPROVAL_BULK_BAR_TOKENS: {
    fixedBottom: 'fixed-bottom',
    visible: 'visible',
    hidden: 'hidden',
    genericOverride: 'generic-override',
  },
  getApprovalActionButtonClasses: () => '',
}));

jest.mock('@/components/common/BulkActionBar', () => ({
  BulkActionBar: ({ actions }: { actions: React.ReactNode }) => <div>{actions}</div>,
}));

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
  AlertDialogAction: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button data-testid="bulk-confirm" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  AlertDialogCancel: ({
    children,
    disabled,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
  }) => (
    <button data-testid="bulk-cancel" disabled={disabled}>
      {children}
    </button>
  ),
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

jest.mock('../RejectModal', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="reject-modal-bulk" /> : null,
}));

const baseProps = {
  selectedCount: 3,
  totalCount: 10,
  isAllPageSelected: false,
  isIndeterminate: true,
  onSelectAll: jest.fn(),
  onClearSelection: jest.fn(),
  actionLabel: 'Approve',
};

function deferred<T = void>(): {
  promise: Promise<T>;
  resolve: (v: T) => void;
  reject: (e: unknown) => void;
} {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('BulkActionBar (approvals) — mutateAsync UX consistency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('AlertDialog는 onBulkApprove resolve 후에만 close된다 (fire-and-forget 차단)', async () => {
    const dfd = deferred<void>();
    const onBulkApprove = jest.fn(() => dfd.promise);
    render(<BulkActionBar {...baseProps} onBulkApprove={onBulkApprove} />);

    // 일괄 승인 버튼 → AlertDialog open
    fireEvent.click(screen.getByText(/^Approve \(3\)$/));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Confirm 클릭 → onBulkApprove 호출 (pending)
    fireEvent.click(screen.getByTestId('bulk-confirm'));
    expect(onBulkApprove).toHaveBeenCalledTimes(1);

    // pending 동안 dialog 유지 + 버튼 disabled (isProcessing)
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-confirm')).toBeDisabled();
    expect(screen.getByTestId('bulk-cancel')).toBeDisabled();

    // resolve → dialog close
    await act(async () => {
      dfd.resolve();
      await dfd.promise;
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('AlertDialog는 onBulkApprove reject 시 dialog 유지 + isProcessing 해제', async () => {
    const dfd = deferred<void>();
    const onBulkApprove = jest.fn(() => dfd.promise);
    render(<BulkActionBar {...baseProps} onBulkApprove={onBulkApprove} />);

    fireEvent.click(screen.getByText(/^Approve \(3\)$/));
    fireEvent.click(screen.getByTestId('bulk-confirm'));

    // reject (네트워크/서버 5xx) — internal catch가 swallow + dialog 유지
    await act(async () => {
      dfd.reject(new Error('500'));
      try {
        await dfd.promise;
      } catch {
        /* noop */
      }
    });

    await waitFor(() => {
      // dialog 유지 (사용자가 cancel/retry 결정)
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      // isProcessing 해제 (finally)
      expect(screen.getByTestId('bulk-confirm')).not.toBeDisabled();
      expect(screen.getByTestId('bulk-cancel')).not.toBeDisabled();
    });
  });

  it('selectedCount 0 → aria-hidden="true" (DOM 유지)', () => {
    render(<BulkActionBar {...baseProps} selectedCount={0} onBulkApprove={jest.fn()} />);
    const bar = screen.getByTestId('bulk-action-bar');
    expect(bar).toHaveAttribute('aria-hidden', 'true');
  });

  it('onBulkReject 미지정 → 반려 버튼 + RejectModal 미표시 (AR-8 canReject:false)', () => {
    render(<BulkActionBar {...baseProps} onBulkApprove={jest.fn()} />);
    expect(screen.queryByText('bulk.reject')).not.toBeInTheDocument();
    expect(screen.queryByTestId('reject-modal-bulk')).not.toBeInTheDocument();
  });
});
