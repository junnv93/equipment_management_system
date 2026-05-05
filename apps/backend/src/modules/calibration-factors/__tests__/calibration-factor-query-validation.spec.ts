import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { calibrationFactorQuerySchema } from '../dto/calibration-factor-query.dto';

describe('calibrationFactorQuerySchema — Query DTO trim/max + sort enum SSOT', () => {
  describe('search', () => {
    it('max → accept', () => {
      const r = calibrationFactorQuerySchema.safeParse({
        search: 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH),
      });
      expect(r.success).toBe(true);
    });
    it('max + 1 → reject + VM', () => {
      const r = calibrationFactorQuerySchema.safeParse({
        search: 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH + 1),
      });
      expect(r.success).toBe(false);
      if (!r.success)
        expect(r.error.issues[0].message).toBe(
          VM.string.max('검색어', VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH)
        );
    });
    it('whitespace only → undefined', () => {
      const r = calibrationFactorQuerySchema.safeParse({ search: '   ' });
      if (r.success) expect(r.data.search).toBeUndefined();
    });
  });

  describe('sort — CalibrationFactorSortEnum', () => {
    it.each(['effectiveDate.asc', 'effectiveDate.desc', 'requestedAt.asc', 'createdAt.desc'])(
      'accepts: %s',
      (sort) => {
        expect(calibrationFactorQuerySchema.safeParse({ sort }).success).toBe(true);
      }
    );
    it.each(['unknown.asc', 'effectiveDate.INVALID', 'effectiveDate.ASC'])(
      'rejects: %s',
      (sort) => {
        expect(calibrationFactorQuerySchema.safeParse({ sort }).success).toBe(false);
      }
    );
  });
});
