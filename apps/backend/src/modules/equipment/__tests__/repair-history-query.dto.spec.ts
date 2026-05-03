import { MAX_PAGE_SIZE } from '@equipment-management/shared-constants';
import { repairHistoryQuerySchema } from '../dto/repair-history.dto';

describe('repairHistoryQuerySchema', () => {
  it('pageSize 최대값은 MAX_PAGE_SIZE를 사용한다', () => {
    const boundary = repairHistoryQuerySchema.safeParse({ pageSize: String(MAX_PAGE_SIZE) });
    expect(boundary.success).toBe(true);

    const overflow = repairHistoryQuerySchema.safeParse({ pageSize: String(MAX_PAGE_SIZE + 1) });
    expect(overflow.success).toBe(false);
  });
});
