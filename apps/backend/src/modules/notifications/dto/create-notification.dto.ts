import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  NotificationTypeEnum,
  NotificationPriorityEnum,
  NOTIFICATION_TYPE_VALUES,
  NOTIFICATION_PRIORITY_VALUES,
  NotificationType as NotificationTypeValues,
  NotificationPriority as NotificationPriorityValues,
  type NotificationType,
  type NotificationPriority,
} from '@equipment-management/schemas';

// Re-export for backward compatibility
// NotificationTypeEnum, NotificationPriorityEnum are Zod enums (for validation)
// NotificationTypeValues, NotificationPriorityValues are const objects (for dot-notation access)
export {
  NotificationTypeEnum,
  NotificationPriorityEnum,
  NOTIFICATION_TYPE_VALUES,
  NOTIFICATION_PRIORITY_VALUES,
  NotificationTypeValues as NotificationTypeConst,
  NotificationPriorityValues as NotificationPriorityConst,
  type NotificationType,
  type NotificationPriority,
};

// ========== Zod 스키마 정의 ==========

/**
 * 알림 생성 스키마
 */
export const createNotificationSchema = z.object({
  title: z
    .string()
    .min(1, '알림 제목을 입력해주세요')
    .max(100, '알림 제목은 100자 이하여야 합니다'),
  content: z
    .string()
    .min(1, '알림 내용을 입력해주세요')
    .max(500, '알림 내용은 500자 이하여야 합니다'),
  type: NotificationTypeEnum,
  priority: NotificationPriorityEnum.default('medium'),
  recipientId: z.string().uuid({ message: '유효한 수신자 UUID가 아닙니다' }),
  isTeamNotification: z.boolean().default(false),
  equipmentId: z.string().uuid({ message: '유효한 장비 UUID가 아닙니다' }).optional(),
  calibrationId: z.string().uuid({ message: '유효한 교정 UUID가 아닙니다' }).optional(),
  rentalId: z.string().uuid({ message: '유효한 대여 UUID가 아닙니다' }).optional(),
  linkUrl: z.string().max(200, '링크 URL은 200자 이하여야 합니다').optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export const CreateNotificationValidationPipe = new ZodValidationPipe(createNotificationSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class CreateNotificationDto {
  @ApiProperty({
    description: '알림 제목',
    example: '장비 교정 일정 알림',
  })
  title: string;

  @ApiProperty({
    description: '알림 내용',
    example: 'RF-Analyzer(SUW-E0001) 장비의 교정 일정이 2주 후로 예정되어 있습니다.',
  })
  content: string;

  @ApiProperty({
    description: '알림 유형',
    enum: NOTIFICATION_TYPE_VALUES,
    example: 'calibration_due',
  })
  type: NotificationType;

  @ApiProperty({
    description: '알림 우선순위',
    enum: NOTIFICATION_PRIORITY_VALUES,
    example: 'medium',
    default: 'medium',
  })
  priority?: NotificationPriority = 'medium';

  @ApiProperty({
    description: '수신자 ID (사용자 또는 팀)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  recipientId: string;

  @ApiProperty({
    description: '팀 알림 여부 (팀 전체에 전송되는 알림)',
    example: false,
    default: false,
  })
  isTeamNotification?: boolean = false;

  @ApiProperty({
    description: '관련 장비 ID',
    example: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    required: false,
  })
  equipmentId?: string;

  @ApiProperty({
    description: '관련 교정 ID',
    example: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
    required: false,
  })
  calibrationId?: string;

  @ApiProperty({
    description: '관련 대여/반출 ID',
    example: '7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v',
    required: false,
  })
  rentalId?: string;

  @ApiProperty({
    description: '링크 URL',
    example: '/equipment/1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    required: false,
  })
  linkUrl?: string;
}
