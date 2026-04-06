import {
  parseEquipmentFiltersFromSearchParams,
  convertFiltersToApiParams,
  countActiveFilters,
  DEFAULT_UI_FILTERS,
} from '../equipment-filter-utils';

// ──────────────────────────────────────────
//  parseEquipmentFiltersFromSearchParams
// ──────────────────────────────────────────
describe('parseEquipmentFiltersFromSearchParams()', () => {
  describe('URLSearchParams 입력', () => {
    it('빈 URLSearchParams → 기본값 반환', () => {
      const result = parseEquipmentFiltersFromSearchParams(new URLSearchParams());
      expect(result).toEqual(DEFAULT_UI_FILTERS);
    });

    it('site, status, teamId 파싱', () => {
      const params = new URLSearchParams('site=suwon&status=available&teamId=team-1');
      const result = parseEquipmentFiltersFromSearchParams(params);
      expect(result.site).toBe('suwon');
      expect(result.status).toBe('available');
      expect(result.teamId).toBe('team-1');
    });

    it('page, pageSize 파싱 (숫자 변환)', () => {
      const params = new URLSearchParams('page=3&pageSize=10');
      const result = parseEquipmentFiltersFromSearchParams(params);
      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(10);
    });

    it('유효하지 않은 page 값 → 기본값 1로 폴백', () => {
      const params = new URLSearchParams('page=abc');
      const result = parseEquipmentFiltersFromSearchParams(params);
      expect(result.page).toBe(1);
    });

    it('page < 1 → 기본값 1로 폴백', () => {
      const params = new URLSearchParams('page=0');
      const result = parseEquipmentFiltersFromSearchParams(params);
      expect(result.page).toBe(1);
    });
  });

  describe('_all 변환 규칙 (무한 리다이렉트 방지)', () => {
    it('site=_all → site=""', () => {
      const params = new URLSearchParams('site=_all');
      expect(parseEquipmentFiltersFromSearchParams(params).site).toBe('');
    });

    it('status=_all → status=""', () => {
      const params = new URLSearchParams('status=_all');
      expect(parseEquipmentFiltersFromSearchParams(params).status).toBe('');
    });

    it('teamId=_all → teamId=""', () => {
      const params = new URLSearchParams('teamId=_all');
      expect(parseEquipmentFiltersFromSearchParams(params).teamId).toBe('');
    });

    it('managementMethod=_all → managementMethod=""', () => {
      const params = new URLSearchParams('managementMethod=_all');
      expect(parseEquipmentFiltersFromSearchParams(params).managementMethod).toBe('');
    });
  });

  describe('calibrationDueFilter 파싱', () => {
    it.each(['due_soon', 'overdue', 'normal'] as const)('%s → 그대로 반환', (value) => {
      const params = new URLSearchParams(`calibrationDueFilter=${value}`);
      expect(parseEquipmentFiltersFromSearchParams(params).calibrationDueFilter).toBe(value);
    });

    it('알 수 없는 값 → "all"로 폴백', () => {
      const params = new URLSearchParams('calibrationDueFilter=unknown');
      expect(parseEquipmentFiltersFromSearchParams(params).calibrationDueFilter).toBe('all');
    });
  });

  describe('isShared 파싱', () => {
    it('isShared=shared → "shared"', () => {
      const params = new URLSearchParams('isShared=shared');
      expect(parseEquipmentFiltersFromSearchParams(params).isShared).toBe('shared');
    });

    it('isShared=normal → "normal"', () => {
      const params = new URLSearchParams('isShared=normal');
      expect(parseEquipmentFiltersFromSearchParams(params).isShared).toBe('normal');
    });

    it('isShared 없음 → "all"', () => {
      const params = new URLSearchParams();
      expect(parseEquipmentFiltersFromSearchParams(params).isShared).toBe('all');
    });
  });

  describe('Record 객체 입력 (Next.js searchParams)', () => {
    it('일반 Record 객체에서 파싱', () => {
      const searchParams = { site: 'uiwang', page: '2' };
      const result = parseEquipmentFiltersFromSearchParams(searchParams);
      expect(result.site).toBe('uiwang');
      expect(result.page).toBe(2);
    });

    it('배열 값은 첫 번째 요소를 사용', () => {
      const searchParams = { site: ['suwon', 'uiwang'] };
      const result = parseEquipmentFiltersFromSearchParams(searchParams);
      expect(result.site).toBe('suwon');
    });

    it('undefined 값은 기본값으로 폴백', () => {
      const searchParams = { site: undefined };
      const result = parseEquipmentFiltersFromSearchParams(searchParams);
      expect(result.site).toBe('');
    });
  });
});

// ──────────────────────────────────────────
//  convertFiltersToApiParams
// ──────────────────────────────────────────
describe('convertFiltersToApiParams()', () => {
  it('빈 문자열 필드는 undefined로 변환 (백엔드 미전송)', () => {
    const result = convertFiltersToApiParams({ ...DEFAULT_UI_FILTERS });
    expect(result.site).toBeUndefined();
    expect(result.status).toBeUndefined();
    expect(result.search).toBeUndefined();
    expect(result.teamId).toBeUndefined();
  });

  it('calibrationDueFilter=due_soon → calibrationDue=30', () => {
    const result = convertFiltersToApiParams({
      ...DEFAULT_UI_FILTERS,
      calibrationDueFilter: 'due_soon',
    });
    expect(result.calibrationDue).toBe(30);
    expect(result.calibrationDueAfter).toBeUndefined();
    expect(result.calibrationOverdue).toBeUndefined();
  });

  it('calibrationDueFilter=overdue → calibrationOverdue=true', () => {
    const result = convertFiltersToApiParams({
      ...DEFAULT_UI_FILTERS,
      calibrationDueFilter: 'overdue',
    });
    expect(result.calibrationOverdue).toBe(true);
    expect(result.calibrationDue).toBeUndefined();
  });

  it('calibrationDueFilter=normal → calibrationDueAfter=30', () => {
    const result = convertFiltersToApiParams({
      ...DEFAULT_UI_FILTERS,
      calibrationDueFilter: 'normal',
    });
    expect(result.calibrationDueAfter).toBe(30);
  });

  it('isShared=shared → isShared=true', () => {
    const result = convertFiltersToApiParams({ ...DEFAULT_UI_FILTERS, isShared: 'shared' });
    expect(result.isShared).toBe(true);
  });

  it('isShared=normal → isShared=false', () => {
    const result = convertFiltersToApiParams({ ...DEFAULT_UI_FILTERS, isShared: 'normal' });
    expect(result.isShared).toBe(false);
  });

  it('isShared=all → isShared=undefined', () => {
    const result = convertFiltersToApiParams({ ...DEFAULT_UI_FILTERS, isShared: 'all' });
    expect(result.isShared).toBeUndefined();
  });

  it('sortBy + sortOrder → sort 문자열로 변환', () => {
    const result = convertFiltersToApiParams({
      ...DEFAULT_UI_FILTERS,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    expect(result.sort).toBe('createdAt.desc');
  });

  it('page, pageSize는 항상 포함', () => {
    const result = convertFiltersToApiParams({ ...DEFAULT_UI_FILTERS, page: 3, pageSize: 10 });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(10);
  });
});

// ──────────────────────────────────────────
//  countActiveFilters
// ──────────────────────────────────────────
describe('countActiveFilters()', () => {
  it('기본값(아무 필터 없음) → 0', () => {
    expect(countActiveFilters(DEFAULT_UI_FILTERS)).toBe(0);
  });

  it('search 설정 → 1', () => {
    expect(countActiveFilters({ ...DEFAULT_UI_FILTERS, search: '오실로스코프' })).toBe(1);
  });

  it('site + status → 2', () => {
    const count = countActiveFilters({
      ...DEFAULT_UI_FILTERS,
      site: 'suwon' as never,
      status: 'available' as never,
    });
    expect(count).toBe(2);
  });

  it('모든 필터 활성화 → 8', () => {
    const allActive = {
      ...DEFAULT_UI_FILTERS,
      search: '오실로스코프',
      site: 'suwon' as never,
      status: 'available' as never,
      managementMethod: 'external' as never,
      classification: 'fcc_emc_rf' as never,
      isShared: 'shared' as const,
      calibrationDueFilter: 'due_soon' as const,
      teamId: 'team-1',
    };
    expect(countActiveFilters(allActive)).toBe(8);
  });

  it('isShared=all → 카운트 미포함', () => {
    expect(countActiveFilters({ ...DEFAULT_UI_FILTERS, isShared: 'all' })).toBe(0);
  });
});
