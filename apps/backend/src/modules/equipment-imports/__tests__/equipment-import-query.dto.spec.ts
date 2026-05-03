import { MAX_PAGE_SIZE } from '@equipment-management/shared-constants';
import { equipmentImportQuerySchema } from '../dto/equipment-import-query.dto';

describe('equipmentImportQuerySchema', () => {
  it('limit 최대값은 MAX_PAGE_SIZE를 사용한다', () => {
    const boundary = equipmentImportQuerySchema.safeParse({ limit: String(MAX_PAGE_SIZE) });
    expect(boundary.success).toBe(true);

    const overflow = equipmentImportQuerySchema.safeParse({ limit: String(MAX_PAGE_SIZE + 1) });
    expect(overflow.success).toBe(false);
  });
});
