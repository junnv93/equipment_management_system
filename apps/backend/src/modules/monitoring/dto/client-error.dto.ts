import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

export const clientErrorSchema = z.object({
  message: z.string().min(1).max(1000),
  stack: z.string().max(5000).optional(),
  component: z.string().max(200).optional(),
  url: z.string().max(2000),
  userAgent: z.string().max(500),
  timestamp: z.string(),
});

export class ClientErrorDto extends createZodDto(clientErrorSchema) {}
export const ClientErrorPipe = new ZodValidationPipe(clientErrorSchema);
