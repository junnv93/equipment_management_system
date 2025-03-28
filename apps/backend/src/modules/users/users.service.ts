import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../auth/interfaces/user-role.enum';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findAll(page = 1, limit = 10, teamId?: number) {
    const offset = (page - 1) * limit;
    const [users, total] = await this.usersRepository.findAll(
      offset,
      limit,
      teamId,
    );

    // 비밀번호 해시 제외
    const sanitizedUsers = users.map(({ passwordHash, ...user }) => user);

    return {
      users: sanitizedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async create(createUserDto: CreateUserDto) {
    // 이메일 중복 검사
    const existingUser = await this.usersRepository.findByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new BadRequestException('이미 사용 중인 이메일입니다.');
    }

    // 비밀번호 해시화
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);

    // 사용자 역할 기본값 설정
    const role = createUserDto.role || UserRole.USER;

    const createdUser = await this.usersRepository.create({
      ...createUserDto,
      passwordHash,
      role,
      isActive: true,
    });

    // 비밀번호 해시 제외하고 반환
    const { passwordHash: _, ...result } = createdUser;
    return result;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);

    // 비밀번호 변경 처리
    let passwordHash = user.passwordHash;
    if (updateUserDto.password) {
      const saltRounds = 10;
      passwordHash = await bcrypt.hash(updateUserDto.password, saltRounds);
    }

    const updatedUser = await this.usersRepository.update(id, {
      ...updateUserDto,
      passwordHash,
    });

    // 비밀번호 해시 제외하고 반환
    const { passwordHash: _, ...result } = updatedUser;
    return result;
  }

  async deactivate(id: number) {
    return this.usersRepository.update(id, { isActive: false });
  }

  async activate(id: number) {
    return this.usersRepository.update(id, { isActive: true });
  }
}
