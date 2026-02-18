import { z } from 'zod';
import { NotificationPriorityEnum } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

export const createSystemNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  priority: NotificationPriorityEnum.optional().default('medium'),
});

export type CreateSystemNotificationDto = z.infer<typeof createSystemNotificationSchema>;
export const CreateSystemNotificationPipe = new ZodValidationPipe(createSystemNotificationSchema);
