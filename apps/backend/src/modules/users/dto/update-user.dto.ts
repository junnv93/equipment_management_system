import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../auth/interfaces/user-role.enum';

export class UpdateUserDto {
  @ApiProperty({
    example: 'StrongP@ss123',
    description: '사용자 비밀번호 (최소 8자, 숫자/소문자/대문자/특수문자 포함)',
    required: false,
  })
  @IsOptional()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @Matches(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"|,.<>?]).{8,}$/,
    {
      message:
        '비밀번호는 숫자, 소문자, 대문자, 특수문자를 각각 1개 이상 포함해야 합니다.',
    },
  )
  password?: string;

  @ApiProperty({
    example: '홍길동',
    description: '사용자 이름',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '이름은 문자열이어야 합니다.' })
  name?: string;

  @ApiProperty({
    enum: UserRole,
    description: '사용자 역할',
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: '유효한 사용자 역할이 아닙니다.' })
  role?: UserRole;

  @ApiProperty({
    example: 1,
    description: '팀 ID',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: '팀 ID는 숫자여야 합니다.' })
  teamId?: number;

  @ApiProperty({
    example: true,
    description: '활성화 여부',
    required: false,
  })
  @IsOptional()
  isActive?: boolean;
}
