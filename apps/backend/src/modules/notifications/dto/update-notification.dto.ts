import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { NotificationPriorityEnum } from './create-notification.dto';

// ========== Zod 스키마 정의 ==========

/**
 * 알림 수정 스키마
 * recipientId와 type은 수정 불가
 */
export const updateNotificationSchema = z.object({
  title: z
    .string()
    .min(1, '알림 제목을 입력해주세요')
    .max(100, '알림 제목은 100자 이하여야 합니다')
    .optional(),
  content: z
    .string()
    .min(1, '알림 내용을 입력해주세요')
    .max(500, '알림 내용은 500자 이하여야 합니다')
    .optional(),
  priority: z
    .nativeEnum(NotificationPriorityEnum, {
      message: '유효하지 않은 우선순위입니다',
    })
    .optional(),
  isTeamNotification: z.boolean().optional(),
  equipmentId: z.string().uuid({ message: '유효한 장비 UUID가 아닙니다' }).optional(),
  calibrationId: z.string().uuid({ message: '유효한 교정 UUID가 아닙니다' }).optional(),
  rentalId: z.string().uuid({ message: '유효한 대여 UUID가 아닙니다' }).optional(),
  linkUrl: z.string().max(200, '링크 URL은 200자 이하여야 합니다').optional(),
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
    enum: NotificationPriorityEnum,
  })
  priority?: NotificationPriorityEnum;

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
