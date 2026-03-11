import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { and, eq, inArray } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import { Permission, ROLE_PERMISSIONS } from '@equipment-management/shared-constants';
import type { UserRole } from '@equipment-management/schemas';
import type { NotificationScope, RecipientStrategy } from '../config/notification-registry';

/**
 * Permission 기반 수신자 해석기
 *
 * RecipientStrategy를 실제 userId[]로 해석한다.
 * ROLE_PERMISSIONS SSOT를 재활용하여 수신자를 결정.
 * Permission 체계가 변경되면 수신자 라우팅도 자동 반영.
 *
 * roleScopes 지원:
 *   동일 Permission을 보유한 역할들이 서로 다른 수신 범위를 가질 때 사용.
 *   예) APPROVE_CHECKOUT: technical_manager → team, lab_manager → site, system_admin → all
 */
@Injectable()
export class NotificationRecipientResolver {
  private readonly logger = new Logger(NotificationRecipientResolver.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
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
        return this.resolveByPermission(
          strategy.permission,
          strategy.scope,
          strategy.roleScopes,
          payload,
          actorId
        );

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
   *
   * roleScopes가 있으면 역할별로 다른 수신 범위를 적용한다.
   * 동일 Permission 보유 역할을 scope별로 그룹화 → 각 그룹마다 DB 조회 → 합산.
   */
  private async resolveByPermission(
    permission: Permission,
    defaultScope: NotificationScope,
    roleScopes: Partial<Record<UserRole, NotificationScope | 'skip'>> | undefined,
    payload: Record<string, unknown>,
    actorId: string
  ): Promise<string[]> {
    // 1. ROLE_PERMISSIONS에서 해당 permission을 가진 roles 추출
    const eligibleRoles = (Object.entries(ROLE_PERMISSIONS) as [UserRole, Permission[]][])
      .filter(([, perms]) => perms.includes(permission))
      .map(([role]) => role);

    if (eligibleRoles.length === 0) return [];

    // 2. 역할별 유효 scope 결정 후 scope → roles[] 맵으로 그룹화
    //    roleScopes가 없으면 모든 역할에 defaultScope 적용 (기존 동작 유지)
    const scopeToRoles = new Map<NotificationScope, UserRole[]>();

    for (const role of eligibleRoles) {
      const effectiveScope = roleScopes?.[role] ?? defaultScope;
      if (effectiveScope === 'skip') continue;

      const existing = scopeToRoles.get(effectiveScope) ?? [];
      scopeToRoles.set(effectiveScope, [...existing, role]);
    }

    // 3. 각 scope 그룹별로 DB 조회 후 합산
    const allIds: string[] = [];
    for (const [scope, roles] of scopeToRoles) {
      const ids = await this.queryByRolesAndScope(roles, scope, payload);
      allIds.push(...ids);
    }

    // 4. 중복 제거 + 발행자 제외
    return [...new Set(allIds)].filter((id) => id !== actorId);
  }

  /**
   * 지정된 역할 목록을 scope에 맞는 WHERE 조건으로 DB 조회
   *
   * @param roles 조회 대상 역할 목록
   * @param scope 수신 범위 ('team' | 'site' | 'all')
   * @param payload scope 해석에 필요한 컨텍스트 (teamId, site 등)
   */
  private async queryByRolesAndScope(
    roles: UserRole[],
    scope: NotificationScope,
    payload: Record<string, unknown>
  ): Promise<string[]> {
    const conditions = [inArray(schema.users.role, roles), eq(schema.users.isActive, true)];

    if (scope === 'team') {
      const teamId = (payload.requesterTeamId as string) ?? (payload.teamId as string);
      if (!teamId) {
        this.logger.warn(
          `Permission scope=team but no teamId in payload (roles: ${roles.join(', ')})`
        );
        return [];
      }
      conditions.push(eq(schema.users.teamId, teamId));
    } else if (scope === 'site') {
      const site = (payload.requesterSite as string) ?? (payload.site as string);
      if (!site) {
        this.logger.warn(
          `Permission scope=site but no site in payload (roles: ${roles.join(', ')})`
        );
        return [];
      }
      conditions.push(eq(schema.users.site, site));
    }
    // scope === 'all' → 조건 추가 없음 (전체 활성 사용자)

    const rows = await this.db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(and(...conditions));

    return rows.map((r) => r.id);
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
