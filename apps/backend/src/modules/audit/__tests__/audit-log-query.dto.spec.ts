import { MAX_PAGE_SIZE } from '@equipment-management/shared-constants';
import { auditLogQuerySchema } from '../dto/audit-log-query.dto';

describe('auditLogQuerySchema', () => {
  it('limit 최대값은 MAX_PAGE_SIZE를 사용한다', () => {
    const boundary = auditLogQuerySchema.safeParse({ limit: String(MAX_PAGE_SIZE) });
    expect(boundary.success).toBe(true);

    const overflow = auditLogQuerySchema.safeParse({ limit: String(MAX_PAGE_SIZE + 1) });
    expect(overflow.success).toBe(false);
  });
});
