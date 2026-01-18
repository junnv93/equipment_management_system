import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNotEmpty,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationTypeEnum {
  CALIBRATION_DUE = 'calibration_due',
  CALIBRATION_COMPLETED = 'calibration_completed',
  RENTAL_REQUEST = 'rental_request',
  RENTAL_APPROVED = 'rental_approved',
  RENTAL_REJECTED = 'rental_rejected',
  RENTAL_COMPLETED = 'rental_completed',
  RETURN_REQUESTED = 'return_requested',
  RETURN_APPROVED = 'return_approved',
  RETURN_REJECTED = 'return_rejected',
  EQUIPMENT_MAINTENANCE = 'equipment_maintenance',
  SYSTEM = 'system',
  CHECKOUT = 'checkout',
  MAINTENANCE = 'maintenance',
}

export enum NotificationPriorityEnum {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class CreateNotificationDto {
  @ApiProperty({
    description: '알림 제목',
    example: '장비 교정 일정 알림',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({
    description: '알림 내용',
    example: 'RF-Analyzer(EQ-001) 장비의 교정 일정이 2주 후로 예정되어 있습니다.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  content: string;

  @ApiProperty({
    description: '알림 유형',
    enum: NotificationTypeEnum,
    example: NotificationTypeEnum.CALIBRATION_DUE,
  })
  @IsEnum(NotificationTypeEnum)
  @IsNotEmpty()
  type: NotificationTypeEnum;

  @ApiProperty({
    description: '알림 우선순위',
    enum: NotificationPriorityEnum,
    example: NotificationPriorityEnum.MEDIUM,
    default: NotificationPriorityEnum.MEDIUM,
  })
  @IsEnum(NotificationPriorityEnum)
  @IsOptional()
  priority?: NotificationPriorityEnum = NotificationPriorityEnum.MEDIUM;

  @ApiProperty({
    description: '수신자 ID (사용자 또는 팀)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID('4')
  @IsNotEmpty()
  recipientId: string;

  @ApiProperty({
    description: '팀 알림 여부 (팀 전체에 전송되는 알림)',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isTeamNotification?: boolean = false;

  @ApiProperty({
    description: '관련 장비 ID',
    example: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  equipmentId?: string;

  @ApiProperty({
    description: '관련 교정 ID',
    example: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  calibrationId?: string;

  @ApiProperty({
    description: '관련 대여/반출 ID',
    example: '7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  rentalId?: string;

  @ApiProperty({
    description: '링크 URL',
    example: '/equipment/1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  linkUrl?: string;
}
