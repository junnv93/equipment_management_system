import { Injectable } from '@nestjs/common';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { DrizzleService } from '../../database/drizzle.service';
import { users } from '../../database/schema/users';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../auth/interfaces/user-role.enum';

@Injectable()
export class UsersRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findAll(offset = 0, limit = 10, teamId?: number) {
    const db = this.drizzle.getDb();
    
    // 총 사용자 수 카운트 쿼리
    const whereClauses = [];
    if (teamId) {
      whereClauses.push(eq(users.teamId, teamId));
    }

    const totalCountQuery = whereClauses.length
      ? db.select({ count: sql`count(*)` }).from(users).where(and(...whereClauses))
      : db.select({ count: sql`count(*)` }).from(users);

    // 사용자 가져오기 쿼리
    const usersQuery = whereClauses.length
      ? db
          .select()
          .from(users)
          .where(and(...whereClauses))
          .limit(limit)
          .offset(offset)
          .orderBy(desc(users.createdAt))
      : db
          .select()
          .from(users)
          .limit(limit)
          .offset(offset)
          .orderBy(desc(users.createdAt));

    // 두 쿼리 동시 실행
    const [usersResult, totalCountResult] = await Promise.all([
      usersQuery,
      totalCountQuery,
    ]);

    return [usersResult, Number(totalCountResult[0].count) || 0];
  }

  async findById(id: number) {
    const db = this.drizzle.getDb();
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result[0];
  }

  async findByEmail(email: string) {
    const db = this.drizzle.getDb();
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result[0];
  }

  async create(data: CreateUserDto & {
    passwordHash: string;
    role: UserRole;
    isActive: boolean;
  }) {
    const db = this.drizzle.getDb();
    const result = await db
      .insert(users)
      .values({
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        role: data.role,
        teamId: data.teamId,
        isActive: data.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  async update(id: number, data: Partial<UpdateUserDto> & { passwordHash?: string }) {
    const db = this.drizzle.getDb();
    const updateData: any = { updatedAt: new Date() };
    
    // 널이 아닌 필드만 업데이트
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.teamId !== undefined) updateData.teamId = data.teamId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.passwordHash !== undefined) updateData.passwordHash = data.passwordHash;

    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return result[0];
  }

  async delete(id: number) {
    const db = this.drizzle.getDb();
    const result = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    return result[0];
  }
}
