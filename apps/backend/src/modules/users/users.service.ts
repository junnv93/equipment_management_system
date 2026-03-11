import {
  Injectable,
  BadRequestException,
  Inject,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { eq, ilike, inArray, and, sql } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import * as schema from '@equipment-management/db/schema';
import {
  users as usersTable,
  userPreferences as userPreferencesTable,
} from '@equipment-management/db/schema';
import { CreateUserDto, UpdateUserDto, UserQueryDto, ChangeRoleInput } from './dto';
import { User, UserListResponse, type UserRole } from '@equipment-management/schemas';
import { getPermissions, Permission } from '@equipment-management/shared-constants';
import { parseSortString, sortByField } from '../../common/utils/sort';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  teamId?: string;
  site?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
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

    // 검색 필터 (이름, 이메일, 직함, 부서)
    if (query.search) {
      const searchPattern = `%${query.search}%`;
      conditions.push(
        sql`(
          ${ilike(usersTable.name, searchPattern)} OR
          ${ilike(usersTable.email, searchPattern)} OR
          ${ilike(usersTable.position, searchPattern)} OR
          ${ilike(usersTable.department, searchPattern)}
        )`
      );
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

    // 사이트 필터
    if (query.site) {
      conditions.push(eq(usersTable.site, query.site));
    }

    // 쿼리 빌드
    let dbQuery = this.db.select().from(usersTable);

    // 조건이 있으면 and()로 결합
    if (conditions.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dbQuery = dbQuery.where(and(...conditions)) as any;
    }

    // 전체 데이터 조회
    const allUsers = await dbQuery;

    let filteredUsers = allUsers.map((user) => this.toUser(user));

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

    return this.toUser(user);
  }

  async findOneWithTeam(id: string): Promise<(User & { teamName?: string }) | null> {
    const user = await this.db.query.users.findFirst({
      where: eq(usersTable.id, id),
      with: {
        team: true,
      },
    });

    if (!user) {
      return null;
    }

    const baseUser = this.toUser(user);
    return {
      ...baseUser,
      teamName: (user as Record<string, unknown>).team
        ? ((user as Record<string, unknown>).team as { name: string }).name
        : undefined,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.db.query.users.findFirst({
      where: eq(usersTable.email, email),
    });

    if (!user) {
      return null;
    }

    return this.toUser(user);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 이메일 중복 확인
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException({
        code: 'USER_EMAIL_ALREADY_EXISTS',
        message: `Email '${createUserDto.email}' is already in use.`,
      });
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
        department: createUserDto.department,
        phoneNumber: createUserDto.phoneNumber,
        isActive: createUserDto.isActive ?? true,
      })
      .returning();

    return this.toUser(createdUser);
  }

  /**
   * 사용자 Upsert (생성 또는 업데이트)
   *
   * NextAuth 로그인 시 호출. 필드 소유권 전략:
   * - Azure AD 소유: name, teamId, site, location, position, department, phoneNumber, employeeId, managerName
   * - 앱 소유: role (최초 등록 시에만 Azure AD에서 설정), isActive (앱 관리자만 변경)
   */
  async upsert(createUserDto: CreateUserDto): Promise<User> {
    // 기존 사용자 확인 (이메일 기준)
    const existingUser = await this.findByEmail(createUserDto.email);

    if (existingUser) {
      // === 기존 사용자 업데이트 ===
      // Azure AD 소유 필드만 동기화 (role은 앱 소유이므로 업데이트 제외)
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      // Azure AD 소유 필드: 매 로그인 시 동기화
      if (createUserDto.name) updateData.name = createUserDto.name;
      if (createUserDto.teamId) updateData.teamId = createUserDto.teamId;
      if (createUserDto.site) updateData.site = createUserDto.site;
      if (createUserDto.location) updateData.location = createUserDto.location;
      if (createUserDto.position) updateData.position = createUserDto.position;
      if (createUserDto.department) updateData.department = createUserDto.department;
      if (createUserDto.phoneNumber) updateData.phoneNumber = createUserDto.phoneNumber;

      // 앱 소유 필드: Azure AD로 덮어쓰지 않음
      // role: changeRole API로만 변경
      // isActive: 앱 관리자만 변경

      const [updatedUser] = await this.db
        .update(usersTable)
        .set(updateData)
        .where(eq(usersTable.email, createUserDto.email))
        .returning();

      return this.toUser(updatedUser);
    } else {
      // === 신규 사용자 생성 ===
      // 최초 등록 시에만 Azure AD 역할 사용
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
          department: createUserDto.department,
          phoneNumber: createUserDto.phoneNumber,
          isActive: true,
        })
        .returning();

      return this.toUser(createdUser);
    }
  }

  /**
   * 역할 변경 (Conditional WHERE 기반 경량 CAS)
   *
   * 방어 계층:
   * 1. @RequirePermissions Guard → JWT 기반 fast-path 차단
   * 2. 서비스 DB 검증 → stale JWT 방어 (요청자 역할 재조회)
   * 3. Conditional WHERE CAS → 동시 수정 방어
   * 4. @AuditLog → 모든 시도 기록
   */
  async changeRole(targetUserId: string, dto: ChangeRoleInput, jwtUser: JwtPayload): Promise<User> {
    // ❶ DB에서 요청자의 현재 역할 재조회 (stale JWT 방어 — Guard는 fast-path일 뿐)
    const requester = await this.findOne(jwtUser.userId);
    if (!requester) {
      throw new NotFoundException({
        code: 'USER_REQUESTER_NOT_FOUND',
        message: 'Requester not found.',
      });
    }
    if (!['technical_manager', 'lab_manager'].includes(requester.role)) {
      throw new ForbiddenException({
        code: 'USER_NO_ROLE_CHANGE_PERMISSION',
        message: 'No permission to change roles.',
      });
    }

    // ❷ 자기 변경 차단
    if (jwtUser.userId === targetUserId) {
      throw new ForbiddenException({
        code: 'USER_CANNOT_CHANGE_OWN_ROLE',
        message: 'Cannot change your own role.',
      });
    }

    // ❸ 대상 사용자 조회
    const target = await this.findOne(targetUserId);
    if (!target) {
      throw new NotFoundException({
        code: 'USER_TARGET_NOT_FOUND',
        message: 'Target user not found.',
      });
    }

    // ❹ 대상 역할 범위 검증 (QM/LM은 변경 불가)
    if (!['test_engineer', 'technical_manager'].includes(target.role)) {
      throw new ForbiddenException({
        code: 'USER_CANNOT_CHANGE_SENIOR_ROLE',
        message: 'Cannot change the role of quality manager or lab manager.',
      });
    }

    // ❺ 범위 제한 (requester의 DB 역할 기준)
    if (requester.role === 'technical_manager') {
      if (target.teamId !== requester.teamId) {
        throw new ForbiddenException({
          code: 'USER_TEAM_SCOPE_ONLY',
          message: 'Can only change roles of your own team members.',
        });
      }
    } else if (requester.role === 'lab_manager') {
      if (target.site !== requester.site) {
        throw new ForbiddenException({
          code: 'USER_SITE_SCOPE_ONLY',
          message: 'Can only change roles of members in the same site.',
        });
      }
    }

    // ❻ Conditional WHERE 기반 경량 CAS
    const result = await this.db
      .update(usersTable)
      .set({ role: dto.newRole, updatedAt: new Date() })
      .where(
        and(
          eq(usersTable.id, targetUserId),
          eq(usersTable.role, dto.currentRole) // CAS 키: 클라이언트가 본 역할과 불일치 시 실패
        )
      )
      .returning();

    if (result.length === 0) {
      throw new ConflictException({
        message: 'Another administrator has already changed this role. Please refresh the page.',
        code: 'VERSION_CONFLICT',
      });
    }

    return this.toUser(result[0]);
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

    return this.toUser(updatedUser);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.db.delete(usersTable).where(eq(usersTable.id, id)).returning();

    return result.length > 0;
  }

  // 사용자 활성/비활성화
  async toggleActive(id: string, isActive: boolean): Promise<User | null> {
    const user = await this.findOne(id);
    if (!user) {
      return null;
    }

    const [updatedUser] = await this.db
      .update(usersTable)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning();

    return this.toUser(updatedUser);
  }

  // 사용자 권한 조회
  async findUserPermissions(id: string): Promise<{
    userId: string;
    username: string;
    role: UserRole;
    permissions: Permission[];
  } | null> {
    const user = await this.findOne(id);
    if (!user) {
      return null;
    }

    return {
      userId: id,
      username: user.name,
      role: user.role,
      permissions: getPermissions(user.role),
    };
  }

  async getPreferences(userId: string): Promise<Record<string, unknown>> {
    const row = await this.db.query.userPreferences?.findFirst({
      where: eq(userPreferencesTable.userId, userId),
    });
    return (row?.preferences as Record<string, unknown>) || {};
  }

  async updatePreferences(
    userId: string,
    prefs: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const existing = await this.db.query.userPreferences?.findFirst({
      where: eq(userPreferencesTable.userId, userId),
    });

    if (existing) {
      const merged = { ...(existing.preferences as Record<string, unknown>), ...prefs };
      await this.db
        .update(userPreferencesTable)
        .set({ preferences: merged, updatedAt: new Date() })
        .where(eq(userPreferencesTable.userId, userId));
      return merged;
    }

    const [created] = await this.db
      .insert(userPreferencesTable)
      .values({ userId, preferences: prefs })
      .returning();
    return (created.preferences as Record<string, unknown>) || {};
  }

  /**
   * DB row → User 타입 변환 헬퍼
   * isActive를 DB 컬럼에서 읽어옴 (기존 하드코딩 제거)
   */
  private toUser(dbUser: typeof usersTable.$inferSelect): User {
    return {
      ...dbUser,
      isActive: dbUser.isActive ?? true,
      lastLogin: null,
      deletedAt: null,
      equipmentCount: 0,
      rentalsCount: 0,
    } as User;
  }
}
