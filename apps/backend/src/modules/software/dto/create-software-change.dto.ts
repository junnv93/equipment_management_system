import { IsString, IsOptional, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSoftwareChangeDto {
  @ApiProperty({
    description: '장비 UUID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID('4')
  @IsNotEmpty()
  equipmentId: string;

  @ApiProperty({
    description: '소프트웨어명 (EMC32, UL EMC, DASY6 SAR 등)',
    example: 'EMC32',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  softwareName: string;

  @ApiProperty({
    description: '이전 버전 (최초 등록 시 생략 가능)',
    example: '10.2.0',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  previousVersion?: string;

  @ApiProperty({
    description: '새 버전',
    example: '10.3.0',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  newVersion: string;

  @ApiProperty({
    description: '검증 기록 (변경 후 검증 내용) - 필수',
    example: '변경 후 테스트 완료. 기존 측정 결과와 비교하여 0.1dB 이내 차이 확인.',
  })
  @IsString()
  @IsNotEmpty({ message: '검증 기록은 필수입니다.' })
  verificationRecord: string;

  @ApiProperty({
    description: '변경자 UUID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsUUID('4')
  @IsNotEmpty()
  changedBy: string;
}
