import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { equipmentImportQuerySchema } from '../dto/equipment-import-query.dto';

describe('equipmentImportQuerySchema — Query DTO trim/max + (existing) sort enum', () => {
  describe('search', () => {
    it('max → accept', () => {
      const r = equipmentImportQuerySchema.safeParse({
        search: 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH),
      });
      expect(r.success).toBe(true);
    });
    it('max + 1 → reject + VM', () => {
      const r = equipmentImportQuerySchema.safeParse({
        search: 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH + 1),
      });
      expect(r.success).toBe(false);
      if (!r.success)
        expect(r.error.issues[0].message).toBe(
          VM.string.max('검색어', VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH)
        );
    });
    it('whitespace → undefined', () => {
      const r = equipmentImportQuerySchema.safeParse({ search: '   ' });
      if (r.success) expect(r.data.search).toBeUndefined();
    });
  });

  // 신규 결합형 sort enum (시스템 일관성 SSOT)
  describe('sort — EquipmentImportSortEnum (결합형 SSOT)', () => {
    it.each([
      'createdAt.asc',
      'createdAt.desc',
      'usagePeriodStart.asc',
      'usagePeriodEnd.desc',
      'status.asc',
    ])('accepts: %s', (sort) => {
      expect(equipmentImportQuerySchema.safeParse({ sort }).success).toBe(true);
    });
    it.each(['unknown.asc', 'createdAt.INVALID', 'createdAt.ASC', 'sql; DROP'])(
      'rejects: %s',
      (sort) => {
        expect(equipmentImportQuerySchema.safeParse({ sort }).success).toBe(false);
      }
    );
  });
});
