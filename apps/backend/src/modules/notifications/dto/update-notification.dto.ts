import { PartialType, OmitType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateNotificationDto } from './create-notification.dto';

export class UpdateNotificationDto extends PartialType(
  OmitType(CreateNotificationDto, ['recipientId', 'type'] as const)
) {
  @ApiProperty({
    description: '읽음 상태',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;
}
