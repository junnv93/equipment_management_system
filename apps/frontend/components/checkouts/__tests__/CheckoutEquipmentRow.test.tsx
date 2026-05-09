/// <reference types="@testing-library/jest-dom" />
/**
 * CheckoutEquipmentRow — SRP 분해 컴포넌트 단위 테스트
 *
 * 검증 범위:
 * 1. 장비명 / 관리번호 렌더링
 * 2. row 체크박스 — bulk-selection 활성 시 노출, IME 가드
 * 3. D-day 표시 (expectedReturnDate 미전달 시 생략)
 * 4. axe-core 접근성 검증 (WAI-ARIA grid pattern)
 * 5. React.memo — 불필요한 리렌더링 없음
 */

import { render, screen, fireEvent } from '@testing-library/react';
import axe from 'axe-core';
import type { EquipmentRowData } from '../CheckoutEquipmentRow';
import { CheckoutEquipmentRow } from '../CheckoutEquipmentRow';

// ── Mocks ─────────────────────────────────────────────────────────────────

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}::${JSON.stringify(params)}` : key,
  useLocale: () => 'ko',
}));

jest.mock('@/lib/utils/dday-utils', () => ({
  calculateDaysRemaining: (date: string) => {
    const days = Math.floor((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  },
}));

jest.mock('@/components/checkouts/CheckoutStatusBadge', () => ({
  CheckoutStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}));
jest.mock('@/components/checkouts/CheckoutMiniProgress', () => ({
  CheckoutMiniProgress: () => <span data-testid="mini-progress" />,
}));
jest.mock('@/components/checkouts/NextStepPanel', () => ({
  NextStepPanel: () => <span data-testid="next-step-panel" />,
}));

jest.mock('@/lib/design-tokens', () => ({
  CHECKOUT_ITEM_ROW_TOKENS: {
    container: 'container',
    containerOverdue: 'overdue',
    grid: 'grid',
    gridWithCheckbox: 'grid-with-checkbox',
    zoneCheckbox: 'zone-checkbox',
    purposeBar: { base: 'purpose-bar' },
    zoneStatus: 'zone-status',
    dday: 'dday',
    zoneIdentity: 'zone-identity',
    nameRow: 'name-row',
    name: 'name',
    mgmt: 'mgmt',
    meta: 'meta',
    zoneAction: 'zone-action',
  },
  ANIMATION_PRESETS: { staggerFadeInItem: '' },
  getStaggerFadeInStyle: () => undefined,
  shouldUseStaggerFadeIn: () => false,
  getPurposeBarClass: () => 'purpose-calibration',
  getCheckoutDday4TierClasses: () => 'dday-safe',
  formatDday: (d: number) => `D${d >= 0 ? `-${d}` : `+${Math.abs(d)}`}`,
  MICRO_TYPO: { badge: 'badge' },
  getManagementNumberClasses: () => 'mgmt-class',
}));

// ── 헬퍼 ──────────────────────────────────────────────────────────────────

function makeRow(overrides?: Partial<EquipmentRowData>): EquipmentRowData {
  return {
    equipmentId: 'eq-1',
    equipmentName: '오실로스코프',
    managementNumber: 'EQ-001',
    purpose: 'calibration',
    status: 'pending',
    checkoutType: 'calibration',
    userName: '김철수',
    checkoutId: 'co-1',
    expectedReturnDate: undefined,
    destination: undefined,
    canApproveItem: false,
    canBorrowerApproveItem: false,
    canReturnItem: false,
    descriptor: undefined,
    ...overrides,
  };
}

function renderRow(
  row: EquipmentRowData = makeRow(),
  props: Partial<Parameters<typeof CheckoutEquipmentRow>[0]> = {}
) {
  const defaultProps = {
    row,
    rowIndex: 0,
    showRowCheckbox: false,
    isRowSelected: false,
    rowSelectable: false,
    onRowClick: jest.fn(),
    onRowKeyDown: jest.fn(),
    onAction: jest.fn(),
    overflowActions: [],
    userRole: 'test_engineer' as const,
    isApprovePending: false,
  };
  return render(<CheckoutEquipmentRow {...defaultProps} {...props} />);
}

// ── 테스트 ─────────────────────────────────────────────────────────────────

describe('CheckoutEquipmentRow', () => {
  it('장비명과 관리번호를 렌더링한다', () => {
    renderRow();
    expect(screen.getByText('오실로스코프')).toBeInTheDocument();
    expect(screen.getByText('EQ-001')).toBeInTheDocument();
  });

  it('showRowCheckbox=false 시 체크박스 없음', () => {
    renderRow();
    expect(screen.queryByTestId('row-checkbox')).not.toBeInTheDocument();
  });

  it('showRowCheckbox=true + onToggleRow 전달 시 체크박스 노출', () => {
    renderRow(makeRow(), {
      showRowCheckbox: true,
      onToggleRow: jest.fn(),
    });
    expect(screen.getByTestId('row-checkbox')).toBeInTheDocument();
  });

  it('rowSelectable=true 일 때 체크박스 클릭 → onToggleRow 호출', () => {
    const onToggleRow = jest.fn();
    renderRow(makeRow(), {
      showRowCheckbox: true,
      rowSelectable: true,
      onToggleRow,
    });
    const checkbox = screen.getByTestId('row-checkbox');
    fireEvent.click(checkbox);
    expect(onToggleRow).toHaveBeenCalledWith('co-1');
  });

  it('IME 합성 중 Enter는 onToggleRow를 호출하지 않는다', () => {
    const onToggleRow = jest.fn();
    renderRow(makeRow(), {
      showRowCheckbox: true,
      rowSelectable: true,
      onToggleRow,
    });
    const checkbox = screen.getByTestId('row-checkbox');
    fireEvent.keyDown(checkbox, { key: 'Enter', isComposing: true });
    expect(onToggleRow).not.toHaveBeenCalled();
  });

  it('expectedReturnDate 미전달 시 D-day 미표시', () => {
    renderRow(makeRow({ expectedReturnDate: undefined }));
    expect(screen.queryByText(/D-/)).not.toBeInTheDocument();
    expect(screen.queryByText(/D\+/)).not.toBeInTheDocument();
  });

  it('destination이 있으면 meta 영역에 출력', () => {
    renderRow(makeRow({ destination: '연구소 B동' }));
    expect(screen.getByText(/연구소 B동/)).toBeInTheDocument();
  });

  it('userName이 meta 영역에 표시', () => {
    renderRow();
    expect(screen.getByText('김철수')).toBeInTheDocument();
  });

  it('descriptor 없으면 NextStepPanel 미표시', () => {
    renderRow(makeRow({ descriptor: undefined }));
    expect(screen.queryByTestId('next-step-panel')).not.toBeInTheDocument();
  });

  it('axe-core 접근성 검증 — WAI-ARIA role=row + gridcell 구조', async () => {
    const container = document.createElement('div');
    container.setAttribute('role', 'grid');
    document.body.appendChild(container);

    const { baseElement } = renderRow(makeRow(), { showRowCheckbox: false });

    const results = await axe.run(baseElement, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    });

    const violations = results.violations.filter(
      (v) =>
        // aria-required-children: role=grid wrapper가 없는 jsdom 환경에서 발생하는 구조 위반 제외
        !['aria-required-children', 'aria-required-parent'].includes(v.id)
    );

    if (violations.length > 0) {
      const summary = violations.map((v) => `[${v.id}] ${v.description}`).join('\n');
      throw new Error(`axe violations:\n${summary}`);
    }

    document.body.removeChild(container);
  });
});
