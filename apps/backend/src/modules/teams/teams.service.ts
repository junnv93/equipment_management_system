import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { eq, ilike, inArray, and, sql, SQL } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import * as schema from '@equipment-management/db/schema';
import {
  teams as teamsTable,
  users as usersTable,
  equipment as equipmentTable,
} from '@equipment-management/db/schema';
import { CreateTeamDto, UpdateTeamDto, TeamQueryDto } from './dto';
import { Team, TeamListResponse } from '@equipment-management/schemas';

@Injectable()
export class TeamsService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  async findAll(query: TeamQueryDto): Promise<TeamListResponse> {
    // 필터 조건 수집
    const conditions: SQL[] = [];

    if (query.site) {
      conditions.push(eq(teamsTable.site, query.site));
    }

    if (query.classification) {
      conditions.push(eq(teamsTable.classification, query.classification));
    }

    if (query.ids) {
      const teamIds = query.ids.split(',');
      conditions.push(inArray(teamsTable.id, teamIds));
    }

    if (query.search) {
      const searchPattern = `%${query.search}%`;
      conditions.push(
        sql`(${ilike(teamsTable.name, searchPattern)} OR ${ilike(teamsTable.description, searchPattern)})`
      );
    }

    // JOIN + GROUP BY 패턴 (DashboardService와 동일)
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select({
        id: teamsTable.id,
        name: teamsTable.name,
        classification: teamsTable.classification,
        site: teamsTable.site,
        classificationCode: teamsTable.classificationCode,
        description: teamsTable.description,
        leaderId: teamsTable.leaderId,
        createdAt: teamsTable.createdAt,
        updatedAt: teamsTable.updatedAt,
        // COUNT(DISTINCT ...) to avoid double-counting with multiple JOINs
        memberCount: sql<number>`COALESCE(COUNT(DISTINCT CASE WHEN ${usersTable.isActive} = true THEN ${usersTable.id} END), 0)::int`,
        equipmentCount: sql<number>`COALESCE(COUNT(DISTINCT ${equipmentTable.id}), 0)::int`,
        // MAX() for leaderName since we're grouping - all rows will have same value
        leaderName: sql<
          string | null
        >`MAX(CASE WHEN ${usersTable.id} = ${teamsTable.leaderId} THEN ${usersTable.name} END)`,
      })
      .from(teamsTable)
      .leftJoin(usersTable, eq(usersTable.teamId, teamsTable.id))
      .leftJoin(equipmentTable, eq(equipmentTable.teamId, teamsTable.id))
      .where(whereClause)
      .groupBy(
        teamsTable.id,
        teamsTable.name,
        teamsTable.classification,
        teamsTable.site,
        teamsTable.classificationCode,
        teamsTable.description,
        teamsTable.leaderId,
        teamsTable.createdAt,
        teamsTable.updatedAt
      )
      .orderBy(teamsTable.name);

    // 결과를 Team 타입으로 변환
    let items: Team[] = rows.map((row) => this.toTeam(row));

    // 페이지네이션
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize);
    const skip = (page - 1) * pageSize;

    items = items.slice(skip, skip + pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  async findOne(id: string): Promise<Team | null> {
    const rows = await this.db
      .select({
        id: teamsTable.id,
        name: teamsTable.name,
        classification: teamsTable.classification,
        site: teamsTable.site,
        classificationCode: teamsTable.classificationCode,
        description: teamsTable.description,
        leaderId: teamsTable.leaderId,
        createdAt: teamsTable.createdAt,
        updatedAt: teamsTable.updatedAt,
        // Same JOIN + GROUP BY pattern as findAll
        memberCount: sql<number>`COALESCE(COUNT(DISTINCT CASE WHEN ${usersTable.isActive} = true THEN ${usersTable.id} END), 0)::int`,
        equipmentCount: sql<number>`COALESCE(COUNT(DISTINCT ${equipmentTable.id}), 0)::int`,
        leaderName: sql<
          string | null
        >`MAX(CASE WHEN ${usersTable.id} = ${teamsTable.leaderId} THEN ${usersTable.name} END)`,
      })
      .from(teamsTable)
      .leftJoin(usersTable, eq(usersTable.teamId, teamsTable.id))
      .leftJoin(equipmentTable, eq(equipmentTable.teamId, teamsTable.id))
      .where(eq(teamsTable.id, id))
      .groupBy(
        teamsTable.id,
        teamsTable.name,
        teamsTable.classification,
        teamsTable.site,
        teamsTable.classificationCode,
        teamsTable.description,
        teamsTable.leaderId,
        teamsTable.createdAt,
        teamsTable.updatedAt
      );

    if (rows.length === 0) return null;

    return this.toTeam(rows[0]);
  }

  async create(createTeamDto: CreateTeamDto): Promise<Team> {
    // 같은 사이트 내 이름 중복 확인
    const existingTeam = await this.db.query.teams.findFirst({
      where: and(eq(teamsTable.name, createTeamDto.name), eq(teamsTable.site, createTeamDto.site)),
    });

    if (existingTeam) {
      throw new BadRequestException({
        code: 'TEAM_NAME_ALREADY_EXISTS',
        message: `Team name '${createTeamDto.name}' is already in use at this site.`,
      });
    }

    const [createdTeam] = await this.db
      .insert(teamsTable)
      .values({
        name: createTeamDto.name,
        classification: createTeamDto.classification,
        site: createTeamDto.site,
        classificationCode: createTeamDto.classificationCode,
        description: createTeamDto.description,
        leaderId: createTeamDto.leaderId,
      })
      .returning();

    // Use findOne to get complete team with leaderName
    const result = await this.findOne(createdTeam.id);
    return result!;
  }

  async update(id: string, updateTeamDto: UpdateTeamDto): Promise<Team | null> {
    const existing = await this.db.query.teams.findFirst({
      where: eq(teamsTable.id, id),
    });

    if (!existing) return null;

    const [updatedTeam] = await this.db
      .update(teamsTable)
      .set({
        ...updateTeamDto,
        updatedAt: new Date(),
      })
      .where(eq(teamsTable.id, id))
      .returning();

    // memberCount/equipmentCount 조회
    return this.findOne(updatedTeam.id);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.db.delete(teamsTable).where(eq(teamsTable.id, id)).returning();

    return result.length > 0;
  }

  /**
   * DB row → Team 타입 변환 헬퍼
   * nullable 필드(classificationCode, description)를 undefined로 변환
   */
  private toTeam(row: {
    id: string;
    name: string;
    classification: string;
    site: string;
    classificationCode: string | null;
    description: string | null;
    leaderId: string | null;
    memberCount: number;
    equipmentCount: number;
    leaderName: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Team {
    return {
      id: row.id,
      name: row.name,
      classification: row.classification,
      site: row.site,
      classificationCode: row.classificationCode ?? undefined,
      description: row.description ?? undefined,
      leaderId: row.leaderId ?? undefined,
      leaderName: row.leaderName ?? undefined,
      memberCount: row.memberCount,
      equipmentCount: row.equipmentCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: null,
    } as Team;
  }
}
