/**
 * use-equipment-calibrations — export 시그니처 + queryKey SSOT + enabled 가드 회귀 테스트
 *
 * 핵심 검증:
 * 1. useEquipmentCalibrations / useEquipmentCalibrationHistory 두 named export 존재
 * 2. 각 hook이 queryKeys.calibrations SSOT 함수 호출 결과를 queryKey로 사용
 * 3. equipmentId === '' 시 enabled: false — api 미호출
 * 4. queryFn이 calibrationApi 기본 export 메서드를 올바른 인자로 호출
 * 5. useEquipmentCalibrationHistory의 pageSize 옵션 분기
 */
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const getEquipmentCalibrationsMock = jest.fn();
const getCalibrationHistoryMock = jest.fn();

jest.mock('@/lib/api/calibration-api', () => ({
  __esModule: true,
  default: {
    getEquipmentCalibrations: (id: string) => getEquipmentCalibrationsMock(id),
    getCalibrationHistory: (filters: unknown) => getCalibrationHistoryMock(filters),
  },
}));

import {
  useEquipmentCalibrations,
  useEquipmentCalibrationHistory,
} from '../use-equipment-calibrations';
import { queryKeys } from '@/lib/api/query-config';

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: 0 }, queries: { retry: 0 } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { Wrapper, queryClient };
}

beforeEach(() => {
  getEquipmentCalibrationsMock.mockReset();
  getCalibrationHistoryMock.mockReset();
});

describe('useEquipmentCalibrations', () => {
  it('named export로 함수가 존재한다', () => {
    expect(typeof useEquipmentCalibrations).toBe('function');
  });

  it('equipmentId로 calibrationApi.getEquipmentCalibrations를 호출하고 queryKey SSOT와 일치한다', async () => {
    const { Wrapper, queryClient } = makeWrapper();
    const mockData = [{ id: 'cal-1', equipmentId: 'eq-1' }];
    getEquipmentCalibrationsMock.mockResolvedValue(mockData);

    queryClient.setQueryData(queryKeys.calibrations.byEquipment('eq-1'), mockData);

    const { result } = renderHook(() => useEquipmentCalibrations('eq-1'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data).toEqual(mockData);
    expect(queryClient.getQueryData(queryKeys.calibrations.byEquipment('eq-1'))).toEqual(mockData);
  });

  it('equipmentId가 빈 문자열이면 api를 호출하지 않는다 (enabled: false)', async () => {
    const { Wrapper } = makeWrapper();

    renderHook(() => useEquipmentCalibrations(''), { wrapper: Wrapper });

    await new Promise((r) => setTimeout(r, 50));
    expect(getEquipmentCalibrationsMock).not.toHaveBeenCalled();
  });
});

describe('useEquipmentCalibrationHistory', () => {
  it('named export로 함수가 존재한다', () => {
    expect(typeof useEquipmentCalibrationHistory).toBe('function');
  });

  it('pageSize 미지정 시 calibrationApi.getCalibrationHistory를 equipmentId 인자로 호출한다', async () => {
    const { Wrapper, queryClient } = makeWrapper();
    const mockData = { data: [], total: 0, page: 1, pageSize: 20 };
    getCalibrationHistoryMock.mockResolvedValue(mockData);

    const expectedFilters = { equipmentId: 'eq-2', pageSize: undefined };
    queryClient.setQueryData(queryKeys.calibrations.historyList(expectedFilters), mockData);

    const { result } = renderHook(() => useEquipmentCalibrationHistory('eq-2'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data).toEqual(mockData);
    expect(queryClient.getQueryData(queryKeys.calibrations.historyList(expectedFilters))).toEqual(
      mockData
    );
  });

  it('pageSize 옵션 전달 시 filters에 pageSize가 포함된다', async () => {
    const { Wrapper, queryClient } = makeWrapper();
    const mockData = { data: [], total: 0, page: 1, pageSize: 10 };
    getCalibrationHistoryMock.mockResolvedValue(mockData);

    const expectedFilters = { equipmentId: 'eq-3', pageSize: 10 };
    queryClient.setQueryData(queryKeys.calibrations.historyList(expectedFilters), mockData);

    const { result } = renderHook(() => useEquipmentCalibrationHistory('eq-3', { pageSize: 10 }), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.data).toBeDefined());

    expect(result.current.data).toEqual(mockData);
    expect(queryClient.getQueryData(queryKeys.calibrations.historyList(expectedFilters))).toEqual(
      mockData
    );
  });

  it('equipmentId가 빈 문자열이면 api를 호출하지 않는다 (enabled: false)', async () => {
    const { Wrapper } = makeWrapper();

    renderHook(() => useEquipmentCalibrationHistory(''), { wrapper: Wrapper });

    await new Promise((r) => setTimeout(r, 50));
    expect(getCalibrationHistoryMock).not.toHaveBeenCalled();
  });
});
