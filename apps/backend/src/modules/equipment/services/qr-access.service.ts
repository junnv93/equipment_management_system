import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { checkouts, checkoutItems } from '@equipment-management/db/schema/checkouts';
import type { Equipment } from '@equipment-management/db/schema/equipment';
import {
  Permission,
  userHasPermission,
  QR_ACTION_VALUES,
  type QRAllowedAction,
} from '@equipment-management/shared-constants';
import type { JwtUser } from '../../../types/auth';

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
 *
 * Phase 2/3 확장 대상: `report_nc_mobile`, `confirm_handover_receive` 등.
 */
@Injectable()
export class QRAccessService {
  private readonly logger = new Logger(QRAccessService.name);

  constructor(@Inject('DRIZZLE_INSTANCE') private readonly db: AppDatabase) {}

  async resolveAllowedActions(
    equipment: Pick<Equipment, 'id' | 'site' | 'status'>,
    user: JwtUser
  ): Promise<QRAllowedAction[]> {
    const actions = new Set<QRAllowedAction>();
    const roles = user.roles ?? [];

    // 1. 기본 뷰 액션 — VIEW_EQUIPMENT 권한자 (cross-site 허용)
    if (userHasPermission(roles, Permission.VIEW_EQUIPMENT)) {
      actions.add('view_detail');
      actions.add('view_qr');
    }

    // 2. 반출 신청 — CREATE_CHECKOUT + 장비 가용 + 같은 사이트
    const sameSite = !!user.site && user.site === equipment.site;
    if (
      sameSite &&
      equipment.status === 'available' &&
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

    // QR_ACTION_VALUES 순서대로 정렬 (프론트 표시 우선순위는 QR_ACTION_PRIORITY로 별도 처리)
    return QR_ACTION_VALUES.filter((a) => actions.has(a));
  }

  /**
   * 사용자가 이 장비를 현재 반출 중(status `checked_out`)인지 확인.
   *
   * checkouts 테이블에 equipment_id 컬럼이 없으므로 반드시 checkout_items 조인 경유.
   * (프로젝트 메모리: "checkouts 테이블에 equipmentId 없음 — checkoutItems 경유 join 필수")
   */
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
            inArray(checkouts.status, ['checked_out'])
          )
        )
        .limit(1);
      return rows.length > 0;
    } catch (error) {
      this.logger.warn(
        `active checkout 조회 실패 (equipmentId=${equipmentId}, userId=${userId}): ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }
}
