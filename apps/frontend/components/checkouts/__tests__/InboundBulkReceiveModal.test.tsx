/// <reference types="@testing-library/jest-dom" />

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { InboundBulkReceiveModal } from '../InboundBulkReceiveModal';
import type { BulkReceiveCondition } from '@/hooks/use-checkout-bulk-receive-mutation';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}));

jest.mock('@/lib/design-tokens/css-variables', () => ({
  CSS_VAR_NAMES: { touchTargetMin: '--touch-target-min' },
  cssVar: () => '44px',
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({
    open,
    onOpenChange,
    children,
  }: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    children: React.ReactNode;
  }) =>
    open ? (
      <div role="dialog" aria-modal="true">
        <button
          data-testid="dialog-overlay-close"
          onClick={() => onOpenChange(false)}
          type="button"
        />
        {children}
      </div>
    ) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, role }: { children: React.ReactNode; role?: string }) => (
    <div role={role ?? 'alert'}>{children}</div>
  ),
  AlertDescription: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

function deferred<T = void>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const baseProps = {
  count: 3,
  isOpen: true,
  onClose: jest.fn(),
  onConfirm: jest.fn().mockResolvedValue(undefined),
  isPending: false,
};

describe('InboundBulkReceiveModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('열린 상태에서 dialog role 렌더', () => {
    render(<InboundBulkReceiveModal {...baseProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('닫힌 상태에서 dialog 미렌더', () => {
    render(<InboundBulkReceiveModal {...baseProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('외관/작동 상태 버튼 기본값 정상 노출 (aria-pressed=true)', () => {
    render(<InboundBulkReceiveModal {...baseProps} />);
    const normalButtons = screen.getAllByRole('button', {
      name: /condition\.conditionStatus\.normal/i,
    });
    normalButtons.forEach((btn) => expect(btn).toHaveAttribute('aria-pressed', 'true'));
  });

  it('"모두 정상으로 수령 확인" 버튼 → onConfirm({ normal, normal }) 호출 후 onClose 실행', async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(<InboundBulkReceiveModal {...baseProps} onConfirm={onConfirm} onClose={onClose} />);

    await act(async () => {
      fireEvent.click(screen.getByText('inbound.receive.allNormal'));
    });

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining<Partial<BulkReceiveCondition>>({
        appearanceStatus: 'normal',
        operationStatus: 'normal',
      })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('이상 항목 선택 시 이상 상세 textarea 표시', () => {
    render(<InboundBulkReceiveModal {...baseProps} />);
    const abnormalButtons = screen.getAllByRole('button', {
      name: /condition\.conditionStatus\.abnormal/i,
    });
    fireEvent.click(abnormalButtons[0]);
    expect(screen.getByLabelText(/inbound\.receive\.abnormalDetails/i)).toBeInTheDocument();
  });

  it('이상 선택 후 이상 상세 미입력 → 유효성 에러', async () => {
    render(<InboundBulkReceiveModal {...baseProps} />);
    fireEvent.click(screen.getAllByRole('button', { name: /abnormal/ })[0]);

    await act(async () => {
      fireEvent.click(screen.getByText('inbound.receive.submit'));
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(baseProps.onConfirm).not.toHaveBeenCalled();
  });

  it('정상 상태 submit → onConfirm 호출 후 onClose', async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(<InboundBulkReceiveModal {...baseProps} onConfirm={onConfirm} onClose={onClose} />);

    await act(async () => {
      fireEvent.click(screen.getByText('inbound.receive.submit'));
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('onConfirm reject → dialog 유지 (retry 가능)', async () => {
    const dfd = deferred<void>();
    const onConfirm = jest.fn(() => dfd.promise);
    const onClose = jest.fn();
    render(<InboundBulkReceiveModal {...baseProps} onConfirm={onConfirm} onClose={onClose} />);

    fireEvent.click(screen.getByText('inbound.receive.submit'));

    await act(async () => {
      dfd.reject(new Error('network error'));
      try {
        await dfd.promise;
      } catch {
        // expected
      }
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('isPending=true 시 submit 버튼 disabled', () => {
    render(<InboundBulkReceiveModal {...baseProps} isPending={true} />);
    expect(screen.getByText('inbound.receive.submit')).toBeDisabled();
  });

  it('취소 버튼 → onClose 호출', () => {
    render(<InboundBulkReceiveModal {...baseProps} />);
    fireEvent.click(screen.getByText('inbound.receive.cancel'));
    expect(baseProps.onClose).toHaveBeenCalledTimes(1);
  });
});
