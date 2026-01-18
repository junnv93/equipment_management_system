import { PartialType, OmitType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { CreateCalibrationDto } from './create-calibration.dto';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { CalibrationStatusEnum } from '@equipment-management/schemas';

export class UpdateCalibrationDto extends PartialType(
  OmitType(CreateCalibrationDto, ['equipmentId'] as const)
) {
  @ApiProperty({
    description: '교정 상태',
    enum: CalibrationStatusEnum,
    example: 'completed',
    required: false,
  })
  @IsEnum(CalibrationStatusEnum)
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: '교정 결과 (합격/불합격)',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPassed?: boolean;

  @ApiProperty({
    description: '교정 결과 메모',
    example: '모든 파라미터가 허용 오차 범위 내에 있습니다.',
    required: false,
  })
  @IsString()
  @IsOptional()
  resultNotes?: string;
}
