import { IsString, IsEnum, IsOptional, Length, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TeamEnum, TeamId } from '@equipment-management/schemas';

export class CreateTeamDto {
  @IsEnum(TeamEnum.enum)
  @ApiProperty({ 
    description: '팀 ID',
    enum: TeamEnum.enum,
    example: 'rf'
  })
  id: TeamId;

  @IsString()
  @Length(1, 100)
  @ApiProperty({ 
    description: '팀 이름',
    example: 'RF 테스트팀'
  })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @ApiProperty({ 
    description: '팀 설명',
    required: false,
    example: 'RF 관련 장비 관리 및 테스트를 담당하는 팀입니다.'
  })
  description?: string;

  @IsUUID()
  @IsOptional()
  @ApiProperty({ 
    description: '팀장 ID',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  leaderId?: string;
} 