import { VM } from '@equipment-management/schemas';
import { createEquipmentImportSchema } from '../dto/create-equipment-import.dto';

const baseImport = {
  sourceType: 'rental',
  equipmentName: 'EMC Receiver',
  classification: 'fcc_emc_rf',
  usagePeriodStart: '2026-03-01T00:00:00.000Z',
  usagePeriodEnd: '2026-06-01T00:00:00.000Z',
  reason: '정기 교정 기간 중 대체 장비 필요',
  vendorName: 'ABC Rental',
} as const;

describe('createEquipmentImportSchema', () => {
  it('사용 종료일이 시작일 이후면 통과', () => {
    const result = createEquipmentImportSchema.safeParse(baseImport);
    expect(result.success).toBe(true);
  });

  it('사용 종료일이 시작일보다 빠르거나 같으면 VM.equipmentImport.dateRangeInvalid로 실패', () => {
    const result = createEquipmentImportSchema.safeParse({
      ...baseImport,
      usagePeriodEnd: baseImport.usagePeriodStart,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['usagePeriodEnd']);
      expect(result.error.issues[0].message).toBe(VM.equipmentImport.dateRangeInvalid);
    }
  });
});
