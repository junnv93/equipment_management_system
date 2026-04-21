import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { checkouts } from '@equipment-management/db/schema/checkouts';
import { equipmentImports } from '@equipment-management/db/schema/equipment-imports';
import { users } from '@equipment-management/db/schema/users';
import { EquipmentImportSourceValues } from '@equipment-management/schemas';
import type { EnforcedScope } from '../../../common/scope/scope-enforcer';
import type { CheckoutFormExportData } from './checkout-form-export-data.service';

/**
 * UL-QP-18-06 장비 반·출입 확인서 — rental-import variant 데이터 수집 서비스.
 *
 * 렌탈 반입(importId)을 QP-18-06 반출입 확인서 형식으로 매핑.
 * 반출 = 업체에서 장비 출고(수령), 반입 = 업체로 장비 반납(반환).
 *
 * 렌더러(CheckoutFormRendererService)는 checkout/rental 두 variant를 동일하게 처리.
 */
@Injectable()
export class RentalImportCheckoutFormExportDataService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  async getData(
    params: Record<string, string>,
    filter: EnforcedScope
  ): Promise<CheckoutFormExportData> {
    const importId = params.importId;
    if (!importId) {
      throw new BadRequestException({
        code: 'MISSING_IMPORT_ID',
        message: 'importId query parameter is required for rental import export.',
      });
    }

    const [imp] = await this.db
      .select()
      .from(equipmentImports)
      .where(eq(equipmentImports.id, importId))
      .limit(1);

    if (!imp) {
      throw new NotFoundException({
        code: 'EQUIPMENT_IMPORT_NOT_FOUND',
        message: 'Equipment import not found.',
      });
    }

    if (imp.sourceType !== EquipmentImportSourceValues.RENTAL) {
      throw new BadRequestException({
        code: 'INVALID_SOURCE_TYPE',
        message:
          'QP-18-06 form is only for rental imports. Use QP-18-10 for internal shared equipment.',
      });
    }

    if (filter.site && imp.site !== filter.site) {
      throw new NotFoundException({
        code: 'EQUIPMENT_IMPORT_NOT_FOUND',
        message: 'Equipment import not found or not accessible from your site.',
      });
    }
    if (filter.teamId && imp.teamId !== filter.teamId) {
      throw new NotFoundException({
        code: 'EQUIPMENT_IMPORT_NOT_FOUND',
        message: 'Equipment import not found or not accessible from your team.',
      });
    }

    const [[requester], [approver]] = await Promise.all([
      this.db
        .select({ name: users.name, signaturePath: users.signatureImagePath })
        .from(users)
        .where(eq(users.id, imp.requesterId))
        .limit(1),
      imp.approverId
        ? this.db
            .select({ name: users.name, signaturePath: users.signatureImagePath })
            .from(users)
            .where(eq(users.id, imp.approverId))
            .limit(1)
        : Promise.resolve([null] as [null]),
    ]);

    let returnDate: Date | null = null;
    if (imp.returnCheckoutId) {
      const [returnCheckout] = await this.db
        .select({ actualReturnDate: checkouts.actualReturnDate })
        .from(checkouts)
        .where(eq(checkouts.id, imp.returnCheckoutId))
        .limit(1);
      returnDate = returnCheckout?.actualReturnDate ?? null;
    }

    const receivingCondition = (imp.receivingCondition ?? {}) as {
      appearance?: string;
      operation?: string;
    };
    const returnedCondition = (imp.returnedCondition ?? {}) as {
      appearance?: string;
      abnormality?: string;
    };

    const condBefore =
      receivingCondition.appearance === 'normal' && receivingCondition.operation === 'normal'
        ? '양호'
        : receivingCondition.appearance
          ? '이상 있음'
          : null;
    const condAfter =
      returnedCondition.appearance === 'normal' && returnedCondition.abnormality === 'none'
        ? '양호'
        : returnedCondition.appearance
          ? '이상 있음'
          : null;

    const managementLabel = imp.externalIdentifier ?? imp.serialNumber ?? null;

    return {
      destination: imp.vendorName ?? null,
      phoneNumber: imp.vendorContact ?? null,
      address: null,
      reason: imp.reason ?? null,
      checkoutDate: imp.receivedAt ?? null,
      actualReturnDate: returnDate,
      inspectionNotes: imp.returnedAbnormalDetails ?? null,
      items: [
        {
          sequenceNumber: 1,
          equipmentName: imp.equipmentName ?? null,
          equipmentModel: imp.modelName ?? null,
          quantity: imp.quantityOut ?? 1,
          equipmentManagementNumber: managementLabel,
          conditionBefore: condBefore,
          conditionAfter: condAfter,
        },
      ],
      conditionCheckout: null,
      conditionReturn: null,
      requester: requester
        ? { name: requester.name, signaturePath: requester.signaturePath }
        : null,
      approver: approver ? { name: approver.name, signaturePath: approver.signaturePath } : null,
    };
  }
}
