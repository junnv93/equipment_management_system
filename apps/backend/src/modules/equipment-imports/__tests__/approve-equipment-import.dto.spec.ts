import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { VM } from '@equipment-management/schemas';
import { approveEquipmentImportSchema } from '../dto/approve-equipment-import.dto';

describe('approveEquipmentImportSchema', () => {
  it('승인 코멘트는 optional이고 입력되면 trim한다', () => {
    const omitted = approveEquipmentImportSchema.safeParse({ version: 1 });
    expect(omitted.success).toBe(true);

    const result = approveEquipmentImportSchema.safeParse({
      version: 1,
      comment: '  검토 완료  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.comment).toBe('검토 완료');
    }
  });

  it('승인 코멘트는 LONG_TEXT_MAX_LENGTH를 초과하면 실패한다', () => {
    const result = approveEquipmentImportSchema.safeParse({
      version: 1,
      comment: '가'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        VM.string.max('승인 코멘트', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
      );
    }
  });
});
