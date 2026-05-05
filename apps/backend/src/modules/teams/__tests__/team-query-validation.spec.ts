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

  describe('ids — optionalCsvUuid (UUID CSV 토큰 단위 형식 검증)', () => {
    const VALID_UUID_1 = '11111111-1111-4111-8111-111111111111';
    const VALID_UUID_2 = '22222222-2222-4222-8222-222222222222';

    it('valid UUID CSV → string[] transform', () => {
      const r = teamQuerySchema.safeParse({ ids: `${VALID_UUID_1},${VALID_UUID_2}` });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.ids).toEqual([VALID_UUID_1, VALID_UUID_2]);
    });
    it('invalid UUID token → reject (cast error/silent 0 결과 차단)', () => {
      const r = teamQuerySchema.safeParse({ ids: `${VALID_UUID_1},not-a-uuid` });
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues[0].message).toContain('팀 ID 목록');
    });
    it('LONG_CSV_MAX_LENGTH + 1 → reject', () => {
      const ids = 'a'.repeat(VALIDATION_RULES.LONG_CSV_MAX_LENGTH + 1);
      expect(teamQuerySchema.safeParse({ ids }).success).toBe(false);
    });
    it('whitespace only → undefined', () => {
      const r = teamQuerySchema.safeParse({ ids: '   ' });
      if (r.success) expect(r.data.ids).toBeUndefined();
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
