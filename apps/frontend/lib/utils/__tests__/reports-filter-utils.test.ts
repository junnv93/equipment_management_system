import {
  ALL_SENTINEL,
  DEFAULT_REPORTS_FILTERS,
  countActiveReportsFilters,
  parseReportsFiltersFromSearchParams,
  type UIReportsFilters,
} from '../reports-filter-utils';

// ──────────────────────────────────────────
//  parseReportsFiltersFromSearchParams
// ──────────────────────────────────────────
describe('parseReportsFiltersFromSearchParams()', () => {
  describe('빈 입력', () => {
    it('빈 URLSearchParams → 기본값 반환', () => {
      const result = parseReportsFiltersFromSearchParams(new URLSearchParams());
      expect(result).toEqual(DEFAULT_REPORTS_FILTERS);
    });

    it('빈 Record → 기본값 반환', () => {
      const result = parseReportsFiltersFromSearchParams({});
      expect(result).toEqual(DEFAULT_REPORTS_FILTERS);
    });
  });

  describe('필드 파싱', () => {
    it('reportType / dateRange / format 파싱', () => {
      const params = new URLSearchParams(
        'reportType=calibration_status&dateRange=last_quarter&reportFormat=csv'
      );
      const result = parseReportsFiltersFromSearchParams(params);
      expect(result.reportType).toBe('calibration_status');
      expect(result.dateRange).toBe('last_quarter');
      expect(result.reportFormat).toBe('csv');
    });

    it('site / teamId / status 파싱', () => {
      const params = new URLSearchParams('site=suwon&teamId=team-1&status=overdue');
      const result = parseReportsFiltersFromSearchParams(params);
      expect(result.site).toBe('suwon');
      expect(result.teamId).toBe('team-1');
      expect(result.status).toBe('overdue');
    });

    it('customDateFrom / customDateTo 그대로 보존 (yyyy-MM-dd)', () => {
      const params = new URLSearchParams(
        'dateRange=custom&customDateFrom=2026-01-01&customDateTo=2026-03-31'
      );
      const result = parseReportsFiltersFromSearchParams(params);
      expect(result.dateRange).toBe('custom');
      expect(result.customDateFrom).toBe('2026-01-01');
      expect(result.customDateTo).toBe('2026-03-31');
    });
  });

  describe('잘못된 값 → 기본값 폴백', () => {
    it('알 수 없는 reportType → 빈 문자열(미선택) 폴백', () => {
      const params = new URLSearchParams('reportType=invalid_type');
      const result = parseReportsFiltersFromSearchParams(params);
      expect(result.reportType).toBe(DEFAULT_REPORTS_FILTERS.reportType);
    });

    it('알 수 없는 dateRange → 기본값(last_month) 폴백', () => {
      const params = new URLSearchParams('dateRange=last_century');
      const result = parseReportsFiltersFromSearchParams(params);
      expect(result.dateRange).toBe('last_month');
    });

    it('알 수 없는 reportFormat → 기본값(excel) 폴백', () => {
      const params = new URLSearchParams('reportFormat=docx');
      const result = parseReportsFiltersFromSearchParams(params);
      expect(result.reportFormat).toBe('excel');
    });

    it('알 수 없는 status → 빈 문자열 폴백', () => {
      const params = new URLSearchParams('status=in_progress');
      const result = parseReportsFiltersFromSearchParams(params);
      expect(result.status).toBe('');
    });
  });

  describe('ALL_SENTINEL 처리', () => {
    it('site=_all → 빈 문자열로 strip', () => {
      const params = new URLSearchParams(`site=${ALL_SENTINEL}`);
      const result = parseReportsFiltersFromSearchParams(params);
      expect(result.site).toBe('');
    });

    it('teamId / status 도 동일하게 strip', () => {
      const params = new URLSearchParams(
        `teamId=${ALL_SENTINEL}&status=${ALL_SENTINEL}&reportType=${ALL_SENTINEL}`
      );
      const result = parseReportsFiltersFromSearchParams(params);
      expect(result.teamId).toBe('');
      expect(result.status).toBe('');
      expect(result.reportType).toBe('');
    });
  });

  describe('Record 입력 (Server Component searchParams)', () => {
    it('string[] 첫 번째 값을 사용', () => {
      const result = parseReportsFiltersFromSearchParams({
        site: ['suwon', 'seoul'],
        teamId: 'team-1',
      });
      expect(result.site).toBe('suwon');
      expect(result.teamId).toBe('team-1');
    });

    it('undefined 값 → 기본값', () => {
      const result = parseReportsFiltersFromSearchParams({ site: undefined });
      expect(result.site).toBe('');
    });
  });

  describe('Round-trip (URL → parse → URL)', () => {
    it('파싱한 값을 다시 직렬화해도 의미가 보존됨', () => {
      const original = new URLSearchParams(
        'reportType=equipment_inventory&dateRange=custom&customDateFrom=2026-02-01&customDateTo=2026-02-28&reportFormat=pdf&site=suwon&teamId=team-2&status=completed'
      );
      const parsed = parseReportsFiltersFromSearchParams(original);
      // 모든 핵심 필드가 라운드트립 보존
      expect(parsed.reportType).toBe('equipment_inventory');
      expect(parsed.dateRange).toBe('custom');
      expect(parsed.customDateFrom).toBe('2026-02-01');
      expect(parsed.customDateTo).toBe('2026-02-28');
      expect(parsed.reportFormat).toBe('pdf');
      expect(parsed.site).toBe('suwon');
      expect(parsed.teamId).toBe('team-2');
      expect(parsed.status).toBe('completed');
    });
  });
});

// ──────────────────────────────────────────
//  countActiveReportsFilters
// ──────────────────────────────────────────
describe('countActiveReportsFilters()', () => {
  it('기본 필터 → 0', () => {
    expect(countActiveReportsFilters(DEFAULT_REPORTS_FILTERS)).toBe(0);
  });

  it('site / teamId / status 각각 1', () => {
    const f: UIReportsFilters = { ...DEFAULT_REPORTS_FILTERS, site: 'suwon' };
    expect(countActiveReportsFilters(f)).toBe(1);
  });

  it('custom date range 양 끝이 채워졌을 때 +1', () => {
    const f: UIReportsFilters = {
      ...DEFAULT_REPORTS_FILTERS,
      dateRange: 'custom',
      customDateFrom: '2026-01-01',
      customDateTo: '2026-01-31',
    };
    expect(countActiveReportsFilters(f)).toBe(1);
  });

  it('custom date range 한 쪽만 있으면 카운트되지 않음', () => {
    const f: UIReportsFilters = {
      ...DEFAULT_REPORTS_FILTERS,
      dateRange: 'custom',
      customDateFrom: '2026-01-01',
      customDateTo: '',
    };
    expect(countActiveReportsFilters(f)).toBe(0);
  });

  it('전체 서브필터 활성화 → 4', () => {
    const f: UIReportsFilters = {
      ...DEFAULT_REPORTS_FILTERS,
      site: 'suwon',
      teamId: 'team-1',
      status: 'completed',
      dateRange: 'custom',
      customDateFrom: '2026-01-01',
      customDateTo: '2026-01-31',
    };
    expect(countActiveReportsFilters(f)).toBe(4);
  });
});
