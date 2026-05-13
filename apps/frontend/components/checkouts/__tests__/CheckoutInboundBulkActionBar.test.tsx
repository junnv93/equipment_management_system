/// <reference types="@testing-library/jest-dom" />

import { fireEvent, render, screen } from '@testing-library/react';
import { CheckoutInboundBulkActionBar } from '../CheckoutInboundBulkActionBar';

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

jest.mock('../InboundBulkReceiveModal', () => ({
  InboundBulkReceiveModal: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    count: number;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    isPending?: boolean;
  }) =>
    isOpen ? (
      <div role="dialog" data-testid="inbound-receive-modal">
        <button data-testid="modal-close" onClick={onClose} type="button">
          close
        </button>
      </div>
    ) : null,
}));

const baseProps = {
  selectedCount: 3,
  totalCount: 10,
  isAllPageSelected: false,
  isIndeterminate: true,
  onSelectAll: jest.fn(),
  onClearSelection: jest.fn(),
  onBulkReceive: jest.fn().mockResolvedValue(undefined),
  isPending: false,
};

describe('CheckoutInboundBulkActionBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('selectedCount > 0 시 data-testid=inbound-bulk-action-bar 노출', () => {
    render(<CheckoutInboundBulkActionBar {...baseProps} />);
    expect(screen.getByTestId('inbound-bulk-action-bar')).toBeInTheDocument();
  });

  it('selectedCount === 0 시 aria-hidden=true (숨김)', () => {
    render(<CheckoutInboundBulkActionBar {...baseProps} selectedCount={0} />);
    const bar = screen.getByTestId('inbound-bulk-action-bar');
    expect(bar).toHaveAttribute('aria-hidden', 'true');
  });

  it('선택 건수 버튼 클릭 → InboundBulkReceiveModal 열림', () => {
    render(<CheckoutInboundBulkActionBar {...baseProps} />);
    expect(screen.queryByTestId('inbound-receive-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/inbound\.bulk\.receive \(3\)/i));
    expect(screen.getByTestId('inbound-receive-modal')).toBeInTheDocument();
  });

  it('모달 닫기 → 모달 제거', () => {
    render(<CheckoutInboundBulkActionBar {...baseProps} />);
    fireEvent.click(screen.getByText(/inbound\.bulk\.receive \(3\)/i));
    expect(screen.getByTestId('inbound-receive-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('modal-close'));
    expect(screen.queryByTestId('inbound-receive-modal')).not.toBeInTheDocument();
  });

  it('aria-live="polite" SR 알림 영역 존재', () => {
    render(<CheckoutInboundBulkActionBar {...baseProps} />);
    // mock useTranslations → key:JSON — 임의 pattern으로 sr-only div 찾기
    const srRegion = screen.getByText(/bulkBar\.selectionCount/i);
    expect(srRegion.closest('[aria-live]')).toHaveAttribute('aria-live', 'polite');
  });

  it('isPending=true 시 수령 확인 버튼 disabled', () => {
    render(<CheckoutInboundBulkActionBar {...baseProps} isPending={true} />);
    const receiveBtn = screen.getByText(/inbound\.bulk\.receive \(3\)/i);
    expect(receiveBtn.closest('button')).toBeDisabled();
  });
});
