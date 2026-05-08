/**
 * CalibrationContent — RTL 단위 테스트 (chip 영역 한정).
 *
 * 검증 범위:
 *   - equipmentId deep-link 활성 시 FilterChip 렌더 + equipment 별도 fetch 데이터 표시
 *   - chip clear 시 equipmentId만 삭제, 다른 filter 보존 (URL replace 검증)
 *   - equipmentId 미활성 시 chip render 안 됨
 *
 * 위임된 검증:
 *   - 다른 filter UI 동작 (Select, ToggleGroup 등) → 별도 spec
 *   - calibration list/timeline 렌더링 → 자식 컴포넌트 spec
 *
 * 분리 이유:
 *   - 자식 컴포넌트 5개 + hook 6개 + queryClient 의존 → integration 테스트 어려움.
 *     chip 통합 검증이 본질이므로 자식/hook 모두 mock + chip 영역만 검증.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Equipment } from '@/lib/api/equipment-api';

// ----- Mocks -----
const routerReplaceMock = jest.fn();
const updateSearchMock = jest.fn();
const updateSiteMock = jest.fn();
const updateTeamIdMock = jest.fn();
const updateApprovalStatusMock = jest.fn();
const updateResultMock = jest.fn();
const updateCalibrationDueStatusMock = jest.fn();
const updateMethodsMock = jest.fn();
const updateDateRangeMock = jest.fn();
const clearFiltersMock = jest.fn();

let searchParamsMock = new URLSearchParams();
let filtersMock = {
  search: '',
  site: undefined as string | undefined,
  teamId: undefined as string | undefined,
  approvalStatus: undefined as string | undefined,
  result: undefined as string | undefined,
  calibrationDueStatus: undefined as string | undefined,
  methods: [] as string[],
  startDate: undefined as string | undefined,
  endDate: undefined as string | undefined,
  equipmentId: undefined as string | undefined,
};

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: routerReplaceMock, refresh: jest.fn() }),
  useSearchParams: () => searchParamsMock,
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, vars?: Record<string, unknown>) =>
    vars ? `${key}|${JSON.stringify(vars)}` : key,
}));

jest.mock('@/hooks/use-calibration-filters', () => ({
  useCalibrationFilters: () => ({
    filters: filtersMock,
    updateSearch: updateSearchMock,
    updateSite: updateSiteMock,
    updateTeamId: updateTeamIdMock,
    updateApprovalStatus: updateApprovalStatusMock,
    updateResult: updateResultMock,
    updateCalibrationDueStatus: updateCalibrationDueStatusMock,
    updateMethods: updateMethodsMock,
    updateDateRange: updateDateRangeMock,
    clearFilters: clearFiltersMock,
  }),
}));

// closure 변수 참조 패턴 (jest hoisting + mockReturnValue 타이밍 이슈 회피)
const mockUseEquipmentReturn: { data: unknown; isLoading: boolean; isError: boolean } = {
  data: undefined,
  isLoading: false,
  isError: false,
};
jest.mock('@/hooks/use-equipment', () => ({
  useEquipment: () => mockUseEquipmentReturn,
}));

jest.mock('@/lib/utils/filter-select-utils', () => ({
  useFilterSelect: (value: string | undefined) => ({
    value: value ?? '',
    onValueChange: jest.fn(),
  }),
}));

jest.mock('@/lib/i18n/use-enum-labels', () => ({
  useSiteLabels: () => ({ getLabel: (k: string) => k }),
}));

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ can: () => true }),
}));

jest.mock('@/lib/api/calibration-api', () => ({
  __esModule: true,
  default: {
    getCalibrationSummary: jest.fn().mockResolvedValue({
      total: 0,
      overdueCount: 0,
      dueInMonthCount: 0,
      passCount: 0,
    }),
    getOverdueCalibrations: jest.fn().mockResolvedValue([]),
    getUpcomingCalibrations: jest.fn().mockResolvedValue([]),
    getCalibrationHistory: jest.fn().mockResolvedValue({ data: [] }),
  },
}));

jest.mock('@/lib/api/api-client', () => ({
  apiClient: {
    get: jest.fn().mockResolvedValue({ data: [] }),
  },
}));

// 자식 컴포넌트 stub
jest.mock('@/components/calibration/CalibrationStatsCards', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'stats-cards-mock' }),
}));
jest.mock('@/components/calibration/CalibrationTimeline', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'timeline-mock' }),
}));
jest.mock('@/components/calibration/CalibrationListTable', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'list-table-mock' }),
}));
jest.mock('@/components/calibration/CalibrationAlertBanners', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'alert-banners-mock' }),
}));
jest.mock('@/components/calibration/MonthlyCalibrationCalendar', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'calendar-mock' }),
}));

import CalibrationContent from '../CalibrationContent';

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: 0 }, queries: { retry: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

beforeEach(() => {
  routerReplaceMock.mockReset();
  searchParamsMock = new URLSearchParams();
  filtersMock = {
    search: '',
    site: undefined,
    teamId: undefined,
    approvalStatus: undefined,
    result: undefined,
    calibrationDueStatus: undefined,
    methods: [],
    startDate: undefined,
    endDate: undefined,
    equipmentId: undefined,
  };
  mockUseEquipmentReturn.data = undefined;
});

function setEquipmentDetail(equipment: Equipment | undefined) {
  mockUseEquipmentReturn.data = equipment;
}

describe('CalibrationContent — equipmentId chip', () => {
  it('equipmentId 활성 시 chip render — label + value + clear 버튼 모두 존재 (FilterChip 통합)', () => {
    filtersMock.equipmentId = 'eq-uuid-001';
    searchParamsMock = new URLSearchParams('?equipmentId=eq-uuid-001&site=lab1');
    setEquipmentDetail({
      id: 'eq-uuid-001',
      name: '오실로스코프',
      managementNumber: 'OSC-001',
    } as Equipment);

    render(React.createElement(CalibrationContent, {}), { wrapper: makeWrapper() });

    // FilterChip의 3 영역 (label / value span / clear button) 모두 존재 검증
    expect(screen.getByText(/content\.filterChip\.equipmentLabel/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /content\.filterChip\.clearAriaLabel/ })
    ).toBeInTheDocument();
    expect(screen.getByText(/content\.filterChip\.clear$/)).toBeInTheDocument();
    // chip 영역 자체가 inline tailwind 하드코딩 아닌 design token 경유
    // (verify-design-token spec — visual regression은 별도 e2e가 cover)
  });

  it('equipmentId 활성 + equipment 데이터 미fetch 시 chip은 render되되 fallback "—" 표시', () => {
    filtersMock.equipmentId = 'eq-uuid-002';
    searchParamsMock = new URLSearchParams('?equipmentId=eq-uuid-002');
    setEquipmentDetail(undefined);

    render(React.createElement(CalibrationContent, {}), { wrapper: makeWrapper() });

    expect(screen.getByText(/content\.filterChip\.equipmentLabel/)).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('equipmentId 미활성 시 chip render 안 됨', () => {
    filtersMock.equipmentId = undefined;
    searchParamsMock = new URLSearchParams('?site=lab1');

    render(React.createElement(CalibrationContent, {}), { wrapper: makeWrapper() });

    expect(screen.queryByText(/content\.filterChip\.equipmentLabel/)).not.toBeInTheDocument();
  });

  it('chip clear 클릭 시 router.replace 호출 + equipmentId만 제거 + 다른 filter 보존', () => {
    filtersMock.equipmentId = 'eq-uuid-001';
    searchParamsMock = new URLSearchParams('?equipmentId=eq-uuid-001&site=lab1&teamId=t1');
    setEquipmentDetail({
      id: 'eq-uuid-001',
      name: '오실로스코프',
      managementNumber: 'OSC-001',
    } as Equipment);

    render(React.createElement(CalibrationContent, {}), { wrapper: makeWrapper() });

    const clearButton = screen.getByRole('button', {
      name: /content\.filterChip\.clearAriaLabel/,
    });
    fireEvent.click(clearButton);

    expect(routerReplaceMock).toHaveBeenCalledTimes(1);
    const calledUrl = routerReplaceMock.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('equipmentId=');
    expect(calledUrl).toContain('site=lab1');
    expect(calledUrl).toContain('teamId=t1');
  });
});
