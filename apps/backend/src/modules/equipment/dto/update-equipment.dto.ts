import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { CreateEquipmentDto } from './create-equipment.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { EquipmentStatusEnum } from '../../../types';

export class UpdateEquipmentDto extends PartialType(CreateEquipmentDto) {
  @ApiProperty({
    description: '장비 상태',
    enum: EquipmentStatusEnum,
    example: 'available',
    required: false
  })
  @IsEnum(EquipmentStatusEnum)
  @IsOptional()
  status?: string;
} 