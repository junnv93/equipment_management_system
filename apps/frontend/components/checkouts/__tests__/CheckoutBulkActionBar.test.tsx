/// <reference types="@testing-library/jest-dom" />

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CheckoutBulkActionBar } from '../CheckoutBulkActionBar';

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

jest.mock('@/components/approvals/RejectModal', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="reject-modal-bulk" /> : null,
}));

const baseProps = {
  selectedCount: 5,
  totalCount: 12,
  isAllPageSelected: false,
  isIndeterminate: true,
  onSelectAll: jest.fn(),
  onClearSelection: jest.fn(),
};

function deferred<T = void>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('CheckoutBulkActionBar — mutateAsync UX consistency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Confirm 클릭 → onBulkApprove resolve 후 dialog close (fire-and-forget 차단)', async () => {
    const dfd = deferred<void>();
    const onBulkApprove = jest.fn(() => dfd.promise);
    render(<CheckoutBulkActionBar {...baseProps} onBulkApprove={onBulkApprove} />);

    fireEvent.click(screen.getByText(/^bulk\.approve \(5\)$/));
    fireEvent.click(screen.getByTestId('bulk-confirm'));

    expect(onBulkApprove).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-confirm')).toBeDisabled();

    await act(async () => {
      dfd.resolve();
      await dfd.promise;
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('reject 시 dialog 유지 + isProcessing 해제', async () => {
    const dfd = deferred<void>();
    const onBulkApprove = jest.fn(() => dfd.promise);
    render(<CheckoutBulkActionBar {...baseProps} onBulkApprove={onBulkApprove} />);

    fireEvent.click(screen.getByText(/^bulk\.approve \(5\)$/));
    fireEvent.click(screen.getByTestId('bulk-confirm'));

    await act(async () => {
      dfd.reject(new Error('500'));
      try {
        await dfd.promise;
      } catch {
        /* noop */
      }
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('bulk-confirm')).not.toBeDisabled();
    });
  });

  it('isPending=true → 진입점 버튼 disabled (mutation 진행 중 재클릭 차단)', () => {
    render(<CheckoutBulkActionBar {...baseProps} onBulkApprove={jest.fn()} isPending />);
    const approveButton = screen.getByText(/^bulk\.approve \(5\)$/).closest('button');
    expect(approveButton).toBeDisabled();
  });
});
