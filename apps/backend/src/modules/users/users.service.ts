import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto';
import { User, UserListResponse, UserRoleEnum } from '@equipment-management/schemas';
import { parseSortString, sortByField } from '../../common/utils/sort';

// 임시 데이터 저장소 (실제로는 DB를 사용)
// ✅ AuthService의 테스트 사용자 ID와 동기화 (UUID v4 형식)
const users: User[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // AuthService admin과 동일
    email: 'admin@example.com',
    name: '관리자',
    role: 'lab_manager',
    isActive: true,
    lastLogin: null,
    deletedAt: null,
    equipmentCount: 0,
    rentalsCount: 0,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
  {
    id: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789', // AuthService manager와 동일
    email: 'manager@example.com',
    name: 'RF팀 관리자',
    role: 'technical_manager',
    teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1',
    department: '연구개발부',
    position: '팀장',
    phoneNumber: '010-1234-5678',
    isActive: true,
    lastLogin: null,
    deletedAt: null,
    equipmentCount: 5,
    rentalsCount: 2,
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-02-15'),
  },
  {
    id: '12345678-1234-4567-8901-234567890abc', // AuthService user와 동일
    email: 'user@example.com',
    name: '시험실무자',
    role: 'test_engineer',
    teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1',
    department: '연구개발부',
    position: '연구원',
    phoneNumber: '010-2345-6789',
    isActive: true,
    lastLogin: null,
    deletedAt: null,
    equipmentCount: 3,
    rentalsCount: 1,
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-03-10'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'user1@example.com',
    name: '김사용',
    role: 'test_engineer',
    teamId: '7dc3b94c-82b8-488e-9ea5-4fe71bb086e1',
    department: '연구개발부',
    position: '연구원',
    phoneNumber: '010-3456-7890',
    isActive: true,
    lastLogin: null,
    deletedAt: null,
    equipmentCount: 2,
    rentalsCount: 0,
    createdAt: new Date('2023-01-04'),
    updatedAt: new Date('2023-02-20'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'inactive@example.com',
    name: '퇴사자',
    role: 'test_engineer',
    teamId: 'bb6c860d-9d7c-4e2d-b289-2b2e416ec289',
    department: '연구개발부',
    position: '연구원',
    isActive: false,
    lastLogin: null,
    deletedAt: null,
    equipmentCount: 0,
    rentalsCount: 0,
    createdAt: new Date('2023-01-05'),
    updatedAt: new Date('2023-04-15'),
  },
];

@Injectable()
export class UsersService {
  async findAll(query: UserQueryDto): Promise<UserListResponse> {
    let filteredUsers = [...users];

    // 이메일 필터링
    if (query.email) {
      const emailFilter = query.email.toLowerCase();
      filteredUsers = filteredUsers.filter((user) =>
        user.email.toLowerCase().includes(emailFilter)
      );
    }

    // 이름 필터링
    if (query.name) {
      const nameFilter = query.name.toLowerCase();
      filteredUsers = filteredUsers.filter((user) => user.name.toLowerCase().includes(nameFilter));
    }

    // 역할 필터링
    if (query.roles) {
      const roles = query.roles.split(',');
      filteredUsers = filteredUsers.filter((user) => roles.includes(user.role));
    }

    // 팀 필터링
    if (query.teams) {
      const teams = query.teams.split(',');
      filteredUsers = filteredUsers.filter((user) => user.teamId && teams.includes(user.teamId));
    }

    // 부서 필터링
    if (query.department) {
      const departmentFilter = query.department.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) => user.department && user.department.toLowerCase().includes(departmentFilter)
      );
    }

    // 활성 상태 필터링
    if (query.isActive !== undefined) {
      filteredUsers = filteredUsers.filter((user) => user.isActive === query.isActive);
    }

    // 검색어 필터링
    if (query.search) {
      const searchLowerCase = query.search.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchLowerCase) ||
          user.email.toLowerCase().includes(searchLowerCase) ||
          (user.position && user.position.toLowerCase().includes(searchLowerCase)) ||
          (user.department && user.department.toLowerCase().includes(searchLowerCase))
      );
    }

    // 정렬
    const sortConfig = parseSortString(query.sort);
    if (sortConfig) {
      filteredUsers = sortByField(filteredUsers, sortConfig.field, sortConfig.direction);
    } else {
      // 기본 정렬: 이름 오름차순
      filteredUsers = sortByField(filteredUsers, 'name', 'asc');
    }

    // 페이지네이션
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / pageSize);
    const skip = (page - 1) * pageSize;

    const items = filteredUsers.slice(skip, skip + pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async findOne(id: string): Promise<User | null> {
    const user = users.find((user) => user.id === id);
    return user || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
    return user || null;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 이메일 중복 확인
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException(`이메일 '${createUserDto.email}'는 이미 사용 중입니다.`);
    }

    const now = new Date();
    const user = {
      id: createUserDto.id || randomUUID(),
      ...createUserDto,
      equipmentCount: 0,
      rentalsCount: 0,
      createdAt: now,
      updatedAt: now,
    } as User;

    users.push(user);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    const userIndex = users.findIndex((user) => user.id === id);
    if (userIndex === -1) {
      return null;
    }

    const updatedUser = {
      ...users[userIndex],
      ...updateUserDto,
      updatedAt: new Date(),
    } as User;

    users[userIndex] = updatedUser;
    return updatedUser;
  }

  async remove(id: string): Promise<boolean> {
    const userIndex = users.findIndex((user) => user.id === id);
    if (userIndex === -1) {
      return false;
    }

    // 실제 시스템에서는 사용자가 소유한 장비나 대여 기록이 있는지 확인 필요
    // 여기서는 임시로 삭제만 수행
    users.splice(userIndex, 1);
    return true;
  }

  // 사용자 활성/비활성화
  async toggleActive(id: string, isActive: boolean): Promise<User | null> {
    const userIndex = users.findIndex((user) => user.id === id);
    if (userIndex === -1) {
      return null;
    }

    const updatedUser = {
      ...users[userIndex],
      isActive,
      updatedAt: new Date(),
    } as User;

    users[userIndex] = updatedUser;
    return updatedUser;
  }

  // 사용자 권한 조회
  async findUserPermissions(id: string) {
    const user = await this.findOne(id);
    if (!user) {
      return null;
    }

    // 실제 구현에서는 역할 기반으로 권한을 조회해야 함
    // 여기서는 임시로 모든 권한 객체를 반환
    const permissions = [
      'view:users',
      'create:users',
      'update:users',
      'delete:users',
      'view:equipment',
      'create:equipment',
      'update:equipment',
      'delete:equipment',
      'view:calibrations',
      'create:calibration',
      'update:calibration',
      'delete:calibration',
      'view:rentals',
      'create:rental',
      'update:rental',
      'delete:rental',
      'view:notifications',
      'create:notification',
      'update:notification',
      'delete:notification',
    ];

    // 해당 사용자의 권한 필터링 (실제로는 역할에 따라 권한 매핑)
    return {
      userId: id,
      username: user.name,
      role: user.role,
      permissions,
    };
  }

  // 임시 비밀번호 생성
  async generateTemporaryPassword(id: string) {
    const user = await this.findOne(id);
    if (!user) {
      return null;
    }

    // 임시 비밀번호 생성 (8자리)
    const tempPassword = Math.random().toString(36).substring(2, 10);

    // 실제로는 비밀번호 해싱 후 저장
    // await this.update(id, { password: hashedPassword });

    // TODO: 이메일로 임시 비밀번호 발송 로직 구현 필요
    // 프로덕션에서는 이메일 서비스를 통해 전송해야 함

    return {
      success: true,
      message: '임시 비밀번호가 생성되어 이메일로 발송되었습니다.',
      // 개발 환경에서만 반환 (프로덕션에서는 제거 필요)
      ...(process.env.NODE_ENV === 'development' && { tempPassword }),
    };
  }
}
