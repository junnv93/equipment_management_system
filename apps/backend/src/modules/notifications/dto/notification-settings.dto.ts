import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

// ========== Enum 정의 ==========

export enum NotificationFrequencyEnum {
  IMMEDIATE = 'immediate',
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

// ========== Zod 스키마 정의 ==========

/**
 * 알림 설정 스키마
 */
export const notificationSettingsSchema = z.object({
  userId: z.string().uuid({ message: '유효한 사용자 UUID가 아닙니다' }),
  emailEnabled: z.boolean().default(true),
  inAppEnabled: z.boolean().default(true),
  calibrationDueEnabled: z.boolean().default(true),
  calibrationCompletedEnabled: z.boolean().default(true),
  intermediateCheckEnabled: z.boolean().default(true),
  calibrationApprovalEnabled: z.boolean().default(true),
  rentalRequestEnabled: z.boolean().default(true),
  rentalApprovedEnabled: z.boolean().default(true),
  rentalRejectedEnabled: z.boolean().default(true),
  returnRequestedEnabled: z.boolean().default(true),
  returnApprovedEnabled: z.boolean().default(true),
  returnRejectedEnabled: z.boolean().default(true),
  checkoutEnabled: z.boolean().default(true),
  maintenanceEnabled: z.boolean().default(true),
  systemNotificationsEnabled: z.boolean().default(true),
  notificationTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: '시간은 HH:MM 형식이어야 합니다 (예: 09:00)',
    })
    .default('09:00'),
  frequency: z
    .nativeEnum(NotificationFrequencyEnum, {
      message: '유효하지 않은 알림 빈도입니다',
    })
    .default(NotificationFrequencyEnum.IMMEDIATE),
});

export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>;
export const NotificationSettingsValidationPipe = new ZodValidationPipe(notificationSettingsSchema);

// ========== DTO 클래스 (Swagger 문서화용) ==========

export class NotificationSettingsDto {
  @ApiProperty({ description: '사용자 ID' })
  userId: string;

  @ApiProperty({
    description: '이메일 알림 활성화 여부',
    default: true,
    required: false,
  })
  emailEnabled?: boolean = true;

  @ApiProperty({
    description: '앱 내 알림 활성화 여부',
    default: true,
    required: false,
  })
  inAppEnabled?: boolean = true;

  @ApiProperty({
    description: '교정 예정 알림',
    default: true,
    required: false,
  })
  calibrationDueEnabled?: boolean = true;

  @ApiProperty({
    description: '교정 완료 알림',
    default: true,
    required: false,
  })
  calibrationCompletedEnabled?: boolean = true;

  @ApiProperty({
    description: '중간점검 알림',
    default: true,
    required: false,
  })
  intermediateCheckEnabled?: boolean = true;

  @ApiProperty({
    description: '교정 승인 알림',
    default: true,
    required: false,
  })
  calibrationApprovalEnabled?: boolean = true;

  @ApiProperty({
    description: '대여 요청 알림',
    default: true,
    required: false,
  })
  rentalRequestEnabled?: boolean = true;

  @ApiProperty({
    description: '대여 승인 알림',
    default: true,
    required: false,
  })
  rentalApprovedEnabled?: boolean = true;

  @ApiProperty({
    description: '대여 거절 알림',
    default: true,
    required: false,
  })
  rentalRejectedEnabled?: boolean = true;

  @ApiProperty({
    description: '반납 요청 알림',
    default: true,
    required: false,
  })
  returnRequestedEnabled?: boolean = true;

  @ApiProperty({
    description: '반납 승인 알림',
    default: true,
    required: false,
  })
  returnApprovedEnabled?: boolean = true;

  @ApiProperty({
    description: '반납 거절 알림',
    default: true,
    required: false,
  })
  returnRejectedEnabled?: boolean = true;

  @ApiProperty({
    description: '대여/반출 알림',
    default: true,
    required: false,
  })
  checkoutEnabled?: boolean = true;

  @ApiProperty({
    description: '유지보수 관련 알림',
    default: true,
    required: false,
  })
  maintenanceEnabled?: boolean = true;

  @ApiProperty({
    description: '시스템 알림 활성화 여부',
    default: true,
    required: false,
  })
  systemNotificationsEnabled?: boolean = true;

  @ApiProperty({
    description: '알림 시간 (HH:MM 형식)',
    default: '09:00',
    required: false,
    example: '09:00',
  })
  notificationTime?: string = '09:00';

  @ApiProperty({
    description: '알림 빈도',
    enum: NotificationFrequencyEnum,
    default: NotificationFrequencyEnum.IMMEDIATE,
    required: false,
  })
  frequency?: NotificationFrequencyEnum = NotificationFrequencyEnum.IMMEDIATE;
}
