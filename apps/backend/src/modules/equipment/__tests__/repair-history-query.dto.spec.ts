import { MAX_PAGE_SIZE, VALIDATION_RULES } from '@equipment-management/shared-constants';
import { VM } from '@equipment-management/schemas';
import { createRepairHistorySchema, repairHistoryQuerySchema } from '../dto/repair-history.dto';

describe('repairHistoryQuerySchema', () => {
  it('pageSize 최대값은 MAX_PAGE_SIZE를 사용한다', () => {
    const boundary = repairHistoryQuerySchema.safeParse({ pageSize: String(MAX_PAGE_SIZE) });
    expect(boundary.success).toBe(true);

    const overflow = repairHistoryQuerySchema.safeParse({ pageSize: String(MAX_PAGE_SIZE + 1) });
    expect(overflow.success).toBe(false);
  });
});

describe('createRepairHistorySchema', () => {
  const base = {
    repairDate: '2026-05-03',
  };

  it('수리 내용은 trim 후 10자 미만이면 실패한다', () => {
    const result = createRepairHistorySchema.safeParse({
      ...base,
      repairDescription: ` ${'가'.repeat(9)} `,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(VM.string.min('수리 내용', 10));
    }
  });

  it('수리 내용은 trim 후 10자 이상이면 trimmed value를 반환한다', () => {
    const result = createRepairHistorySchema.safeParse({
      ...base,
      repairDescription: ` ${'가'.repeat(10)} `,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.repairDescription).toBe('가'.repeat(10));
    }
  });

  it('수리 내용은 LONG_TEXT_MAX_LENGTH를 초과하면 실패한다', () => {
    const result = createRepairHistorySchema.safeParse({
      ...base,
      repairDescription: '가'.repeat(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        VM.string.max('수리 내용', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
      );
    }
  });
});
