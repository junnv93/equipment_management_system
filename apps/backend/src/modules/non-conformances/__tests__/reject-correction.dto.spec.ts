import { rejectCorrectionSchema } from '../dto/reject-correction.dto';
import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';

describe('rejectCorrectionSchema — rejectionReason 검증', () => {
  it('should reject empty rejectionReason', () => {
    const result = rejectCorrectionSchema.safeParse({ version: 1, rejectionReason: '' });
    expect(result.success).toBe(false);
  });

  it('should reject whitespace-only rejectionReason', () => {
    const result = rejectCorrectionSchema.safeParse({ version: 1, rejectionReason: '   ' });
    expect(result.success).toBe(false);
  });

  it('should trim and accept valid rejectionReason', () => {
    const result = rejectCorrectionSchema.safeParse({
      version: 1,
      rejectionReason: '  재검토 필요 — 추가 검토 요망  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rejectionReason).toBe('재검토 필요 — 추가 검토 요망');
    }
  });

  it('should accept valid rejectionReason without spaces', () => {
    const result = rejectCorrectionSchema.safeParse({
      version: 1,
      rejectionReason: 'test reason placeholder',
    });
    expect(result.success).toBe(true);
  });

  it('should reject rejectionReason over LONG_TEXT_MAX_LENGTH', () => {
    const result = rejectCorrectionSchema.safeParse({
      version: 1,
      rejectionReason: '가'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        VM.string.max('반려 사유', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
      );
    }
  });
});
