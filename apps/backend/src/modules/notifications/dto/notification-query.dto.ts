import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  Min,
  Max,
  IsInt,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationTypeEnum, NotificationPriorityEnum } from './create-notification.dto';

export class NotificationQueryDto {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: '알림 수신자 ID' })
  recipientId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: '팀 ID' })
  teamId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: '장비 ID' })
  equipmentId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: '교정 ID' })
  calibrationId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: '대여 ID' })
  rentalId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @ApiPropertyOptional({ description: '읽음 여부로 필터링' })
  isRead?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: '검색어 (제목, 내용)' })
  search?: string;

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @ApiPropertyOptional({
    description: '알림 유형 (여러 개 선택 가능)',
    enum: NotificationTypeEnum,
    isArray: true,
  })
  types?: NotificationTypeEnum[];

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @ApiPropertyOptional({
    description: '알림 우선순위 (여러 개 선택 가능)',
    enum: NotificationPriorityEnum,
    isArray: true,
  })
  priorities?: NotificationPriorityEnum[];

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: '시작 날짜 (ISO 형식)' })
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: '종료 날짜 (ISO 형식)' })
  toDate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: '정렬 기준 (예: createdAt.desc)' })
  sort?: string = 'createdAt.desc';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({
    description: '페이지 번호',
    type: Number,
    minimum: 1,
    default: 1,
  })
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @ApiPropertyOptional({
    description: '페이지당 항목 수',
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  pageSize?: number = 20;
}
