import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { NotificationPriorityEnum, VM } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

export const createSystemNotificationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, VM.notification.title.required)
    .max(200, VM.string.max('알림 제목', 200)),
  content: z
    .string()
    .trim()
    .min(1, VM.notification.content.required)
    .max(
      VALIDATION_RULES.LONG_TEXT_MAX_LENGTH,
      VM.string.max('알림 내용', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)
    ),
  priority: NotificationPriorityEnum.optional().default('medium'),
});

export class CreateSystemNotificationDto extends createZodDto(createSystemNotificationSchema) {}
export const CreateSystemNotificationPipe = new ZodValidationPipe(createSystemNotificationSchema);
