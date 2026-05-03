/// <reference types="jest" />

import { MAX_PAGE_SIZE } from '../pagination';
import { paginationParamsSchema } from '../common/base';
import { equipmentFilterSchema } from '../equipment';

describe('pagination SSOT', () => {
  it('common pagination params use MAX_PAGE_SIZE', () => {
    expect(paginationParamsSchema.safeParse({ page: 1, pageSize: MAX_PAGE_SIZE }).success).toBe(
      true
    );
    expect(paginationParamsSchema.safeParse({ page: 1, pageSize: MAX_PAGE_SIZE + 1 }).success).toBe(
      false
    );
  });

  it('equipment filters use MAX_PAGE_SIZE', () => {
    expect(equipmentFilterSchema.safeParse({ pageSize: MAX_PAGE_SIZE }).success).toBe(true);
    expect(equipmentFilterSchema.safeParse({ pageSize: MAX_PAGE_SIZE + 1 }).success).toBe(false);
  });
});
