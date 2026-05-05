import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { cableQuerySchema } from '../dto/cable-query.dto';

describe('cableQuerySchema — Query DTO trim/max + sort enum SSOT', () => {
  describe('search', () => {
    it('max → accept', () => {
      const r = cableQuerySchema.safeParse({
        search: 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH),
      });
      expect(r.success).toBe(true);
    });
    it('max + 1 → reject + VM', () => {
      const r = cableQuerySchema.safeParse({
        search: 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH + 1),
      });
      expect(r.success).toBe(false);
      if (!r.success)
        expect(r.error.issues[0].message).toBe(
          VM.string.max('검색어', VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH)
        );
    });
    it('whitespace → undefined', () => {
      const r = cableQuerySchema.safeParse({ search: '   ' });
      if (r.success) expect(r.data.search).toBeUndefined();
    });
    it('surrounding whitespace → trimmed', () => {
      const r = cableQuerySchema.safeParse({ search: '  케이블  ' });
      if (r.success) expect(r.data.search).toBe('케이블');
    });
  });

  describe('sort — CableSortEnum', () => {
    it.each([
      'managementNumber.asc',
      'managementNumber.desc',
      'lastMeasurementDate.asc',
      'createdAt.desc',
    ])('accepts: %s', (sort) => {
      expect(cableQuerySchema.safeParse({ sort }).success).toBe(true);
    });
    it.each(['unknown.asc', 'managementNumber.INVALID', 'managementNumber.ASC'])(
      'rejects: %s',
      (sort) => {
        expect(cableQuerySchema.safeParse({ sort }).success).toBe(false);
      }
    );
  });
});
