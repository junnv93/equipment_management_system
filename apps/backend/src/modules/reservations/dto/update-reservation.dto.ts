import { IsString, IsUUID, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationStatus } from '../entities/reservation.entity';
import { UpdateReservationDto as IUpdateReservationDto, UpdateReservationDtoSchema } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';

export class UpdateReservationDto implements IUpdateReservationDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: '예약 목적' })
  purpose?: string;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({ description: '시작 일시 (ISO 형식)' })
  startDate?: string;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({ description: '종료 일시 (ISO 형식)' })
  endDate?: string;

  @IsEnum(ReservationStatus)
  @IsOptional()
  @ApiPropertyOptional({ 
    enum: ReservationStatus,
    description: '예약 상태' 
  })
  status?: ReservationStatus;

  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({ description: '승인자 ID' })
  approvedById?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: '거절 사유' })
  rejectionReason?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: '비고' })
  notes?: string;
}

// Zod 검증 파이프 생성
export const UpdateReservationValidationPipe = new ZodValidationPipe(UpdateReservationDtoSchema); 