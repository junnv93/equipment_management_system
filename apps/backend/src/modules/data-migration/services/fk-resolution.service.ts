import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, inArray } from 'drizzle-orm';
import { safeIlike, likeContains } from '../../../common/utils/like-escape';
import { users } from '@equipment-management/db/schema/users';
import { teams } from '@equipment-management/db/schema/teams';
import type { AppDatabase } from '@equipment-management/db';
import { BATCH_QUERY_LIMITS } from '@equipment-management/shared-constants';
import { chunkArray } from '../../../common/utils';

/** FK 해석 결과 (행 단위) */
export interface FkResolutionResult {
  /** 담당자 UUID (해석 성공 시) */
  managerId?: string;
  /** 부담당자 UUID (해석 성공 시) */
  deputyManagerId?: string;
  /** 팀 UUID (site + classification 기반 자동 해석) */
  teamId?: string;
  /** 해석 경고 메시지 (다중 매칭 등) */
  warnings: string[];
}

/** 반출입 이력 FK 해석 결과 (행 단위) */
export interface CheckoutFkResult {
  /** 신청자 UUID (필수 — 미해석 시 errors에 기록) */
  requesterId?: string;
  /** 승인자 UUID (선택 — 미해석 시 warnings에 기록) */
  approverId?: string;
  /** 반입처리자 UUID (선택 — 미해석 시 warnings에 기록) */
  returnerId?: string;
  /** 해석 오류 (requester 미해석 — 행을 ERROR 처리해야 함) */
  errors: string[];
  /** 해석 경고 (approver/returner 미해석 등) */
  warnings: string[];
}

/** 배치 FK 해석 요약 */
export interface FkResolutionSummary {
  /** 해석된 담당자 수 */
  resolvedManagers: number;
  /** 미해석 담당자 수 */
  unresolvedManagers: number;
  /** 해석된 부담당자 수 */
  resolvedDeputyManagers: number;
  /** 미해석 부담당자 수 */
  unresolvedDeputyManagers: number;
  /** 해석된 팀 수 */
  resolvedTeams: number;
  /** 미해석 팀 수 */
  unresolvedTeams: number;
}

/**
 * FK 자동 해석 서비스
 *
 * 엑셀의 담당자명/이메일 → DB users 테이블 조회 → UUID 반환.
 * 팀은 장비의 site + classification에서 자동 결정.
 *
 * 아키텍처 결정:
 * - Azure AD가 users 테이블을 자동 프로비저닝 (auth.service.ts upsert)
 * - 별도 매핑 시트 불필요 — DB 조회로 해석
 * - 미매칭 시 warning (error 아님 — managerId/deputyManagerId는 nullable FK)
 */
@Injectable()
export class FkResolutionService {
  private readonly logger = new Logger(FkResolutionService.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  /**
   * 배치 FK 해석: 행 데이터에서 담당자/부담당자/팀 UUID를 해석하여 주입
   *
   * @param rows - Preview 통과한 행 데이터 배열 (data 필드에 managerEmail/managerName 등 포함)
   * @param fieldNames - 커스텀 필드명 (시험용 SW 등 manager/deputy 필드명이 다른 경우)
   * @returns 행 인덱스 → FkResolutionResult 맵 + 요약
   */
  async resolveBatch(
    rows: Array<{ data: Record<string, unknown> }>,
    fieldNames?: {
      managerEmail?: string;
      managerName?: string;
      deputyEmail?: string;
      deputyName?: string;
    }
  ): Promise<{ results: Map<number, FkResolutionResult>; summary: FkResolutionSummary }> {
    const summary: FkResolutionSummary = {
      resolvedManagers: 0,
      unresolvedManagers: 0,
      resolvedDeputyManagers: 0,
      unresolvedDeputyManagers: 0,
      resolvedTeams: 0,
      unresolvedTeams: 0,
    };
    const results = new Map<number, FkResolutionResult>();

    // 필드명 기본값 (장비: managerEmail/managerName/deputyManagerEmail/deputyManagerName)
    const mgrEmailField = fieldNames?.managerEmail ?? 'managerEmail';
    const mgrNameField = fieldNames?.managerName ?? 'managerName';
    const depEmailField = fieldNames?.deputyEmail ?? 'deputyManagerEmail';
    const depNameField = fieldNames?.deputyName ?? 'deputyManagerName';

    // 1. 고유 이메일/이름 수집 (배치 조회 최적화)
    const emails = new Set<string>();
    const names = new Set<string>();
    const siteClassPairs = new Set<string>();

    for (const row of rows) {
      const d = row.data;
      if (d[mgrEmailField]) emails.add(String(d[mgrEmailField]).trim().toLowerCase());
      if (d[depEmailField]) emails.add(String(d[depEmailField]).trim().toLowerCase());
      if (d[mgrNameField]) names.add(String(d[mgrNameField]).trim());
      if (d[depNameField]) names.add(String(d[depNameField]).trim());
      const site = d.site as string | undefined;
      const classification = d.classificationCode as string | undefined;
      if (site && classification) siteClassPairs.add(`${site}:${classification}`);
    }

    // 2. 배치 DB 조회
    const emailToUser = await this.resolveUsersByEmail([...emails]);
    const nameToUsers = await this.resolveUsersByName([...names]);
    const siteClassToTeam = await this.resolveTeams([...siteClassPairs]);

    // 3. 행별 해석
    for (let i = 0; i < rows.length; i++) {
      const d = rows[i].data;
      const result: FkResolutionResult = { warnings: [] };

      // 담당자 해석: 이메일 우선, 이름 폴백
      const mgrEmail = d[mgrEmailField] ? String(d[mgrEmailField]).trim().toLowerCase() : undefined;
      const mgrName = d[mgrNameField] ? String(d[mgrNameField]).trim() : undefined;
      if (mgrEmail || mgrName) {
        const resolved = this.resolveUser(mgrEmail, mgrName, emailToUser, nameToUsers, '담당자');
        result.managerId = resolved.userId;
        result.warnings.push(...resolved.warnings);
        if (resolved.userId) summary.resolvedManagers++;
        else summary.unresolvedManagers++;
      }

      // 부담당자 해석
      const depEmail = d[depEmailField] ? String(d[depEmailField]).trim().toLowerCase() : undefined;
      const depName = d[depNameField] ? String(d[depNameField]).trim() : undefined;
      if (depEmail || depName) {
        const resolved = this.resolveUser(depEmail, depName, emailToUser, nameToUsers, '부담당자');
        result.deputyManagerId = resolved.userId;
        result.warnings.push(...resolved.warnings);
        if (resolved.userId) summary.resolvedDeputyManagers++;
        else summary.unresolvedDeputyManagers++;
      }

      // 팀 해석: site + classificationCode
      const site = d.site as string | undefined;
      const classification = d.classificationCode as string | undefined;
      if (site && classification) {
        const key = `${site}:${classification}`;
        const teamId = siteClassToTeam.get(key);
        if (teamId) {
          result.teamId = teamId;
          summary.resolvedTeams++;
        } else {
          result.warnings.push(`팀 자동 매칭 실패: site=${site}, classification=${classification}`);
          summary.unresolvedTeams++;
        }
      }

      if (
        result.managerId ||
        result.deputyManagerId ||
        result.teamId ||
        result.warnings.length > 0
      ) {
        results.set(i, result);
      }
    }

    this.logger.log(
      `FK Resolution: managers=${summary.resolvedManagers}/${summary.resolvedManagers + summary.unresolvedManagers}, ` +
        `deputies=${summary.resolvedDeputyManagers}/${summary.resolvedDeputyManagers + summary.unresolvedDeputyManagers}, ` +
        `teams=${summary.resolvedTeams}/${summary.resolvedTeams + summary.unresolvedTeams}`
    );

    return { results, summary };
  }

  /**
   * 반출입 이력 배치 FK 해석
   * requester(필수)/approver(선택)/returner(선택) 3쌍 동시 해석
   *
   * @returns 행 인덱스 → CheckoutFkResult 맵
   */
  async resolveCheckoutBatch(
    rows: Array<{ data: Record<string, unknown> }>
  ): Promise<Map<number, CheckoutFkResult>> {
    // 1. 고유 이메일/이름 수집 (3쌍 전체)
    const emails = new Set<string>();
    const names = new Set<string>();

    for (const row of rows) {
      const d = row.data;
      for (const field of ['requesterEmail', 'approverEmail', 'returnerEmail']) {
        if (d[field]) emails.add(String(d[field]).trim().toLowerCase());
      }
      for (const field of ['requesterName', 'approverName', 'returnerName']) {
        if (d[field]) names.add(String(d[field]).trim());
      }
    }

    // 2. 배치 DB 조회
    const emailToUser = await this.resolveUsersByEmail([...emails]);
    const nameToUsers = await this.resolveUsersByName([...names]);

    // 3. 행별 해석
    const results = new Map<number, CheckoutFkResult>();

    for (let i = 0; i < rows.length; i++) {
      const d = rows[i].data;
      const result: CheckoutFkResult = { errors: [], warnings: [] };

      // 신청자 (필수 — 미해석 시 errors)
      const reqEmail = d.requesterEmail ? String(d.requesterEmail).trim().toLowerCase() : undefined;
      const reqName = d.requesterName ? String(d.requesterName).trim() : undefined;
      if (reqEmail || reqName) {
        const resolved = this.resolveUser(reqEmail, reqName, emailToUser, nameToUsers, '신청자');
        result.requesterId = resolved.userId;
        if (!resolved.userId) {
          // requester 미해석 → ERROR (FK NOT NULL)
          result.errors.push(
            resolved.warnings.length > 0
              ? resolved.warnings.join('; ')
              : `신청자(${reqEmail ?? reqName})를 찾을 수 없습니다. (requesterId NOT NULL)`
          );
        } else {
          result.warnings.push(...resolved.warnings);
        }
      }

      // 승인자 (선택 — 미해석 시 warnings)
      const aprEmail = d.approverEmail ? String(d.approverEmail).trim().toLowerCase() : undefined;
      const aprName = d.approverName ? String(d.approverName).trim() : undefined;
      if (aprEmail || aprName) {
        const resolved = this.resolveUser(aprEmail, aprName, emailToUser, nameToUsers, '승인자');
        result.approverId = resolved.userId;
        result.warnings.push(...resolved.warnings);
      }

      // 반입처리자 (선택 — 미해석 시 warnings)
      const retEmail = d.returnerEmail ? String(d.returnerEmail).trim().toLowerCase() : undefined;
      const retName = d.returnerName ? String(d.returnerName).trim() : undefined;
      if (retEmail || retName) {
        const resolved = this.resolveUser(
          retEmail,
          retName,
          emailToUser,
          nameToUsers,
          '반입처리자'
        );
        result.returnerId = resolved.userId;
        result.warnings.push(...resolved.warnings);
      }

      if (
        result.requesterId ||
        result.approverId ||
        result.returnerId ||
        result.errors.length > 0 ||
        result.warnings.length > 0
      ) {
        results.set(i, result);
      }
    }

    this.logger.log(
      `Checkout FK Resolution: ${rows.length}행 처리 — ` +
        `requester 해석=${[...results.values()].filter((r) => r.requesterId).length}, ` +
        `error=${[...results.values()].filter((r) => r.errors.length > 0).length}`
    );

    return results;
  }

  // ── Private 헬퍼 ──────────────────────────────────────────────────────────────

  /**
   * 이메일 배열 → email → { id, name } 맵 (대소문자 무시)
   */
  private async resolveUsersByEmail(
    emailList: string[]
  ): Promise<Map<string, { id: string; name: string }>> {
    if (emailList.length === 0) return new Map();

    const result = new Map<string, { id: string; name: string }>();
    const chunks = chunkArray(emailList, BATCH_QUERY_LIMITS.MIGRATION_CHUNK_SIZE);

    for (const chunk of chunks) {
      const rows = await this.db
        .select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(and(inArray(users.email, chunk), eq(users.isActive, true)));

      for (const row of rows) {
        result.set(row.email.toLowerCase(), { id: row.id, name: row.name });
      }
    }

    return result;
  }

  /**
   * 이름 배열 → name → { id, email }[] 맵 (동명이인 가능 → 배열)
   * ILIKE로 대소문자 무시 매칭
   */
  private async resolveUsersByName(
    nameList: string[]
  ): Promise<Map<string, Array<{ id: string; email: string }>>> {
    if (nameList.length === 0) return new Map();

    const result = new Map<string, Array<{ id: string; email: string }>>();

    // 이름은 ILIKE 매칭이 필요하므로 개별 쿼리 (배치화하면 OR 체이닝)
    // 성능: 보통 고유 이름 수가 적음 (10-50명)
    for (const name of nameList) {
      const rows = await this.db
        .select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(and(safeIlike(users.name, likeContains(name)), eq(users.isActive, true)));

      if (rows.length > 0) {
        result.set(
          name,
          rows.map((r) => ({ id: r.id, email: r.email }))
        );
      }
    }

    return result;
  }

  /**
   * site:classification 쌍 → teamId 맵
   */
  private async resolveTeams(pairs: string[]): Promise<Map<string, string>> {
    if (pairs.length === 0) return new Map();

    const result = new Map<string, string>();

    // 전체 팀 조회 (팀 수가 적으므로 일괄 조회가 효율적)
    const allTeams = await this.db
      .select({
        id: teams.id,
        site: teams.site,
        classificationCode: teams.classificationCode,
      })
      .from(teams);

    const teamIndex = new Map<string, string>();
    for (const t of allTeams) {
      if (t.classificationCode) {
        teamIndex.set(`${t.site}:${t.classificationCode}`, t.id);
      }
    }

    for (const pair of pairs) {
      const teamId = teamIndex.get(pair);
      if (teamId) result.set(pair, teamId);
    }

    return result;
  }

  /**
   * 단일 사용자 해석: 이메일 우선 → 이름 폴백
   */
  private resolveUser(
    email: string | undefined,
    name: string | undefined,
    emailToUser: Map<string, { id: string; name: string }>,
    nameToUsers: Map<string, Array<{ id: string; email: string }>>,
    label: string
  ): { userId?: string; warnings: string[] } {
    const warnings: string[] = [];

    // 이메일 매칭 (정확 매칭)
    if (email) {
      const user = emailToUser.get(email);
      if (user) return { userId: user.id, warnings };
      warnings.push(`${label} 이메일 '${email}'에 해당하는 사용자를 찾을 수 없습니다.`);
    }

    // 이름 폴백
    if (name) {
      const candidates = nameToUsers.get(name);
      if (candidates && candidates.length === 1) {
        return { userId: candidates[0].id, warnings };
      }
      if (candidates && candidates.length > 1) {
        warnings.push(
          `${label} '${name}' 동명이인 ${candidates.length}명 — 이메일로 특정해주세요: ${candidates.map((c) => c.email).join(', ')}`
        );
        return { userId: undefined, warnings };
      }
      if (!email) {
        warnings.push(`${label} '${name}'에 해당하는 사용자를 찾을 수 없습니다.`);
      }
    }

    return { userId: undefined, warnings };
  }
}
