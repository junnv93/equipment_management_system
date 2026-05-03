/// <reference types="@testing-library/jest-dom" />
/**
 * CheckoutGroupCard 헤더 indeterminate 체크박스 테스트 — Sprint 4.5 S3
 *
 * 검증 범위는 **그룹 헤더 체크박스 prop API + 3-state 동작**으로 한정.
 * 데이터 그리드 렌더링/액션 디스패치 등 기존 기능은 본 테스트 범위 외.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import CheckoutGroupCard from '../CheckoutGroupCard';
import type { CheckoutGroup } from '@/lib/utils/checkout-group-utils';
import type { Checkout } from '@/lib/api/checkout-api';
import { CHECKOUT_ITEM_ROW_TOKENS } from '@/lib/design-tokens';

// ── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params) return `${key}::${JSON.stringify(params)}`;
    return key;
  },
  useLocale: () => 'ko',
}));

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { role: 'test_engineer', teamId: 'team1' } } }),
}));

jest.mock('@/hooks/use-checkout-group-descriptors', () => ({
  useCheckoutGroupDescriptors: () => new Map(),
}));

jest.mock('@/hooks/use-checkout-card-mutations', () => ({
  useApproveCheckoutMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useBorrowerApproveCheckoutMutation: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('@/components/checkouts/CheckoutStatusBadge', () => ({
  CheckoutStatusBadge: () => null,
}));
jest.mock('@/components/checkouts/CheckoutMiniProgress', () => ({
  CheckoutMiniProgress: () => null,
}));
jest.mock('@/components/checkouts/CheckoutPhaseIndicator', () => ({
  CheckoutPhaseIndicator: () => null,
}));
jest.mock('@/components/checkouts/NextStepPanel', () => ({
  NextStepPanel: () => null,
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeCheckout(id: string, status = 'pending'): Checkout {
  return {
    id,
    status,
    purpose: 'calibration',
    user: { name: '홍길동' },
    equipment: [
      {
        id: `eq-${id}`,
        name: 'Equipment',
        managementNumber: 'MGMT-001',
      },
    ],
    expectedReturnDate: undefined,
    destination: 'Lab',
    meta: { availableActions: {} },
  } as unknown as Checkout;
}

function makeGroup(checkoutIds: readonly string[]): CheckoutGroup {
  return {
    key: 'k',
    date: '2026-04-30',
    latestCreatedAt: '2026-04-30T00:00:00Z',
    dateLabel: 'checkouts.groupCard.checkoutDateLabel',
    dateLabelKey: 'checkouts.groupCard.checkoutDateLabel',
    destination: 'Lab',
    checkouts: checkoutIds.map((id) => makeCheckout(id)),
    totalEquipment: checkoutIds.length,
    statuses: [],
    purposes: ['calibration'],
  } as CheckoutGroup;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('CheckoutGroupCard 헤더 체크박스 — prop API', () => {
  it('selectedRowIds prop 미전달 시 헤더 체크박스 hidden (후방호환)', () => {
    render(<CheckoutGroupCard group={makeGroup(['c1', 'c2'])} onCheckoutClick={() => undefined} />);
    expect(screen.queryByTestId('group-header-checkbox')).not.toBeInTheDocument();
  });

  it('selectedRowIds + onToggleGroup 전달 시 헤더 체크박스 visible', () => {
    render(
      <CheckoutGroupCard
        group={makeGroup(['c1', 'c2'])}
        onCheckoutClick={() => undefined}
        selectedRowIds={new Set()}
        onToggleGroup={() => undefined}
      />
    );
    expect(screen.getByTestId('group-header-checkbox')).toBeInTheDocument();
  });
});

describe('CheckoutGroupCard 헤더 체크박스 — 3-state 동작', () => {
  it('선택 0건: data-state=unchecked, aria-checked=false', () => {
    render(
      <CheckoutGroupCard
        group={makeGroup(['c1', 'c2'])}
        onCheckoutClick={() => undefined}
        selectedRowIds={new Set()}
        onToggleGroup={() => undefined}
      />
    );
    const checkbox = screen.getByTestId('group-header-checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'unchecked');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('선택 일부: data-state=indeterminate, aria-checked=mixed (Radix 자동)', () => {
    render(
      <CheckoutGroupCard
        group={makeGroup(['c1', 'c2', 'c3'])}
        onCheckoutClick={() => undefined}
        selectedRowIds={new Set(['c1'])}
        onToggleGroup={() => undefined}
      />
    );
    const checkbox = screen.getByTestId('group-header-checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
    expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
  });

  it('선택 전체: data-state=checked, aria-checked=true', () => {
    render(
      <CheckoutGroupCard
        group={makeGroup(['c1', 'c2'])}
        onCheckoutClick={() => undefined}
        selectedRowIds={new Set(['c1', 'c2'])}
        onToggleGroup={() => undefined}
      />
    );
    const checkbox = screen.getByTestId('group-header-checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'checked');
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
  });
});

describe('CheckoutGroupCard 헤더 체크박스 — 콜백', () => {
  it('미선택 → 클릭: onToggleGroup({rowIds, allSelected:false})', () => {
    const onToggle = jest.fn();
    render(
      <CheckoutGroupCard
        group={makeGroup(['c1', 'c2'])}
        onCheckoutClick={() => undefined}
        selectedRowIds={new Set()}
        onToggleGroup={onToggle}
      />
    );
    fireEvent.click(screen.getByTestId('group-header-checkbox'));
    expect(onToggle).toHaveBeenCalledWith(['c1', 'c2'], false);
  });

  it('전체 선택 → 클릭: onToggleGroup({rowIds, allSelected:true})', () => {
    const onToggle = jest.fn();
    render(
      <CheckoutGroupCard
        group={makeGroup(['c1', 'c2'])}
        onCheckoutClick={() => undefined}
        selectedRowIds={new Set(['c1', 'c2'])}
        onToggleGroup={onToggle}
      />
    );
    fireEvent.click(screen.getByTestId('group-header-checkbox'));
    expect(onToggle).toHaveBeenCalledWith(['c1', 'c2'], true);
  });

  it('한글 IME 합성 중 Enter는 토글하지 않음 (nativeEvent.isComposing 가드)', () => {
    const onToggle = jest.fn();
    render(
      <CheckoutGroupCard
        group={makeGroup(['c1', 'c2'])}
        onCheckoutClick={() => undefined}
        selectedRowIds={new Set()}
        onToggleGroup={onToggle}
      />
    );
    const checkbox = screen.getByTestId('group-header-checkbox');
    // KeyboardEvent의 isComposing은 readonly이지만 nativeEvent에서 시뮬레이션
    fireEvent.keyDown(checkbox, { key: 'Enter', isComposing: true });
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('Space 키 토글 (Radix 기본 동작)', () => {
    const onToggle = jest.fn();
    render(
      <CheckoutGroupCard
        group={makeGroup(['c1', 'c2'])}
        onCheckoutClick={() => undefined}
        selectedRowIds={new Set()}
        onToggleGroup={onToggle}
      />
    );
    const checkbox = screen.getByTestId('group-header-checkbox');
    fireEvent.keyDown(checkbox, { key: ' ' });
    expect(onToggle).toHaveBeenCalledWith(['c1', 'c2'], false);
  });
});

describe('CheckoutGroupCard 행 모바일 스택 토큰', () => {
  it('Zone 4 action 영역은 모바일에서 identity 아래로 스택되고 sm 이상에서 4열로 복귀한다', () => {
    expect(CHECKOUT_ITEM_ROW_TOKENS.grid).toContain('grid-cols-[3px_72px_1fr]');
    expect(CHECKOUT_ITEM_ROW_TOKENS.grid).toContain('sm:grid-cols-[3px_72px_1fr_auto]');
    expect(CHECKOUT_ITEM_ROW_TOKENS.zoneAction).toContain('col-start-3');
    expect(CHECKOUT_ITEM_ROW_TOKENS.zoneAction).toContain('min-w-0');
    expect(CHECKOUT_ITEM_ROW_TOKENS.zoneAction).toContain('justify-end');
    expect(CHECKOUT_ITEM_ROW_TOKENS.zoneAction).toContain('sm:col-auto');
    expect(CHECKOUT_ITEM_ROW_TOKENS.zoneAction).toContain('sm:shrink-0');
  });
});
