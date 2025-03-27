import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateRentalDto } from './create-rental.dto';
import { RentalStatusEnum } from '../../../types';

export class UpdateRentalDto extends PartialType(
  OmitType(CreateRentalDto, ['equipmentId', 'userId', 'type'] as const),
) {
  @ApiProperty({
    description: '대여/반출 상태',
    enum: RentalStatusEnum,
    example: 'approved',
    required: false,
  })
  @IsEnum(RentalStatusEnum)
  @IsOptional()
  status?: keyof typeof RentalStatusEnum | string;
} 