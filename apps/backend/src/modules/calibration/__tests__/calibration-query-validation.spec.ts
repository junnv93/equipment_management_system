import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { calibrationQuerySchema } from '../dto/calibration-query.dto';

describe('calibrationQuerySchema — Query DTO trim/max + sort enum SSOT', () => {
  describe('search field', () => {
    it('trim → accept (max)', () => {
      const search = 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH);
      expect(calibrationQuerySchema.safeParse({ search }).success).toBe(true);
    });
    it('max + 1 → reject', () => {
      const r = calibrationQuerySchema.safeParse({
        search: 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH + 1),
      });
      expect(r.success).toBe(false);
      if (!r.success)
        expect(r.error.issues[0].message).toBe(
          VM.string.max('검색어', VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH)
        );
    });
    it('whitespace only → undefined', () => {
      const r = calibrationQuerySchema.safeParse({ search: '   ' });
      if (r.success) expect(r.data.search).toBeUndefined();
    });
  });

  describe('calibrationAgency field', () => {
    it('max + 1 → reject', () => {
      const r = calibrationQuerySchema.safeParse({
        calibrationAgency: 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH + 1),
      });
      expect(r.success).toBe(false);
    });
    it('surrounding whitespace → trimmed', () => {
      const r = calibrationQuerySchema.safeParse({ calibrationAgency: '  한국계측  ' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.calibrationAgency).toBe('한국계측');
    });
  });

  describe('statuses — optionalCsvEnum (CALIBRATION_STATUS_VALUES 토큰 단위 검증)', () => {
    it('valid CSV → array transform', () => {
      const r = calibrationQuerySchema.safeParse({ statuses: 'scheduled,in_progress,completed' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.statuses).toEqual(['scheduled', 'in_progress', 'completed']);
    });
    it('invalid token → reject', () => {
      const r = calibrationQuerySchema.safeParse({ statuses: 'scheduled,bogus' });
      expect(r.success).toBe(false);
    });
    it('LONG_CSV + 1 → reject', () => {
      const statuses = 'a'.repeat(VALIDATION_RULES.LONG_CSV_MAX_LENGTH + 1);
      expect(calibrationQuerySchema.safeParse({ statuses }).success).toBe(false);
    });
  });

  describe('methods (CSV — token-level validation은 후속 sprint)', () => {
    it('LONG_CSV_MAX_LENGTH + 1 → reject', () => {
      const methods = 'a'.repeat(VALIDATION_RULES.LONG_CSV_MAX_LENGTH + 1);
      expect(calibrationQuerySchema.safeParse({ methods }).success).toBe(false);
    });
  });

  describe('sort field — CalibrationSortEnum allowlist', () => {
    it.each([
      'calibrationDate.asc',
      'calibrationDate.desc',
      'nextCalibrationDate.asc',
      'status.desc',
      'agencyName.asc',
      'equipmentName.desc',
    ])('accepts: %s', (sort) => {
      expect(calibrationQuerySchema.safeParse({ sort }).success).toBe(true);
    });
    it.each(['unknown.asc', 'calibrationDate.INVALID', 'sql; DROP', 'status.ASC'])(
      'rejects: %s',
      (sort) => {
        expect(calibrationQuerySchema.safeParse({ sort }).success).toBe(false);
      }
    );
    it('default applied when sort omitted', () => {
      const r = calibrationQuerySchema.safeParse({});
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.sort).toBe('calibrationDate.desc');
    });
  });
});
