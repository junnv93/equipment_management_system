/// <reference types="@testing-library/jest-dom" />
import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// 실 i18n 메시지 lookup — namespace resolver 패턴 (StatusBadge.test.tsx 정합).
import qrMessages from '../../../messages/ko/qr.json';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('next-intl', () => {
  const get = (path: string): string => {
    const parts = path.split('.');
    let cur: unknown = qrMessages;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        return path;
      }
    }
    return typeof cur === 'string' ? cur : path;
  };
  return {
    useTranslations: (namespace?: string) => (key: string, vars?: Record<string, unknown>) => {
      if (!namespace) return get(key);
      const ns = namespace.replace(/^qr\./, '');
      const raw = get(`${ns}.${key}`);
      if (vars && typeof raw === 'string') {
        return Object.entries(vars).reduce(
          (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
          raw
        );
      }
      return raw;
    },
    useLocale: () => 'ko',
  };
});

// MobileBottomSheet — Radix portal 우회 위해 단순 div 렌더.
jest.mock('../MobileBottomSheet', () => ({
  MobileBottomSheet: ({
    children,
    open,
    title,
  }: {
    children: React.ReactNode;
    open: boolean;
    title?: string;
    onOpenChange?: (open: boolean) => void;
    description?: string;
    showHandle?: boolean;
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

import { HandoverPickerSheet } from '../HandoverPickerSheet';
import type { HandoverItem } from '@equipment-management/schemas';

const baseItem: HandoverItem = {
  id: '11111111-2222-3333-4444-555555555555',
  type: 'receive',
  lenderTeamName: '교정팀 A',
  lenderSiteLabel: '수원랩',
  borrowerSiteLabel: '평택랩',
  checkedAt: '2026-05-12T09:00:00.000Z',
  lastCheck: {
    appearance: 'normal',
    operation: 'normal',
    accessories: 'complete',
  },
  inspectorName: '홍길동',
};

const secondItem: HandoverItem = {
  ...baseItem,
  id: 'aaaa1111-bbbb-2222-cccc-333333333333',
  lenderSiteLabel: '평택랩',
  borrowerSiteLabel: '오리지널랩',
  inspectorName: '김철수',
  lastCheck: {
    appearance: 'abnormal',
    operation: 'normal',
    accessories: undefined,
  },
};

describe('HandoverPickerSheet', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('open=true + 2 handovers → 카드 2개 렌더', () => {
    render(
      <HandoverPickerSheet open={true} onOpenChange={() => {}} handovers={[baseItem, secondItem]} />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
  });

  it('카드 클릭 시 router.push(FRONTEND_ROUTES.CHECKOUTS.CHECK_WITH_STEP) 호출', () => {
    const onOpenChange = jest.fn();
    render(<HandoverPickerSheet open={true} onOpenChange={onOpenChange} handovers={[baseItem]} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush.mock.calls[0][0]).toContain(baseItem.id);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('type="return" 항목 클릭 시 lender_return step 라우팅', () => {
    const returnItem: HandoverItem = { ...baseItem, type: 'return' };
    render(<HandoverPickerSheet open={true} onOpenChange={() => {}} handovers={[returnItem]} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(mockPush.mock.calls[0][0]).toContain('lender_return');
  });

  it('open=false → 컴포넌트 visible 0 (sheet 닫힘)', () => {
    render(<HandoverPickerSheet open={false} onOpenChange={() => {}} handovers={[baseItem]} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('lastCheck.accessories === undefined → accessories badge 미렌더', () => {
    render(<HandoverPickerSheet open={true} onOpenChange={() => {}} handovers={[secondItem]} />);
    // secondItem.accessories === undefined → '부속' 텍스트 미노출
    expect(screen.queryByText(/부속/)).not.toBeInTheDocument();
  });

  it('lastCheck.appearance="abnormal" → urgent tone 결합 (a11y/시각 SSOT)', () => {
    const { container } = render(
      <HandoverPickerSheet open={true} onOpenChange={() => {}} handovers={[secondItem]} />
    );
    // urgent tone class 가 적용된 span 1개 이상 (외관 abnormal 결합 검증)
    const urgentSpans = container.querySelectorAll('[class*="brand-urgent"]');
    expect(urgentSpans.length).toBeGreaterThanOrEqual(1);
  });

  it('role="dialog" + title aria-label (MobileBottomSheet a11y 정합)', () => {
    render(<HandoverPickerSheet open={true} onOpenChange={() => {}} handovers={[baseItem]} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog.getAttribute('aria-label')).toBeTruthy();
  });
});
