/// <reference types="@testing-library/jest-dom" />

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RejectModal from '../RejectModal';
import checkoutApi from '@/lib/api/checkout-api';

jest.mock('@/lib/api/approvals-api', () => ({
  REJECTION_MIN_LENGTH: 5,
  REJECTION_MAX_LENGTH: 1000,
  RejectReasonSchema: {
    safeParse: (value: string) =>
      value.length >= 5
        ? { success: true }
        : { success: false, error: { issues: [{ message: 'min' }] } },
  },
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}));

jest.mock('@/lib/i18n/use-enum-labels', () => ({
  useSiteLabels: () => ({}),
}));

jest.mock('@/lib/utils/approval-summary-utils', () => ({
  getLocalizedSummary: () => 'approval summary',
}));

jest.mock('@/lib/design-tokens', () => ({
  getApprovalActionButtonClasses: () => '',
}));

jest.mock('@/components/common/CharsCounter', () => ({
  CharsCounter: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children, id }: { children: React.ReactNode; id?: string }) => (
    <p id={id}>{children}</p>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({
    children,
    onValueChange,
  }: {
    children: React.ReactNode;
    onValueChange: (value: string) => void;
  }) => (
    <select aria-label="template" onChange={(event) => onValueChange(event.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <option value="">{placeholder}</option>
  ),
}));

jest.mock('@/lib/api/checkout-api', () => ({
  __esModule: true,
  default: {
    getRejectionPresets: jest.fn(),
  },
}));

const approvalItem = {
  id: 'approval-1',
  type: 'checkout',
  title: 'Checkout',
  status: 'pending',
} as never;

describe('RejectModal', () => {
  beforeEach(() => {
    jest.mocked(checkoutApi.getRejectionPresets).mockResolvedValue([
      {
        id: 'preset-1',
        label: '서류 보완 필요',
        template: '필수 첨부 문서가 누락되어 보완이 필요합니다.',
        isDefault: true,
        sortOrder: 1,
      },
    ]);
  });

  it('loads DB-backed rejection presets and fills the reason from a selected preset', async () => {
    render(
      <RejectModal
        mode="single"
        item={approvalItem}
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(checkoutApi.getRejectionPresets).toHaveBeenCalledTimes(1);
      expect(screen.getByText('서류 보완 필요')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('template'), {
      target: { value: '필수 첨부 문서가 누락되어 보완이 필요합니다.' },
    });

    expect(screen.getByLabelText('rejectModal.reasonLabel *')).toHaveValue(
      '필수 첨부 문서가 누락되어 보완이 필요합니다.'
    );
  });
});
