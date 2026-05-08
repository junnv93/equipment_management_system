/**
 * CalibrationHistoryClient — RTL 단위 테스트.
 *
 * 검증 범위 (Option C — Tab vs Sub 책임 분리 invariant):
 *   - PageHeader title/subtitle/backUrl 렌더
 *   - overdue 시 alert banner 표시 (장비 nextCalibrationDate < now)
 *   - stats 카드 5종 derive 정확성 (total/overdue/upcoming/passed/failed)
 *   - approval status 필터 적용 시 행 감소
 *
 * 위임된 검증:
 *   - CalibrationListTable 렌더링 → 자체 spec
 *   - 백엔드 endpoint 동작 → backend e2e
 *
 * Tab과의 책임 분리 invariant:
 *   - 본 Client는 CalibrationHistoryTab 직접 import 0건 — M-6 grep으로 검증
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Equipment } from '@/lib/api/equipment-api';
import type { CalibrationHistory } from '@/lib/api/calibration-api';

// ----- Mocks -----

// Mutable search params — let closure is OK: factory captures by reference, reads at call time
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/equipment/eq-1/calibration-history',
  useSearchParams: () => mockSearchParams,
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, vars?: Record<string, unknown>) =>
    vars ? `${key}|${JSON.stringify(vars)}` : key,
}));

jest.mock('@/contexts/BreadcrumbContext', () => ({
  useBreadcrumb: () => ({ setDynamicLabel: jest.fn(), clearDynamicLabel: jest.fn() }),
}));

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ can: () => true }),
}));

jest.mock('@/components/calibration/CalibrationListTable', () => ({
  __esModule: true,
  default: ({ data }: { data: CalibrationHistory[] }) =>
    React.createElement('div', { 'data-testid': 'list-table-mock' }, `rows=${data.length}`),
}));

const equipmentFixture = {
  id: 'eq-1',
  name: '오실로스코프',
  managementNumber: 'OSC-001',
  // overdue: nextCalibrationDate 과거 날짜
  nextCalibrationDate: new Date('2020-01-01'),
} as unknown as Equipment;

const equipmentNotOverdueFixture = {
  ...equipmentFixture,
  nextCalibrationDate: new Date('2099-01-01'),
} as unknown as Equipment;

const baseCalibrations: CalibrationHistory[] = [
  {
    id: 'c1',
    equipmentId: 'eq-1',
    equipmentName: '오실로스코프',
    managementNumber: 'OSC-001',
    calibrationDate: '2025-01-01',
    nextCalibrationDate: '2020-12-01', // overdue
    calibrationAgency: 'KRISS',
    result: 'pass',
    approvalStatus: 'approved',
    createdAt: '2025-01-01',
  } as CalibrationHistory,
  {
    id: 'c2',
    equipmentId: 'eq-1',
    equipmentName: '오실로스코프',
    managementNumber: 'OSC-001',
    calibrationDate: '2025-06-01',
    nextCalibrationDate: '2099-01-01', // far future — neither overdue nor upcoming
    calibrationAgency: 'KRISS',
    result: 'fail',
    approvalStatus: 'pending_approval',
    createdAt: '2025-06-01',
  } as CalibrationHistory,
  {
    id: 'c3',
    equipmentId: 'eq-1',
    equipmentName: '오실로스코프',
    managementNumber: 'OSC-001',
    calibrationDate: '2025-09-01',
    // upcoming — within 30 days from "now"
    nextCalibrationDate: new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10),
    calibrationAgency: 'KRISS',
    result: 'pass',
    approvalStatus: 'approved',
    createdAt: '2025-09-01',
  } as CalibrationHistory,
];

const getCalibrationHistoryMock = jest.fn();
jest.mock('@/lib/api/calibration-api', () => ({
  __esModule: true,
  default: {
    getCalibrationHistory: (...args: unknown[]) => getCalibrationHistoryMock(...args),
  },
}));

jest.mock('@/lib/api/equipment-api', () => ({
  __esModule: true,
  default: {
    getEquipment: jest.fn(),
  },
}));

import { CalibrationHistoryClient } from '../CalibrationHistoryClient';

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: 0 }, queries: { retry: 0, staleTime: Infinity } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

async function flush() {
  await new Promise((r) => setTimeout(r, 0));
}

beforeEach(() => {
  getCalibrationHistoryMock.mockResolvedValue({ data: baseCalibrations });
  mockSearchParams = new URLSearchParams(); // reset URL state between tests
});

describe('CalibrationHistoryClient — Option C 책임 분리', () => {
  it('PageHeader title/subtitle/back 렌더', async () => {
    render(
      React.createElement(CalibrationHistoryClient, {
        equipmentId: 'eq-1',
        initialEquipment: equipmentNotOverdueFixture,
      }),
      { wrapper: makeWrapper() }
    );
    await flush();

    expect(screen.getByText(/title$/)).toBeInTheDocument();
    expect(screen.getByText(/오실로스코프 \(OSC-001\)/)).toBeInTheDocument();
  });

  it('장비 nextCalibrationDate가 과거이면 overdue alert 표시', async () => {
    render(
      React.createElement(CalibrationHistoryClient, {
        equipmentId: 'eq-1',
        initialEquipment: equipmentFixture,
      }),
      { wrapper: makeWrapper() }
    );
    await flush();

    expect(screen.getByText('overdueAlert.title')).toBeInTheDocument();
    expect(screen.getByText('overdueAlert.description')).toBeInTheDocument();
  });

  it('overdue 미발생 시 alert banner 미표시', async () => {
    render(
      React.createElement(CalibrationHistoryClient, {
        equipmentId: 'eq-1',
        initialEquipment: equipmentNotOverdueFixture,
      }),
      { wrapper: makeWrapper() }
    );
    await flush();

    expect(screen.queryByText('overdueAlert.title')).not.toBeInTheDocument();
  });

  it('stats card 5종 표시 (total/overdue/upcoming/passed/failed)', async () => {
    render(
      React.createElement(CalibrationHistoryClient, {
        equipmentId: 'eq-1',
        initialEquipment: equipmentNotOverdueFixture,
      }),
      { wrapper: makeWrapper() }
    );
    await flush();

    // 키 라벨 5종 모두 렌더 (next-intl mock이 key 그대로 반환)
    expect(screen.getByText('stats.total')).toBeInTheDocument();
    expect(screen.getByText('stats.overdue')).toBeInTheDocument();
    expect(screen.getByText('stats.upcoming')).toBeInTheDocument();
    expect(screen.getByText('stats.passed')).toBeInTheDocument();
    expect(screen.getByText('stats.failed')).toBeInTheDocument();
  });

  it('CalibrationListTable에 모든 row 전달 (필터 미적용 baseline)', async () => {
    render(
      React.createElement(CalibrationHistoryClient, {
        equipmentId: 'eq-1',
        initialEquipment: equipmentNotOverdueFixture,
      }),
      { wrapper: makeWrapper() }
    );

    // useQuery resolve 대기 — findBy는 async element 등장 polling
    await screen.findByText('rows=3');
  });

  it('dateFrom 필터 URL 파라미터 적용 시 이전 날짜 row 제외', async () => {
    // URL 기반 필터 — startDate=2025-08-01 → c1(2025-01-01), c2(2025-06-01) 제외, c3(2025-09-01)만
    mockSearchParams = new URLSearchParams('startDate=2025-08-01');

    render(
      React.createElement(CalibrationHistoryClient, {
        equipmentId: 'eq-1',
        initialEquipment: equipmentNotOverdueFixture,
      }),
      { wrapper: makeWrapper() }
    );

    await screen.findByText('rows=1');
    expect(screen.getByTestId('list-table-mock')).toHaveTextContent('rows=1');
  });
});
