import { Inject, Injectable, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, inArray } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import { Permission, ROLE_PERMISSIONS } from '@equipment-management/shared-constants';
import type { UserRole } from '@equipment-management/schemas';
import type { RecipientStrategy } from '../config/notification-registry';

/**
 * Permission 기반 수신자 해석기
 *
 * RecipientStrategy를 실제 userId[]로 해석한다.
 * ROLE_PERMISSIONS SSOT를 재활용하여 수신자를 결정.
 * Permission 체계가 변경되면 수신자 라우팅도 자동 반영.
 */
@Injectable()
export class NotificationRecipientResolver {
  private readonly logger = new Logger(NotificationRecipientResolver.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: NodePgDatabase<typeof schema>
  ) {}

  /**
   * 전략에 따라 수신자 userId 목록을 해석한다.
   *
   * @param strategy 수신자 전략
   * @param payload 이벤트 페이로드 (필드 참조용)
   * @param actorId 이벤트 발행자 (자기 자신은 제외)
   */
  async resolve(
    strategy: RecipientStrategy,
    payload: Record<string, unknown>,
    actorId: string
  ): Promise<string[]> {
    switch (strategy.type) {
      case 'permission':
        return this.resolveByPermission(strategy.permission, strategy.scope, payload, actorId);

      case 'actor': {
        const targetId = payload[strategy.field] as string | undefined;
        if (!targetId || targetId === actorId) return [];
        return [targetId];
      }

      case 'team': {
        const teamId = payload[strategy.field] as string | undefined;
        if (!teamId) return [];
        return this.resolveTeamMembers(teamId, actorId);
      }

      case 'composite': {
        const allResults = await Promise.all(
          strategy.strategies.map((s) => this.resolve(s, payload, actorId))
        );
        // 중복 제거 + 발행자 제외
        return [...new Set(allResults.flat())].filter((id) => id !== actorId);
      }
    }
  }

  /**
   * 특정 Permission을 가진 역할의 사용자들을 조회
   */
  private async resolveByPermission(
    permission: Permission,
    scope: 'team' | 'site' | 'all',
    payload: Record<string, unknown>,
    actorId: string
  ): Promise<string[]> {
    // 1. ROLE_PERMISSIONS에서 해당 permission을 가진 roles 추출
    const eligibleRoles = (Object.entries(ROLE_PERMISSIONS) as [UserRole, Permission[]][])
      .filter(([, perms]) => perms.includes(permission))
      .map(([role]) => role);

    if (eligibleRoles.length === 0) return [];

    // 2. scope에 따라 DB 조회
    const conditions = [inArray(schema.users.role, eligibleRoles), eq(schema.users.isActive, true)];

    if (scope === 'team') {
      const teamId = (payload.requesterTeamId as string) ?? (payload.teamId as string);
      if (!teamId) {
        this.logger.warn('Permission scope=team but no teamId in payload');
        return [];
      }
      conditions.push(eq(schema.users.teamId, teamId));
    } else if (scope === 'site') {
      const site = (payload.requesterSite as string) ?? (payload.site as string);
      if (!site) {
        this.logger.warn('Permission scope=site but no site in payload');
        return [];
      }
      conditions.push(eq(schema.users.site, site));
    }
    // scope === 'all' → 조건 추가 없음 (전체 활성 사용자)

    const rows = await this.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(and(...conditions));

    return rows.map((r) => r.id).filter((id) => id !== actorId);
  }

  /**
   * 특정 팀의 전체 활성 멤버를 조회
   */
  private async resolveTeamMembers(teamId: string, actorId: string): Promise<string[]> {
    const rows = await this.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(and(eq(schema.users.teamId, teamId), eq(schema.users.isActive, true)));

    return rows.map((r) => r.id).filter((id) => id !== actorId);
  }
}
