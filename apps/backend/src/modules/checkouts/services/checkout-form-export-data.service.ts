import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { checkouts, checkoutItems } from '@equipment-management/db/schema/checkouts';
import { conditionChecks } from '@equipment-management/db/schema/condition-checks';
import { equipment } from '@equipment-management/db/schema/equipment';
import { users } from '@equipment-management/db/schema/users';
import type { EnforcedScope } from '../../../common/scope/scope-enforcer';

export interface CheckoutFormSigner {
  name: string | null;
  signaturePath: string | null;
}

export interface CheckoutFormItem {
  sequenceNumber: number;
  equipmentName: string | null;
  equipmentModel: string | null;
  quantity: number;
  equipmentManagementNumber: string | null;
  conditionBefore: string | null;
  conditionAfter: string | null;
}

export interface CheckoutFormExportData {
  destination: string | null;
  phoneNumber: string | null;
  address: string | null;
  reason: string | null;
  checkoutDate: Date | null;
  actualReturnDate: Date | null;
  inspectionNotes: string | null;
  items: CheckoutFormItem[];
  /** lender_checkout/lender_return 단계 상태 (항목별 conditionBefore/After 없을 때 폴백) */
  conditionCheckout: string | null;
  conditionReturn: string | null;
  requester: CheckoutFormSigner | null;
  approver: CheckoutFormSigner | null;
}

/**
 * UL-QP-18-06 장비 반·출입 확인서 — checkout(반출) variant 데이터 수집 서비스.
 *
 * checkoutId 기반 조회 + 스코프 경계 검증만 담당.
 * 렌더링 관심사(셀 좌표, DocxTemplate)는 CheckoutFormRendererService로 분리.
 */
@Injectable()
export class CheckoutFormExportDataService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  async getData(
    params: Record<string, string>,
    filter: EnforcedScope
  ): Promise<CheckoutFormExportData> {
    const checkoutId = params.checkoutId;
    if (!checkoutId) {
      throw new BadRequestException({
        code: 'MISSING_CHECKOUT_ID',
        message: 'checkoutId query parameter is required for checkout export.',
      });
    }

    const [checkout] = await this.db
      .select()
      .from(checkouts)
      .where(eq(checkouts.id, checkoutId))
      .limit(1);

    if (!checkout) {
      throw new NotFoundException({
        code: 'CHECKOUT_NOT_FOUND',
        message: 'Checkout not found.',
      });
    }

    const items = await this.db
      .select({
        sequenceNumber: checkoutItems.sequenceNumber,
        quantity: checkoutItems.quantity,
        conditionBefore: checkoutItems.conditionBefore,
        conditionAfter: checkoutItems.conditionAfter,
        equipmentName: equipment.name,
        equipmentModel: equipment.modelName,
        equipmentManagementNumber: equipment.managementNumber,
        equipmentSite: equipment.site,
        equipmentTeamId: equipment.teamId,
      })
      .from(checkoutItems)
      .innerJoin(equipment, eq(checkoutItems.equipmentId, equipment.id))
      .where(eq(checkoutItems.checkoutId, checkoutId))
      .orderBy(asc(checkoutItems.sequenceNumber));

    if (filter.site && items.some((it) => it.equipmentSite !== filter.site)) {
      throw new NotFoundException({
        code: 'CHECKOUT_NOT_FOUND',
        message: 'Checkout not found or not accessible from your site.',
      });
    }
    if (filter.teamId && items.some((it) => it.equipmentTeamId !== filter.teamId)) {
      throw new NotFoundException({
        code: 'CHECKOUT_NOT_FOUND',
        message: 'Checkout not found or not accessible from your team.',
      });
    }

    const [condChecks, [requester], [approver]] = await Promise.all([
      this.db.select().from(conditionChecks).where(eq(conditionChecks.checkoutId, checkoutId)),
      this.db
        .select({ name: users.name, signaturePath: users.signatureImagePath })
        .from(users)
        .where(eq(users.id, checkout.requesterId))
        .limit(1),
      checkout.approverId
        ? this.db
            .select({ name: users.name, signaturePath: users.signatureImagePath })
            .from(users)
            .where(eq(users.id, checkout.approverId))
            .limit(1)
        : Promise.resolve([null] as [null]),
    ]);

    const findCondition = (step: 'lender_checkout' | 'lender_return'): string | null => {
      const c = condChecks.find((cc) => cc.step === step);
      if (!c) return null;
      return `${c.appearanceStatus}/${c.operationStatus}`;
    };

    return {
      destination: checkout.destination ?? null,
      phoneNumber: checkout.phoneNumber ?? null,
      address: checkout.address ?? null,
      reason: checkout.reason ?? null,
      checkoutDate: checkout.checkoutDate ?? null,
      actualReturnDate: checkout.actualReturnDate ?? null,
      inspectionNotes: checkout.inspectionNotes ?? null,
      items: items.map((it) => ({
        sequenceNumber: it.sequenceNumber,
        equipmentName: it.equipmentName ?? null,
        equipmentModel: it.equipmentModel ?? null,
        quantity: it.quantity,
        equipmentManagementNumber: it.equipmentManagementNumber ?? null,
        conditionBefore: it.conditionBefore ?? null,
        conditionAfter: it.conditionAfter ?? null,
      })),
      conditionCheckout: findCondition('lender_checkout'),
      conditionReturn: findCondition('lender_return'),
      requester: requester
        ? { name: requester.name, signaturePath: requester.signaturePath }
        : null,
      approver: approver ? { name: approver.name, signaturePath: approver.signaturePath } : null,
    };
  }
}
