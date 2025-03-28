import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { UserRole } from '../interfaces/user-role.enum';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '사용자 이메일',
  })
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  @IsNotEmpty({ message: '이메일은 필수 입력항목입니다.' })
  email: string;

  @ApiProperty({
    example: 'StrongP@ss123',
    description: '사용자 비밀번호 (최소 8자, 숫자/소문자/대문자/특수문자 포함)',
  })
  @IsNotEmpty({ message: '비밀번호는 필수 입력항목입니다.' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @Matches(
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"|,.<>?]).{8,}$/,
    {
      message:
        '비밀번호는 숫자, 소문자, 대문자, 특수문자를 각각 1개 이상 포함해야 합니다.',
    },
  )
  password: string;

  @ApiProperty({ example: '홍길동', description: '사용자 이름' })
  @IsNotEmpty({ message: '이름은 필수 입력항목입니다.' })
  @IsString({ message: '이름은 문자열이어야 합니다.' })
  name: string;

  @ApiProperty({
    enum: UserRole,
    description: '사용자 역할 (기본값: USER)',
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: '유효한 사용자 역할이 아닙니다.' })
  role?: UserRole;

  @ApiProperty({
    example: '연구개발팀',
    description: '소속 팀 이름',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '팀 이름은 문자열이어야 합니다.' })
  teamName?: string;
}
