/// <reference types="@testing-library/jest-dom" />
import { fireEvent, render, screen } from '@testing-library/react';
import { CheckoutListPagination } from '../CheckoutListPagination';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}));

jest.mock('@/lib/design-tokens', () => ({
  CHECKOUT_PAGINATION_TOKENS: {
    container: 'pag-container',
    info: 'pag-info',
    buttons: 'pag-buttons',
    btn: {
      base: 'btn-base',
      default: 'btn-default',
      active: 'btn-active',
      disabled: 'btn-disabled',
    },
    ellipsis: 'pag-ellipsis',
  },
}));

const baseProps = {
  current: 1,
  totalPages: 1,
  total: 0,
  onPageChange: jest.fn(),
};

describe('CheckoutListPagination', () => {
  beforeEach(() => jest.clearAllMocks());

  it('현재 페이지에 aria-current="page"', () => {
    render(<CheckoutListPagination {...baseProps} current={3} totalPages={10} total={100} />);
    const active = screen.getByRole('button', { name: '3' });
    expect(active).toHaveAttribute('aria-current', 'page');
  });

  it('이전 버튼: current=1 일 때 disabled', () => {
    render(<CheckoutListPagination {...baseProps} current={1} totalPages={5} total={50} />);
    const prev = screen.getByRole('button', { name: 'actions.previous' });
    expect(prev).toBeDisabled();
  });

  it('다음 버튼: current=totalPages 일 때 disabled', () => {
    render(<CheckoutListPagination {...baseProps} current={5} totalPages={5} total={50} />);
    const next = screen.getByRole('button', { name: 'actions.next' });
    expect(next).toBeDisabled();
  });

  it('isLoading=true → 이전/다음 disabled (체감 안정성)', () => {
    render(
      <CheckoutListPagination {...baseProps} current={3} totalPages={10} total={100} isLoading />
    );
    expect(screen.getByRole('button', { name: 'actions.previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'actions.next' })).toBeDisabled();
  });

  it('페이지 번호 클릭 → onPageChange 호출 (currentPage와 다른 경우만)', () => {
    const onPageChange = jest.fn();
    render(
      <CheckoutListPagination
        {...baseProps}
        current={3}
        totalPages={10}
        total={100}
        onPageChange={onPageChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    expect(onPageChange).toHaveBeenCalledWith(5);
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).toHaveBeenCalledTimes(1); // 동일 페이지 클릭 무시
  });

  it('이전/다음 클릭 → 인접 페이지 이동', () => {
    const onPageChange = jest.fn();
    render(
      <CheckoutListPagination
        {...baseProps}
        current={5}
        totalPages={10}
        total={100}
        onPageChange={onPageChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'actions.previous' }));
    expect(onPageChange).toHaveBeenLastCalledWith(4);
    fireEvent.click(screen.getByRole('button', { name: 'actions.next' }));
    expect(onPageChange).toHaveBeenLastCalledWith(6);
  });

  it('첫/끝 페이지 + 줄임표 — current 중심 윈도(±2) 밖이면 ellipsis', () => {
    render(<CheckoutListPagination {...baseProps} current={5} totalPages={20} total={200} />);
    // current=5 → window: 3,4,5,6,7. 1...3..7...20
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '20' })).toBeInTheDocument();
    expect(screen.getAllByText('…').length).toBeGreaterThanOrEqual(1);
  });

  it('paginationInfo i18n params — total/from/to', () => {
    render(
      <CheckoutListPagination {...baseProps} current={2} totalPages={5} total={47} pageSize={10} />
    );
    // 2 페이지 (10 per page) → from=11, to=20
    expect(screen.getByText(/total":47/)).toBeInTheDocument();
    expect(screen.getByText(/from":11/)).toBeInTheDocument();
    expect(screen.getByText(/to":20/)).toBeInTheDocument();
  });
});
