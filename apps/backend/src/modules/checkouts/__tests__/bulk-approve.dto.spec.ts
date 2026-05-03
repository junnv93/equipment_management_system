import { VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { bulkApproveSchema } from '../dto/bulk-approve.dto';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const BULK_MAX = VALIDATION_RULES.BULK_OPERATION_MAX_COUNT;

describe('bulkApproveSchema', () => {
  describe('ids 검증', () => {
    it('1건 → 통과', () => {
      const result = bulkApproveSchema.safeParse({ ids: [VALID_UUID] });
      expect(result.success).toBe(true);
    });

    it('빈 배열 → 실패 (VM.array.minCases)', () => {
      const result = bulkApproveSchema.safeParse({ ids: [] });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(VM.array.minCases(1));
      }
    });

    it(`정확히 ${BULK_MAX}건 → 통과`, () => {
      const ids = Array.from({ length: BULK_MAX }, () => VALID_UUID);
      const result = bulkApproveSchema.safeParse({ ids });
      expect(result.success).toBe(true);
    });

    it(`${BULK_MAX + 1}건 → 실패 (VM.array.maxCases)`, () => {
      const ids = Array.from({ length: BULK_MAX + 1 }, () => VALID_UUID);
      const result = bulkApproveSchema.safeParse({ ids });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(VM.array.maxCases(BULK_MAX));
      }
    });
  });
});
