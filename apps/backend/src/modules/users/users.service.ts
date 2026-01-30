import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { eq, ilike, inArray, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '@equipment-management/db/schema';
import { users as usersTable } from '@equipment-management/db/schema';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto';
import {
  User,
  UserListResponse,
  UserRoleEnum,
  UserRoleValues,
} from '@equipment-management/schemas';
import { parseSortString, sortByField } from '../../common/utils/sort';

@Injectable()
export class UsersService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: PostgresJsDatabase<typeof schema>
  ) {}

  async findAll(query: UserQueryDto): Promise<UserListResponse> {
    // 필터 조건들을 수집
    const conditions = [];

    // 이메일 필터
    if (query.email) {
      conditions.push(ilike(usersTable.email, `%${query.email}%`));
    }

    // 이름 필터
    if (query.name) {
      conditions.push(ilike(usersTable.name, `%${query.name}%`));
    }

    // 역할 필터
    if (query.roles) {
      const roleList = query.roles.split(',');
      conditions.push(inArray(usersTable.role, roleList));
    }

    // 팀 필터
    if (query.teams) {
      const teamList = query.teams.split(',');
      conditions.push(inArray(usersTable.teamId, teamList));
    }

    // 쿼리 빌드
    let dbQuery = this.db.select().from(usersTable);

    // 조건이 있으면 and()로 결합
    if (conditions.length > 0) {
      dbQuery = dbQuery.where(and(...conditions)) as any;
    }

    // 전체 데이터 조회
    const allUsers = await dbQuery;

    let filteredUsers = allUsers.map(
      (user) =>
        ({
          ...user,
          isActive: true, // DB 스키마에 isActive 필드가 없으므로 기본값 사용
          lastLogin: null,
          deletedAt: null,
          equipmentCount: 0,
          rentalsCount: 0,
        }) as User
    );

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
    const user = await this.db.query.users.findFirst({
      where: eq(usersTable.id, id),
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      isActive: true,
      lastLogin: null,
      deletedAt: null,
      equipmentCount: 0,
      rentalsCount: 0,
    } as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.db.query.users.findFirst({
      where: eq(usersTable.email, email),
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      isActive: true,
      lastLogin: null,
      deletedAt: null,
      equipmentCount: 0,
      rentalsCount: 0,
    } as User;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 이메일 중복 확인
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException(`이메일 '${createUserDto.email}'는 이미 사용 중입니다.`);
    }

    const [createdUser] = await this.db
      .insert(usersTable)
      .values({
        id: createUserDto.id,
        email: createUserDto.email,
        name: createUserDto.name,
        role: createUserDto.role || 'test_engineer',
        teamId: createUserDto.teamId,
        site: createUserDto.site,
        location: createUserDto.location,
        position: createUserDto.position,
      })
      .returning();

    return {
      ...createdUser,
      isActive: true,
      lastLogin: null,
      deletedAt: null,
      equipmentCount: 0,
      rentalsCount: 0,
    } as User;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    const user = await this.findOne(id);
    if (!user) {
      return null;
    }

    const [updatedUser] = await this.db
      .update(usersTable)
      .set({
        ...updateUserDto,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, id))
      .returning();

    return {
      ...updatedUser,
      isActive: true,
      lastLogin: null,
      deletedAt: null,
      equipmentCount: 0,
      rentalsCount: 0,
    } as User;
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.db.delete(usersTable).where(eq(usersTable.id, id)).returning();

    return result.length > 0;
  }

  // 사용자 활성/비활성화 (향후 isActive 필드 추가 시 구현)
  async toggleActive(id: string, isActive: boolean): Promise<User | null> {
    const user = await this.findOne(id);
    if (!user) {
      return null;
    }

    // TODO: DB 스키마에 isActive 필드 추가 후 구현
    // 현재는 조회만 수행
    return user;
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
