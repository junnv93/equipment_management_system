import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { userQuerySchema } from '../dto/user-query.dto';

describe('userQuerySchema — Query DTO trim/max + sort enum SSOT', () => {
  describe('free-text fields — optionalTrimmedString(EXTENDED_TEXT)', () => {
    it.each(['email', 'name', 'department', 'search'] as const)('%s: max → accept', (field) => {
      const r = userQuerySchema.safeParse({
        [field]: 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH),
      });
      expect(r.success).toBe(true);
    });
    it.each(['email', 'name', 'department', 'search'] as const)('%s: max + 1 → reject', (field) => {
      const r = userQuerySchema.safeParse({
        [field]: 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH + 1),
      });
      expect(r.success).toBe(false);
    });
    it('search: VM message', () => {
      const r = userQuerySchema.safeParse({
        search: 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH + 1),
      });
      if (!r.success)
        expect(r.error.issues[0].message).toBe(
          VM.string.max('검색어', VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH)
        );
    });
    it('email: whitespace → undefined', () => {
      const r = userQuerySchema.safeParse({ email: '   ' });
      if (r.success) expect(r.data.email).toBeUndefined();
    });
  });

  describe('roles — optionalCsvEnum (USER_ROLE_VALUES 토큰 단위 검증)', () => {
    it('valid CSV → array transform', () => {
      const r = userQuerySchema.safeParse({ roles: 'test_engineer,quality_manager' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.roles).toEqual(['test_engineer', 'quality_manager']);
    });
    it('invalid token → reject (silent miss 차단)', () => {
      expect(userQuerySchema.safeParse({ roles: 'test_engineer,UNKNOWN_ROLE' }).success).toBe(
        false
      );
    });
    it('LONG_CSV + 1 → reject', () => {
      expect(
        userQuerySchema.safeParse({ roles: 'a'.repeat(VALIDATION_RULES.LONG_CSV_MAX_LENGTH + 1) })
          .success
      ).toBe(false);
    });
  });

  describe('teams — optionalCsvUuid (UUID CSV 토큰 단위 형식 검증)', () => {
    const VALID_UUID_1 = '11111111-1111-4111-8111-111111111111';
    const VALID_UUID_2 = '22222222-2222-4222-8222-222222222222';

    it('valid UUID CSV → string[] transform', () => {
      const r = userQuerySchema.safeParse({ teams: `${VALID_UUID_1},${VALID_UUID_2}` });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.teams).toEqual([VALID_UUID_1, VALID_UUID_2]);
    });
    it('invalid UUID token → reject', () => {
      const r = userQuerySchema.safeParse({ teams: `${VALID_UUID_1},xyz` });
      expect(r.success).toBe(false);
      if (!r.success) expect(r.error.issues[0].message).toContain('팀 목록');
    });
    it('LONG_CSV + 1 → reject', () => {
      expect(
        userQuerySchema.safeParse({ teams: 'a'.repeat(VALIDATION_RULES.LONG_CSV_MAX_LENGTH + 1) })
          .success
      ).toBe(false);
    });
    it('whitespace only → undefined', () => {
      const r = userQuerySchema.safeParse({ teams: '   ' });
      if (r.success) expect(r.data.teams).toBeUndefined();
    });
  });

  describe('teamId — optionalUuid (verify-zod Step 18)', () => {
    it('valid UUID → accept', () => {
      const r = userQuerySchema.safeParse({
        teamId: '550e8400-e29b-41d4-a716-446655440010',
      });
      expect(r.success).toBe(true);
    });
    it('invalid UUID → reject', () => {
      const r = userQuerySchema.safeParse({ teamId: 'not-a-uuid' });
      expect(r.success).toBe(false);
    });
    it('empty string → undefined', () => {
      const r = userQuerySchema.safeParse({ teamId: '' });
      if (r.success) expect(r.data.teamId).toBeUndefined();
    });
  });

  describe('sort — UserSortEnum', () => {
    it.each([
      'name.asc',
      'name.desc',
      'email.asc',
      'role.desc',
      'site.asc',
      'createdAt.desc',
      'updatedAt.asc',
    ])('accepts: %s', (sort) => {
      expect(userQuerySchema.safeParse({ sort }).success).toBe(true);
    });
    it.each(['unknown.asc', 'name.INVALID', 'name.ASC', 'sql; DROP'])('rejects: %s', (sort) => {
      expect(userQuerySchema.safeParse({ sort }).success).toBe(false);
    });
  });
});
