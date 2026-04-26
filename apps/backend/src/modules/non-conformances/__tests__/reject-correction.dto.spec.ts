import { rejectCorrectionSchema } from '../dto/reject-correction.dto';

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
      rejectionReason: '  재검토 필요  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rejectionReason).toBe('재검토 필요');
    }
  });

  it('should accept valid rejectionReason without spaces', () => {
    const result = rejectCorrectionSchema.safeParse({ version: 1, rejectionReason: 'test reason' });
    expect(result.success).toBe(true);
  });
});
