import { IsNotEmpty, IsString, IsUUID, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationStatus } from '../entities/reservation.entity';
import { CreateReservationDto as ICreateReservationDto, ReservationStatusEnum } from '@equipment-management/schemas';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CreateReservationDtoSchema } from '@equipment-management/schemas';

export class CreateReservationDto implements ICreateReservationDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: '장비 ID' })
  equipmentId: string;

  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({ description: '사용자 ID (서버에서 현재 로그인한 사용자로 자동 설정)' })
  userId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: '예약 목적' })
  purpose: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({ description: '시작 일시 (ISO 형식)' })
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({ description: '종료 일시 (ISO 형식)' })
  endDate: string;

  @IsEnum(ReservationStatus)
  @IsOptional()
  @ApiPropertyOptional({ 
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
    description: '예약 상태' 
  })
  status?: ReservationStatus;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: '비고' })
  notes?: string;
}

// Zod 검증 파이프 생성
export const CreateReservationValidationPipe = new ZodValidationPipe(CreateReservationDtoSchema); 