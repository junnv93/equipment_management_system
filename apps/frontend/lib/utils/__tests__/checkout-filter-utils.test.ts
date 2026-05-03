import {
  buildInboundOverviewQuery,
  DEFAULT_UI_FILTERS,
  SUBTAB_STATUS_GROUPS,
} from '../checkout-filter-utils';
import { DEFAULT_PAGE_SIZE } from '@equipment-management/shared-constants';

describe('buildInboundOverviewQuery()', () => {
  it('status=all이면 현재 subTab 상태 그룹을 statusFilter로 사용한다', () => {
    expect(buildInboundOverviewQuery(DEFAULT_UI_FILTERS)).toEqual({
      statusFilter: SUBTAB_STATUS_GROUPS.inProgress.join(','),
      searchTerm: undefined,
      limitPerSection: DEFAULT_PAGE_SIZE,
    });
  });

  it('completed subTab이면 completed 상태 그룹을 statusFilter로 사용한다', () => {
    const result = buildInboundOverviewQuery({
      ...DEFAULT_UI_FILTERS,
      subTab: 'completed',
    });

    expect(result.statusFilter).toBe(SUBTAB_STATUS_GROUPS.completed.join(','));
  });

  it('명시 status 필터는 subTab 기본 상태 그룹보다 우선한다', () => {
    const result = buildInboundOverviewQuery({
      ...DEFAULT_UI_FILTERS,
      status: 'borrower_approved',
      subTab: 'completed',
    });

    expect(result.statusFilter).toBe('borrower_approved');
  });

  it('빈 검색어는 API query에서 undefined로 정규화한다', () => {
    expect(buildInboundOverviewQuery(DEFAULT_UI_FILTERS).searchTerm).toBeUndefined();
  });

  it('검색어와 limitPerSection을 query 객체에 포함한다', () => {
    expect(
      buildInboundOverviewQuery(
        {
          ...DEFAULT_UI_FILTERS,
          search: 'SPECTRUM',
        },
        20
      )
    ).toEqual({
      statusFilter: SUBTAB_STATUS_GROUPS.inProgress.join(','),
      searchTerm: 'SPECTRUM',
      limitPerSection: 20,
    });
  });
});
