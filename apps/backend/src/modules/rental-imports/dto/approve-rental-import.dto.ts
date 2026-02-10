import { ApiProperty } from '@nestjs/swagger';

export class ApproveRentalImportDto {
  @ApiProperty({ description: '승인 코멘트', required: false })
  comment?: string;
}
