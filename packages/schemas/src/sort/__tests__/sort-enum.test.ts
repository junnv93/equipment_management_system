import {
  buildSortEnum,
  buildSortValues,
  parseSortValue,
  SORT_DIRECTION_VALUES,
  CHECKOUT_SORT_FIELDS,
  CheckoutSortEnum,
  CALIBRATION_SORT_FIELDS,
  CalibrationSortEnum,
} from '../index';

describe('buildSortValues + buildSortEnum — sort SSOT 단위 테스트', () => {
  it('SORT_DIRECTION_VALUES = [asc, desc]', () => {
    expect(SORT_DIRECTION_VALUES).toEqual(['asc', 'desc']);
  });

  it('buildSortValues: 카르테시안 곱 (fields × directions)', () => {
    const fields = ['name', 'createdAt'] as const;
    const values = buildSortValues(fields);
    expect(values).toEqual(['name.asc', 'name.desc', 'createdAt.asc', 'createdAt.desc']);
  });

  it('buildSortEnum: z.enum 생성 + safeParse 검증', () => {
    const enumSchema = buildSortEnum(['x', 'y'] as const);
    expect(enumSchema.safeParse('x.asc').success).toBe(true);
    expect(enumSchema.safeParse('y.desc').success).toBe(true);
    expect(enumSchema.safeParse('z.asc').success).toBe(false);
    expect(enumSchema.safeParse('x.invalid').success).toBe(false);
  });
});

describe('parseSortValue — 결합형 → field/direction', () => {
  it('단순 케이스', () => {
    expect(parseSortValue('createdAt.asc')).toEqual({
      field: 'createdAt',
      direction: 'asc',
    });
    expect(parseSortValue('checkoutDate.desc')).toEqual({
      field: 'checkoutDate',
      direction: 'desc',
    });
  });

  it('field에 .이 포함된 경우 lastDot 기준 분리', () => {
    // 도메인 enum은 plain 필드명만 허용 — 방어적 검증이지만 문자열 자체는 마지막 . 기준
    const r = parseSortValue('a.b.asc' as `${string}.asc`);
    expect(r.field).toBe('a.b');
    expect(r.direction).toBe('asc');
  });
});

describe('per-domain sort enum 회귀 — CheckoutSortEnum / CalibrationSortEnum', () => {
  it('CHECKOUT_SORT_FIELDS 모든 조합 accept', () => {
    for (const field of CHECKOUT_SORT_FIELDS) {
      for (const dir of SORT_DIRECTION_VALUES) {
        expect(CheckoutSortEnum.safeParse(`${field}.${dir}`).success).toBe(true);
      }
    }
  });

  it('CalibrationSortEnum: equipmentName cross-table 케이스 포함', () => {
    expect(CalibrationSortEnum.safeParse('equipmentName.asc').success).toBe(true);
    expect(CalibrationSortEnum.safeParse('equipmentName.desc').success).toBe(true);
  });

  it('CALIBRATION_SORT_FIELDS 모든 조합 accept', () => {
    for (const field of CALIBRATION_SORT_FIELDS) {
      for (const dir of SORT_DIRECTION_VALUES) {
        expect(CalibrationSortEnum.safeParse(`${field}.${dir}`).success).toBe(true);
      }
    }
  });

  it('SQL injection / case-mismatch 시도 reject', () => {
    expect(CheckoutSortEnum.safeParse("createdAt'; DROP TABLE").success).toBe(false);
    expect(CheckoutSortEnum.safeParse('createdAt.ASC').success).toBe(false);
    expect(CheckoutSortEnum.safeParse('unknown.asc').success).toBe(false);
  });
});
