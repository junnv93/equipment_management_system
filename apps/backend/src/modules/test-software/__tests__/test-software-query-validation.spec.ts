import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { testSoftwareQuerySchema } from '../dto/test-software-query.dto';

describe('testSoftwareQuerySchema — Query DTO trim/max + sort enum SSOT', () => {
  describe('search field — optionalTrimmedString', () => {
    it('trim → accept (max 정확히)', () => {
      const search = 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH);
      const r = testSoftwareQuerySchema.safeParse({ search });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.search).toBe(search);
    });

    it('max + 1 → reject', () => {
      const search = 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH + 1);
      const r = testSoftwareQuerySchema.safeParse({ search });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues[0].message).toBe(
          VM.string.max('검색어', VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH)
        );
      }
    });

    it('whitespace only → undefined (trim + transform)', () => {
      const r = testSoftwareQuerySchema.safeParse({ search: '   ' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.search).toBeUndefined();
    });

    it('surrounding whitespace → trimmed', () => {
      const r = testSoftwareQuerySchema.safeParse({ search: '  검색  ' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.search).toBe('검색');
    });
  });

  describe('manufacturer field — optionalTrimmedString', () => {
    it('max + 1 → reject', () => {
      const manufacturer = 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH + 1);
      const r = testSoftwareQuerySchema.safeParse({ manufacturer });
      expect(r.success).toBe(false);
    });

    it('whitespace only → undefined', () => {
      const r = testSoftwareQuerySchema.safeParse({ manufacturer: '   ' });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.manufacturer).toBeUndefined();
    });
  });

  describe('sort field — TestSoftwareSortEnum allowlist', () => {
    it.each([
      'name.asc',
      'name.desc',
      'managementNumber.asc',
      'testField.desc',
      'createdAt.asc',
      'createdAt.desc',
    ])('accepts valid combined value: %s', (sort) => {
      const r = testSoftwareQuerySchema.safeParse({ sort });
      expect(r.success).toBe(true);
    });

    it.each([
      'unknownField.asc',
      'name.invalidDir',
      'createdAt; DROP TABLE',
      'name.ASC', // case-sensitive
    ])('rejects unauthorized value: %s', (sort) => {
      const r = testSoftwareQuerySchema.safeParse({ sort });
      expect(r.success).toBe(false);
    });
  });
});
