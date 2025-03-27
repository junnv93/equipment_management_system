import { IsEnum, IsOptional, IsUUID, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationStatus } from '../entities/reservation.entity';
import { ReservationQuery as IReservationQuery, ReservationQuerySchema } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

export class ReservationQueryDto implements IReservationQuery {
  @IsEnum(ReservationStatus)
  @IsOptional()
  @ApiPropertyOptional({
    enum: ReservationStatus,
    description: '예약 상태 필터',
  })
  status?: ReservationStatus;

  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({ description: '장비 ID 필터' })
  equipmentId?: string;

  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({ description: '사용자 ID 필터' })
  userId?: string;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({ description: '시작일 필터 (ISO 형식)' })
  startDate?: string;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({ description: '종료일 필터 (ISO 형식)' })
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({ description: '페이지 크기', default: 10 })
  limit?: number = 10;
}

// Zod 검증 파이프 생성
export const ReservationQueryValidationPipe = new ZodValidationPipe(ReservationQuerySchema); 