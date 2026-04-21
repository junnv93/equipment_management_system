import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { NotificationPriorityEnum } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

export const createSystemNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  priority: NotificationPriorityEnum.optional().default('medium'),
});

export class CreateSystemNotificationDto extends createZodDto(createSystemNotificationSchema) {}
export const CreateSystemNotificationPipe = new ZodValidationPipe(createSystemNotificationSchema);
