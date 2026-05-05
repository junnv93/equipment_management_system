import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { teamQuerySchema } from '../dto/team-query.dto';

describe('teamQuerySchema — Query DTO trim/max + sort enum SSOT', () => {
  describe('search', () => {
    it('max → accept', () => {
      const r = teamQuerySchema.safeParse({
        search: 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH),
      });
      expect(r.success).toBe(true);
    });
    it('max + 1 → reject + VM', () => {
      const r = teamQuerySchema.safeParse({
        search: 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH + 1),
      });
      expect(r.success).toBe(false);
      if (!r.success)
        expect(r.error.issues[0].message).toBe(
          VM.string.max('검색어', VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH)
        );
    });
    it('whitespace → undefined', () => {
      const r = teamQuerySchema.safeParse({ search: '   ' });
      if (r.success) expect(r.data.search).toBeUndefined();
    });
  });

  describe('ids (CSV)', () => {
    it('LONG_CSV_MAX_LENGTH → accept', () => {
      const ids = 'a'.repeat(VALIDATION_RULES.LONG_CSV_MAX_LENGTH);
      expect(teamQuerySchema.safeParse({ ids }).success).toBe(true);
    });
    it('LONG_CSV_MAX_LENGTH + 1 → reject', () => {
      const ids = 'a'.repeat(VALIDATION_RULES.LONG_CSV_MAX_LENGTH + 1);
      expect(teamQuerySchema.safeParse({ ids }).success).toBe(false);
    });
  });

  describe('sort — TeamSortEnum', () => {
    it.each(['name.asc', 'name.desc', 'classification.asc', 'createdAt.desc'])(
      'accepts: %s',
      (sort) => {
        expect(teamQuerySchema.safeParse({ sort }).success).toBe(true);
      }
    );
    it.each(['unknown.asc', 'name.INVALID', 'name.ASC'])('rejects: %s', (sort) => {
      expect(teamQuerySchema.safeParse({ sort }).success).toBe(false);
    });
  });
});
