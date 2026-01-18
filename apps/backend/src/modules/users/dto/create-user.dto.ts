import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  Length,
  MaxLength,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRoleEnum, TeamEnum } from '@equipment-management/schemas';

export class CreateUserDto {
  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description: '사용자 ID (UUID)',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id?: string;

  @IsEmail()
  @ApiProperty({
    description: '이메일 주소',
    example: 'user@example.com',
  })
  email: string;

  @IsString()
  @Length(1, 100)
  @ApiProperty({
    description: '사용자 이름',
    example: '홍길동',
  })
  name: string;

  @IsEnum(UserRoleEnum)
  @ApiProperty({
    description: '사용자 역할',
    enum: ['test_operator', 'technical_manager', 'site_admin'],
    example: 'test_operator',
  })
  role: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @ApiProperty({
    description: '사이트 정보',
    required: false,
    enum: ['suwon', 'uiwang'],
    example: 'suwon',
  })
  site?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiProperty({
    description: '위치 정보',
    required: false,
    enum: ['수원랩', '의왕랩'],
    example: '수원랩',
  })
  location?: string;

  @IsOptional()
  @IsEnum(TeamEnum)
  @ApiProperty({
    description: '소속 팀 ID',
    required: false,
    enum: ['rf', 'sar', 'emc', 'auto'],
    example: 'rf',
  })
  teamId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({
    description: '부서명',
    required: false,
    example: '개발팀',
  })
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({
    description: '직위/직책',
    required: false,
    example: '선임연구원',
  })
  position?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @ApiProperty({
    description: '전화번호',
    required: false,
    example: '010-1234-5678',
  })
  phoneNumber?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: '활성 상태',
    required: false,
    default: true,
    example: true,
  })
  isActive?: boolean;
}
