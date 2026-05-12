import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { checkouts, checkoutItems } from '@equipment-management/db/schema/checkouts';
import { conditionChecks } from '@equipment-management/db/schema/condition-checks';
import { teams } from '@equipment-management/db/schema/teams';
import { users } from '@equipment-management/db/schema/users';
import type { Equipment } from '@equipment-management/db/schema/equipment';
import {
  Permission,
  userHasPermission,
  QR_ACTION_VALUES,
  type QRAllowedAction,
} from '@equipment-management/shared-constants';
import {
  EquipmentStatusEnum,
  CheckoutStatusEnum,
  CheckoutPurposeEnum,
  ConditionStatusEnum,
  AccessoriesStatusEnum,
  SITE_LABELS,
  type Site,
  type ConditionStatus,
  type AccessoriesStatus,
  type HandoverItem,
} from '@equipment-management/schemas';
import type { JwtUser } from '../../../types/auth';

/**
 * resolveAllowedActions 반환 타입.
 *
 * `handovers` 는 confirm_handover_* 액션이 도출된 모든 checkout 의 컨텍스트 (SSOT).
 *
 * @see packages/schemas/src/qr-handover.ts (HandoverItem SSOT)
 */
export interface QRAccessResult {
  actions: QRAllowedAction[];
  /**
   * confirm_handover_receive / confirm_handover_return 액션이 가리키는 checkout 목록.
   * 사용자가 동시에 여러 건의 수령/반환 대기를 가질 때 picker UI 가 카드로 노출.
   */
  handovers?: HandoverItem[];
}

/**
 * QR 모바일 랜딩에서 현재 사용자가 장비에 대해 수행 가능한 액션 목록을 계산.
 *
 * 서버가 `권한 + 관계 + 장비 상태`를 조합해 SSOT로 판정한다. 프론트엔드는
 * 이 배열을 단순 소비하며 별도 판정을 수행하지 않는다 (CTA 노출 중복 로직 제거).
 *
 * 판정 규칙 (Phase 1):
 * - `view_detail` / `view_qr`: VIEW_EQUIPMENT 권한자 (cross-site 허용)
 * - `request_checkout`: CREATE_CHECKOUT 권한 + 장비 status `available` + 사용자 사이트 === 장비 사이트
 * - `mark_checkout_returned`: 사용자가 현재 이 장비를 반출 중(`checked_out`)인 경우 (cross-site 허용)
 * - `report_nc`: CREATE_NON_CONFORMANCE 권한자 (cross-site 허용)
 * - `confirm_handover_receive`: 본인이 requester(borrower) + status `lender_checked`
 * - `confirm_handover_return`: 본인이 approver(lender) + status `borrower_returned`
 *
 * Phase 3 확장 후보: `scan_continuous` (연속 스캔 — 재고 실사용).
 */
@Injectable()
export class QRAccessService {
  private readonly logger = new Logger(QRAccessService.name);

  constructor(@Inject('DRIZZLE_INSTANCE') private readonly db: AppDatabase) {}

  async resolveAllowedActions(
    equipment: Pick<Equipment, 'id' | 'site' | 'status'>,
    user: JwtUser
  ): Promise<QRAccessResult> {
    const actions = new Set<QRAllowedAction>();
    const roles = user.roles ?? [];
    let handovers: HandoverItem[] = [];

    // 1. 기본 뷰 액션 — VIEW_EQUIPMENT 권한자 (cross-site 허용)
    if (userHasPermission(roles, Permission.VIEW_EQUIPMENT)) {
      actions.add('view_detail');
      actions.add('view_qr');
    }

    // 2. 반출 신청 — CREATE_CHECKOUT + 장비 가용 + 같은 사이트
    const sameSite = !!user.site && user.site === equipment.site;
    if (
      sameSite &&
      equipment.status === EquipmentStatusEnum.enum.available &&
      userHasPermission(roles, Permission.CREATE_CHECKOUT)
    ) {
      actions.add('request_checkout');
    }

    // 3. 반납 기록 — 현재 사용자가 이 장비를 active checkout(checked_out) 중인 경우
    if (await this.hasActiveCheckoutAsRequester(equipment.id, user.userId)) {
      actions.add('mark_checkout_returned');
    }

    // 4. 부적합 신고 — CREATE_NON_CONFORMANCE 권한 (cross-site 허용)
    if (userHasPermission(roles, Permission.CREATE_NON_CONFORMANCE)) {
      actions.add('report_nc');
    }

    // 5. 인수인계 확인 — rental 4-step handover 단계 (cross-site 허용)
    // 여러 lender_checked / borrower_returned checkout 동시 보유 가능 — 배열로 도출.
    handovers = await this.resolveHandoverActions(equipment.id, user.userId);
    for (const item of handovers) {
      actions.add(item.type === 'receive' ? 'confirm_handover_receive' : 'confirm_handover_return');
    }

    const result: QRAccessResult = {
      actions: QR_ACTION_VALUES.filter((a) => actions.has(a)),
    };
    if (handovers.length > 0) {
      result.handovers = handovers;
    }
    return result;
  }

  private async hasActiveCheckoutAsRequester(
    equipmentId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const rows = await this.db
        .select({ id: checkouts.id })
        .from(checkouts)
        .innerJoin(checkoutItems, eq(checkoutItems.checkoutId, checkouts.id))
        .where(
          and(
            eq(checkouts.requesterId, userId),
            eq(checkoutItems.equipmentId, equipmentId),
            inArray(checkouts.status, [CheckoutStatusEnum.enum.checked_out])
          )
        )
        .limit(1);
      return rows.length > 0;
    } catch (error) {
      this.logger.warn(
        `active checkout 조회 실패 (equipmentId=${equipmentId}, userId=${userId}): ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return false;
    }
  }

  /**
   * rental 4-step 인수인계 단계에서 수행 가능한 handover 컨텍스트 목록.
   *
   * 사용자가 borrower(requester) 또는 lender(approver) 로 참여한 모든 checkout 중
   * status 가 `lender_checked` 또는 `borrower_returned` 인 row 를 카드 데이터로 매핑.
   */
  private async resolveHandoverActions(
    equipmentId: string,
    userId: string
  ): Promise<HandoverItem[]> {
    try {
      const rows = await this.db
        .select({
          checkoutId: checkouts.id,
          status: checkouts.status,
          requesterId: checkouts.requesterId,
          approverId: checkouts.approverId,
          lenderTeamId: checkouts.lenderTeamId,
          destination: checkouts.destination,
          lenderTeamName: teams.name,
          lenderSite: teams.site,
          borrowerSite: users.site,
        })
        .from(checkouts)
        .innerJoin(checkoutItems, eq(checkoutItems.checkoutId, checkouts.id))
        .leftJoin(teams, eq(teams.id, checkouts.lenderTeamId))
        .leftJoin(users, eq(users.id, checkouts.requesterId))
        .where(
          and(
            eq(checkoutItems.equipmentId, equipmentId),
            eq(checkouts.purpose, CheckoutPurposeEnum.enum.rental),
            inArray(checkouts.status, [
              CheckoutStatusEnum.enum.lender_checked,
              CheckoutStatusEnum.enum.borrower_returned,
            ])
          )
        );

      if (rows.length === 0) return [];

      const items: HandoverItem[] = [];
      for (const row of rows) {
        const isBorrowerReceive =
          row.status === CheckoutStatusEnum.enum.lender_checked && row.requesterId === userId;
        const isLenderReturn =
          row.status === CheckoutStatusEnum.enum.borrower_returned && row.approverId === userId;

        if (!isBorrowerReceive && !isLenderReturn) continue;

        const lastCheckStep = isBorrowerReceive ? 'lender_checkout' : 'borrower_return';
        const lastCheck = await this.fetchLastConditionCheck(row.checkoutId, lastCheckStep);

        items.push({
          id: row.checkoutId,
          type: isBorrowerReceive ? 'receive' : 'return',
          lenderTeamName: row.lenderTeamName ?? '',
          lenderSiteLabel: this.formatSiteLabel(row.lenderSite),
          borrowerSiteLabel: this.formatSiteLabel(row.borrowerSite) || (row.destination ?? ''),
          checkedAt: (lastCheck?.checkedAt ?? new Date()).toISOString(),
          lastCheck: {
            appearance: lastCheck?.appearance ?? ConditionStatusEnum.enum.normal,
            operation: lastCheck?.operation ?? ConditionStatusEnum.enum.normal,
            ...(lastCheck?.accessories !== undefined && { accessories: lastCheck.accessories }),
          },
          inspectorName: lastCheck?.inspectorName ?? '',
        });
      }
      return items;
    } catch (error) {
      this.logger.warn(
        `handover action 조회 실패 (equipmentId=${equipmentId}, userId=${userId}): ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return [];
    }
  }

  private async fetchLastConditionCheck(
    checkoutId: string,
    step: 'lender_checkout' | 'borrower_return'
  ): Promise<{
    checkedAt: Date;
    appearance: ConditionStatus;
    operation: ConditionStatus;
    accessories: AccessoriesStatus | undefined;
    inspectorName: string;
  } | null> {
    try {
      const rows = await this.db
        .select({
          checkedAt: conditionChecks.checkedAt,
          appearanceStatus: conditionChecks.appearanceStatus,
          operationStatus: conditionChecks.operationStatus,
          accessoriesStatus: conditionChecks.accessoriesStatus,
          inspectorName: users.name,
        })
        .from(conditionChecks)
        .leftJoin(users, eq(users.id, conditionChecks.checkedBy))
        .where(and(eq(conditionChecks.checkoutId, checkoutId), eq(conditionChecks.step, step)))
        .orderBy(desc(conditionChecks.checkedAt))
        .limit(1);
      if (rows.length === 0) return null;
      const row = rows[0];
      const appearance = ConditionStatusEnum.safeParse(row.appearanceStatus);
      const operation = ConditionStatusEnum.safeParse(row.operationStatus);
      const accessories =
        row.accessoriesStatus !== null && row.accessoriesStatus !== undefined
          ? AccessoriesStatusEnum.safeParse(row.accessoriesStatus)
          : null;
      return {
        checkedAt: row.checkedAt,
        appearance: appearance.success ? appearance.data : ConditionStatusEnum.enum.normal,
        operation: operation.success ? operation.data : ConditionStatusEnum.enum.normal,
        accessories: accessories && accessories.success ? accessories.data : undefined,
        inspectorName: row.inspectorName ?? '',
      };
    } catch (error) {
      this.logger.warn(
        `lender 점검 조회 실패 (checkoutId=${checkoutId}, step=${step}): ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return null;
    }
  }

  private formatSiteLabel(site: string | null | undefined): string {
    if (!site) return '';
    if ((SITE_LABELS as Record<string, string>)[site]) {
      return (SITE_LABELS as Record<Site, string>)[site as Site];
    }
    return site;
  }
}
