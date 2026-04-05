import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@equipment-management/shared-constants';
import { CableConnectorTypeEnum, CableStatusEnum, SiteEnum } from '@equipment-management/schemas';

export const cableQuerySchema = z.object({
  search: z.string().optional(),
  connectorType: CableConnectorTypeEnum.optional(),
  status: CableStatusEnum.optional(),
  site: SiteEnum.optional(),
  sort: z.string().optional(),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1).default(1)),
  pageSize: z.preprocess(
    (val) => (val ? Number(val) : DEFAULT_PAGE_SIZE),
    z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE)
  ),
});

export type CableQueryInput = z.infer<typeof cableQuerySchema>;
export const CableQueryValidationPipe = new ZodValidationPipe(cableQuerySchema, {
  targets: ['query'],
});
