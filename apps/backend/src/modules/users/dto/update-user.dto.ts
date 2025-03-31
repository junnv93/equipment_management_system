import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// @ts-ignore - 타입 참조 문제 무시
export class UpdateUserDto extends PartialType(CreateUserDto) {} 