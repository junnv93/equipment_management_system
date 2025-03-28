import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EquipmentStatus } from '../enum/equipment-status.enum';

export class UpdateStatusDto {
  @ApiProperty({
    enum: EquipmentStatus,
    description: '장비 상태',
  })
  @IsNotEmpty({ message: '장비 상태는 필수 입력항목입니다.' })
  @IsEnum(EquipmentStatus, { message: '유효한 장비 상태가 아닙니다.' })
  status: EquipmentStatus;
}
