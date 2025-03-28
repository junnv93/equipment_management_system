import { IsUUID, IsBoolean, IsString, IsOptional, IsEnum, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationFrequencyEnum {
  IMMEDIATE = 'immediate',
  DAILY = 'daily', 
  WEEKLY = 'weekly'
}

export class NotificationSettingsDto {
  @IsUUID()
  @ApiProperty({ description: '사용자 ID' })
  userId: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ 
    description: '이메일 알림 활성화 여부', 
    default: true,
    required: false 
  })
  emailEnabled?: boolean = true;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ 
    description: '앱 내 알림 활성화 여부', 
    default: true,
    required: false 
  })
  inAppEnabled?: boolean = true;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ 
    description: '교정 예정 알림', 
    default: true,
    required: false 
  })
  calibrationDueEnabled?: boolean = true;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ 
    description: '교정 완료 알림', 
    default: true,
    required: false 
  })
  calibrationCompletedEnabled?: boolean = true;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ 
    description: '대여 요청 알림', 
    default: true,
    required: false 
  })
  rentalRequestEnabled?: boolean = true;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ 
    description: '대여 승인 알림', 
    default: true,
    required: false 
  })
  rentalApprovedEnabled?: boolean = true;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ 
    description: '대여 거절 알림', 
    default: true,
    required: false 
  })
  rentalRejectedEnabled?: boolean = true;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ 
    description: '반납 요청 알림', 
    default: true,
    required: false 
  })
  returnRequestedEnabled?: boolean = true;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ 
    description: '반납 승인 알림', 
    default: true,
    required: false 
  })
  returnApprovedEnabled?: boolean = true;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ 
    description: '반납 거절 알림', 
    default: true,
    required: false 
  })
  returnRejectedEnabled?: boolean = true;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ 
    description: '대여/반출 알림', 
    default: true,
    required: false 
  })
  checkoutEnabled?: boolean = true;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ 
    description: '유지보수 관련 알림', 
    default: true,
    required: false 
  })
  maintenanceEnabled?: boolean = true;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ 
    description: '시스템 알림 활성화 여부', 
    default: true,
    required: false 
  })
  systemNotificationsEnabled?: boolean = true;

  @IsString()
  @IsOptional()
  @ApiProperty({ 
    description: '알림 시간 (HH:MM 형식)', 
    default: '09:00',
    required: false,
    example: '09:00' 
  })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: '시간은 HH:MM 형식이어야 합니다 (예: 09:00).'
  })
  notificationTime?: string = '09:00';

  @IsEnum(NotificationFrequencyEnum)
  @IsOptional()
  @ApiProperty({ 
    description: '알림 빈도', 
    enum: NotificationFrequencyEnum,
    default: NotificationFrequencyEnum.IMMEDIATE,
    required: false 
  })
  frequency?: NotificationFrequencyEnum = NotificationFrequencyEnum.IMMEDIATE;
} 