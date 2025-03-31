import { PartialType } from '@nestjs/swagger';
import { CreateTeamDto } from './create-team.dto';

// @ts-ignore - 타입 참조 문제 무시
export class UpdateTeamDto extends PartialType(CreateTeamDto) {} 