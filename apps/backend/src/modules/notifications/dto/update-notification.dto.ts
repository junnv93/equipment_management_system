import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  NotificationPriorityEnum,
  NOTIFICATION_PRIORITY_VALUES,
  VM,
  type NotificationPriority,
} from '@equipment-management/schemas';

// ========== Zod 스키마 정의 ==========

/**
 * 알림 수정 스키마
 * recipientId와 type은 수정 불가
 */
export const updateNotificationSchema = z.object({
  title: z
    .string()
    .min(1, VM.notification.title.required)
    .max(100, VM.string.max('알림 제목', 100))
    .optional(),
  content: z
    .string()
    .min(1, VM.notification.content.required)
    .max(500, VM.string.max('알림 내용', 500))
    .optional(),
  priority: NotificationPriorityEnum.optional(),
  isTeamNotification: z.boolean().optional(),
  equipmentId: z
    .string()
    .uuid({ message: VM.uuid.invalid('장비') })
    .optional(),
  calibrationId: z
    .string()
    .uuid({ message: VM.uuid.invalid('교정') })
    .optional(),
  rentalId: z
    .string()
    .uuid({ message: VM.uuid.invalid('대여') })
    .optional(),
  linkUrl: z.string().max(200, VM.string.max('링크 URL', 200)).optional(),
  isRead: z.boolean().optional(),
});

export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
export const UpdateNotificationValidationPipe = new ZodValidationPipe(updateNotificationSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class UpdateNotificationDto {
  @ApiPropertyOptional({
    description: '알림 제목',
    example: '장비 교정 일정 알림',
  })
  title?: string;

  @ApiPropertyOptional({
    description: '알림 내용',
    example: 'RF-Analyzer(SUW-E0001) 장비의 교정 일정이 2주 후로 예정되어 있습니다.',
  })
  content?: string;

  @ApiPropertyOptional({
    description: '알림 우선순위',
    enum: NOTIFICATION_PRIORITY_VALUES,
  })
  priority?: NotificationPriority;

  @ApiPropertyOptional({
    description: '팀 알림 여부',
  })
  isTeamNotification?: boolean;

  @ApiPropertyOptional({
    description: '관련 장비 ID',
  })
  equipmentId?: string;

  @ApiPropertyOptional({
    description: '관련 교정 ID',
  })
  calibrationId?: string;

  @ApiPropertyOptional({
    description: '관련 대여/반출 ID',
  })
  rentalId?: string;

  @ApiPropertyOptional({
    description: '링크 URL',
  })
  linkUrl?: string;

  @ApiProperty({
    description: '읽음 상태',
    example: true,
    default: false,
  })
  isRead?: boolean;
}
