/**
 * InspectionFormContext — Phase 1A-b architecture SSOT 동작 검증
 *
 * 시나리오:
 * 1. applyLatestPrefill → state.latest.applied=true + sortOrders Set
 * 2. markCellModified → userModifiedCells Map
 * 3. isPrefilledCell selector — prefilled section + 사용자 미수정 셀
 * 4. mark-section-modified → prefilledSortOrders에서 제거 + userModifiedCells에서 제거
 * 5. addMasterPrefilledField / removeMasterPrefilledField — master Set
 * 6. resetAll / resetLatestPrefill 격리
 * 7. NO_OP_VALUE — Provider 부재 시 graceful no-op
 */

import { act, renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { InspectionFormProvider, useInspectionForm } from '../form-context';

const wrapper = ({ children }: { children: ReactNode }) => (
  <InspectionFormProvider>{children}</InspectionFormProvider>
);

describe('useInspectionForm (Provider)', () => {
  it('초기 상태: applied=false, master Set 비어 있음', () => {
    const { result } = renderHook(() => useInspectionForm(), { wrapper });

    expect(result.current.state.latest.applied).toBe(false);
    expect(result.current.state.latest.prefilledSortOrders.size).toBe(0);
    expect(result.current.state.master.size).toBe(0);
  });

  it('applyLatestPrefill → applied=true + sortOrders Set 등록', () => {
    const { result } = renderHook(() => useInspectionForm(), { wrapper });

    act(() => {
      result.current.applyLatestPrefill({
        sourceInspectionId: 'i1',
        sourceInspectionDate: '2026-04-15',
        counts: { tables: 2, photos: 1, texts: 0 },
        sortOrders: [0, 1, 2],
      });
    });

    expect(result.current.state.latest.applied).toBe(true);
    expect(result.current.state.latest.sourceInspectionId).toBe('i1');
    expect(result.current.state.latest.counts).toEqual({ tables: 2, photos: 1, texts: 0 });
    expect(result.current.isPrefilledSection(0)).toBe(true);
    expect(result.current.isPrefilledSection(1)).toBe(true);
    expect(result.current.isPrefilledSection(99)).toBe(false);
  });

  it('markCellModified → userModifiedCells에 추가 + isPrefilledCell=false 변환', () => {
    const { result } = renderHook(() => useInspectionForm(), { wrapper });

    act(() => {
      result.current.applyLatestPrefill({
        sourceInspectionId: 'i1',
        sourceInspectionDate: '2026-04-15',
        counts: { tables: 1, photos: 0, texts: 0 },
        sortOrders: [0],
      });
    });

    // 셀 (0, 0, 0) 초기 상태: prefilled
    expect(result.current.isPrefilledCell(0, 0, 0)).toBe(true);
    expect(result.current.isUserModifiedCell(0, 0, 0)).toBe(false);

    act(() => {
      result.current.markCellModified(0, 0, 0);
    });

    expect(result.current.isUserModifiedCell(0, 0, 0)).toBe(true);
    expect(result.current.isPrefilledCell(0, 0, 0)).toBe(false); // 사용자 수정 후 prefilled X
    // 다른 셀은 영향 없음
    expect(result.current.isPrefilledCell(0, 1, 0)).toBe(true);
  });

  it('mark-section-modified → prefilledSortOrders에서 제거 + userModifiedCells도 제거', () => {
    const { result } = renderHook(() => useInspectionForm(), { wrapper });

    act(() => {
      result.current.applyLatestPrefill({
        sourceInspectionId: 'i1',
        sourceInspectionDate: '2026-04-15',
        counts: { tables: 2, photos: 0, texts: 0 },
        sortOrders: [0, 1],
      });
    });

    act(() => {
      result.current.markCellModified(0, 0, 0); // section 0의 셀 수정
      result.current.markSectionModified(0); // section 0 자체 변경
    });

    // section 0은 더 이상 prefilled 아님
    expect(result.current.isPrefilledSection(0)).toBe(false);
    expect(result.current.isPrefilledCell(0, 0, 0)).toBe(false);
    expect(result.current.isUserModifiedCell(0, 0, 0)).toBe(false); // 함께 제거됨

    // section 1은 영향 없음
    expect(result.current.isPrefilledSection(1)).toBe(true);
  });

  it('addMasterPrefilledField / removeMasterPrefilledField → master Set 동작', () => {
    const { result } = renderHook(() => useInspectionForm(), { wrapper });

    act(() => {
      result.current.addMasterPrefilledField('inspectionCycle');
      result.current.addMasterPrefilledField('calibrationValidityPeriod');
    });

    expect(result.current.isMasterPrefilledField('inspectionCycle')).toBe(true);
    expect(result.current.isMasterPrefilledField('calibrationValidityPeriod')).toBe(true);
    expect(result.current.isMasterPrefilledField('unknown')).toBe(false);

    act(() => {
      result.current.removeMasterPrefilledField('inspectionCycle');
    });

    expect(result.current.isMasterPrefilledField('inspectionCycle')).toBe(false);
    expect(result.current.isMasterPrefilledField('calibrationValidityPeriod')).toBe(true);
  });

  it('resetLatestPrefill — latest만 초기화, master는 유지', () => {
    const { result } = renderHook(() => useInspectionForm(), { wrapper });

    act(() => {
      result.current.applyLatestPrefill({
        sourceInspectionId: 'i1',
        sourceInspectionDate: '2026-04-15',
        counts: { tables: 1, photos: 0, texts: 0 },
        sortOrders: [0],
      });
      result.current.addMasterPrefilledField('inspectionCycle');
    });

    act(() => {
      result.current.resetLatestPrefill();
    });

    expect(result.current.state.latest.applied).toBe(false);
    expect(result.current.state.latest.prefilledSortOrders.size).toBe(0);
    // master는 보존
    expect(result.current.isMasterPrefilledField('inspectionCycle')).toBe(true);
  });

  it('resetAll — latest + master 모두 초기화', () => {
    const { result } = renderHook(() => useInspectionForm(), { wrapper });

    act(() => {
      result.current.applyLatestPrefill({
        sourceInspectionId: 'i1',
        sourceInspectionDate: '2026-04-15',
        counts: { tables: 1, photos: 0, texts: 0 },
        sortOrders: [0],
      });
      result.current.addMasterPrefilledField('inspectionCycle');
    });

    act(() => {
      result.current.resetAll();
    });

    expect(result.current.state.latest.applied).toBe(false);
    expect(result.current.state.master.size).toBe(0);
  });

  it('dismissBanner → bannerDismissed=true', () => {
    const { result } = renderHook(() => useInspectionForm(), { wrapper });

    act(() => {
      result.current.applyLatestPrefill({
        sourceInspectionId: 'i1',
        sourceInspectionDate: '2026-04-15',
        counts: { tables: 1, photos: 0, texts: 0 },
        sortOrders: [0],
      });
    });

    expect(result.current.state.latest.bannerDismissed).toBe(false);

    act(() => {
      result.current.dismissBanner();
    });

    expect(result.current.state.latest.bannerDismissed).toBe(true);
  });
});

describe('useInspectionForm (NO_OP, Provider 부재)', () => {
  it('graceful fallback — Provider 부재 시 NO_OP_VALUE 반환', () => {
    const { result } = renderHook(() => useInspectionForm()); // wrapper 없음

    // 액션 호출 → throw 하지 않음 (no-op)
    expect(() => {
      result.current.applyLatestPrefill({
        sourceInspectionId: 'i1',
        sourceInspectionDate: '',
        counts: { tables: 0, photos: 0, texts: 0 },
        sortOrders: [],
      });
    }).not.toThrow();

    // selector 모두 false
    expect(result.current.isPrefilledSection(0)).toBe(false);
    expect(result.current.isPrefilledCell(0, 0, 0)).toBe(false);
    expect(result.current.isMasterPrefilledField('any')).toBe(false);

    // state 초기값 그대로
    expect(result.current.state.latest.applied).toBe(false);
  });
});
