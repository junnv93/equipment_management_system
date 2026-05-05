import { VM, equipmentFilterSchema, SCHEMA_VALIDATION_RULES } from '@equipment-management/schemas';

describe('equipmentFilterSchema — packages/schemas Query SSOT trim/max + sort enum', () => {
  describe('search/location/manufacturer — optionalTrimmedString', () => {
    it.each(['search', 'location', 'manufacturer'] as const)('%s: max → accept', (field) => {
      const r = equipmentFilterSchema.safeParse({
        [field]: 'a'.repeat(SCHEMA_VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH),
      });
      expect(r.success).toBe(true);
    });
    it.each(['search', 'location', 'manufacturer'] as const)('%s: max + 1 → reject', (field) => {
      const r = equipmentFilterSchema.safeParse({
        [field]: 'a'.repeat(SCHEMA_VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH + 1),
      });
      expect(r.success).toBe(false);
    });
    it('search: VM message', () => {
      const r = equipmentFilterSchema.safeParse({
        search: 'a'.repeat(SCHEMA_VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH + 1),
      });
      if (!r.success)
        expect(r.error.issues[0].message).toBe(
          VM.string.max('검색어', SCHEMA_VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH)
        );
    });
    it('search: whitespace only → undefined', () => {
      const r = equipmentFilterSchema.safeParse({ search: '   ' });
      if (r.success) expect(r.data.search).toBeUndefined();
    });
    it('search: surrounding whitespace → trimmed', () => {
      const r = equipmentFilterSchema.safeParse({ search: '  Receiver  ' });
      if (r.success) expect(r.data.search).toBe('Receiver');
    });
  });

  describe('sort — EquipmentSortEnum', () => {
    it.each([
      'managementNumber.asc',
      'name.asc',
      'status.desc',
      'location.asc',
      'manufacturer.desc',
      'teamId.asc',
      'managerId.desc',
      'nextCalibrationDate.asc',
      'modelName.desc',
      'isActive.asc',
    ])('accepts: %s', (sort) => {
      expect(equipmentFilterSchema.safeParse({ sort }).success).toBe(true);
    });
    it.each(['unknown.asc', 'managementNumber.INVALID', 'name.ASC', 'sql; DROP'])(
      'rejects: %s',
      (sort) => {
        expect(equipmentFilterSchema.safeParse({ sort }).success).toBe(false);
      }
    );
  });
});
