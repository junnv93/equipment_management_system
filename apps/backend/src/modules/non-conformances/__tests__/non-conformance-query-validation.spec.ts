import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { nonConformanceQuerySchema } from '../dto/non-conformance-query.dto';

describe('nonConformanceQuerySchema — Query DTO trim/max + sort enum SSOT', () => {
  describe('search field', () => {
    it('max → accept', () => {
      const r = nonConformanceQuerySchema.safeParse({
        search: 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH),
      });
      expect(r.success).toBe(true);
    });
    it('max + 1 → reject + VM message', () => {
      const r = nonConformanceQuerySchema.safeParse({
        search: 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH + 1),
      });
      expect(r.success).toBe(false);
      if (!r.success)
        expect(r.error.issues[0].message).toBe(
          VM.string.max('검색어', VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH)
        );
    });
    it('whitespace only → undefined', () => {
      const r = nonConformanceQuerySchema.safeParse({ search: '   ' });
      if (r.success) expect(r.data.search).toBeUndefined();
    });
    it('surrounding whitespace → trimmed', () => {
      const r = nonConformanceQuerySchema.safeParse({ search: '  부적합  ' });
      if (r.success) expect(r.data.search).toBe('부적합');
    });
  });

  describe('sort — NonConformanceSortEnum', () => {
    it.each([
      'discoveryDate.asc',
      'discoveryDate.desc',
      'status.asc',
      'createdAt.desc',
      'updatedAt.asc',
    ])('accepts: %s', (sort) => {
      expect(nonConformanceQuerySchema.safeParse({ sort }).success).toBe(true);
    });
    it.each(['unknown.asc', 'discoveryDate.INVALID', 'discoveryDate.ASC'])(
      'rejects: %s',
      (sort) => {
        expect(nonConformanceQuerySchema.safeParse({ sort }).success).toBe(false);
      }
    );
  });
});
