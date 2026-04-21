import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { equipmentImports } from '@equipment-management/db/schema/equipment-imports';
import { users } from '@equipment-management/db/schema/users';
import { teams } from '@equipment-management/db/schema/teams';
import { EquipmentImportSourceValues } from '@equipment-management/schemas';
import type { EnforcedScope } from '../../../common/scope/scope-enforcer';

export interface EquipmentImportFormSigner {
  name: string | null;
  signaturePath: string | null;
}

export interface EquipmentImportFormExportData {
  teamName: string | null;
  ownerDepartment: string | null;
  usageLocation: string | null;
  usagePeriodStart: Date | null;
  usagePeriodEnd: Date | null;
  reason: string | null;
  equipmentName: string | null;
  modelName: string | null;
  quantityOut: number | null;
  quantityReturned: number | null;
  managementLabel: string | null;
  /** jsonb appearance enum 원본 — 렌더러가 koConditionLabel로 변환 */
  receivingAppearance: string | undefined;
  returnedAppearance: string | undefined;
  returnedAbnormality: string | undefined;
  returnedAbnormalDetails: string | null;
  receivedAt: Date | null;
  requester: EquipmentImportFormSigner | null;
  approver: EquipmentImportFormSigner | null;
}

/**
 * UL-QP-18-10 공용 장비 사용/반납 확인서 내보내기 데이터 수집 서비스.
 *
 * internal_shared sourceType 전용. rental은 QP-18-06(CheckoutFormExportDataService) 사용.
 * 렌더링 관심사(셀 좌표, DocxTemplate)는 EquipmentImportFormRendererService로 분리.
 */
@Injectable()
export class EquipmentImportFormExportDataService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  async getData(
    params: Record<string, string>,
    filter: EnforcedScope
  ): Promise<EquipmentImportFormExportData> {
    const importId = params.importId;
    if (!importId) {
      throw new BadRequestException({
        code: 'MISSING_IMPORT_ID',
        message: 'importId query parameter is required for equipment import export.',
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

    if (imp.sourceType === EquipmentImportSourceValues.RENTAL) {
      throw new BadRequestException({
        code: 'INVALID_SOURCE_TYPE',
        message:
          'Rental imports must use QP-18-06 (장비반출입확인서). QP-18-10 is for internal shared equipment only.',
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

    const [[requester], [approver], [team]] = await Promise.all([
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
      this.db.select({ name: teams.name }).from(teams).where(eq(teams.id, imp.teamId)).limit(1),
    ]);

    const receivingCondition = (imp.receivingCondition ?? {}) as {
      appearance?: string;
      operation?: string;
      accessories?: string;
      notes?: string;
    };
    const returnedCondition = (imp.returnedCondition ?? {}) as {
      appearance?: string;
      abnormality?: string;
      notes?: string;
    };

    return {
      teamName: team?.name ?? null,
      ownerDepartment: imp.ownerDepartment ?? null,
      usageLocation: imp.usageLocation ?? null,
      usagePeriodStart: imp.usagePeriodStart ?? null,
      usagePeriodEnd: imp.usagePeriodEnd ?? null,
      reason: imp.reason ?? null,
      equipmentName: imp.equipmentName ?? null,
      modelName: imp.modelName ?? null,
      quantityOut: imp.quantityOut ?? null,
      quantityReturned: imp.quantityReturned ?? null,
      managementLabel: imp.externalIdentifier ?? imp.serialNumber ?? null,
      receivingAppearance: receivingCondition.appearance,
      returnedAppearance: returnedCondition.appearance,
      returnedAbnormality: returnedCondition.abnormality,
      returnedAbnormalDetails: imp.returnedAbnormalDetails ?? null,
      receivedAt: imp.receivedAt ?? null,
      requester: requester
        ? { name: requester.name, signaturePath: requester.signaturePath }
        : null,
      approver: approver ? { name: approver.name, signaturePath: approver.signaturePath } : null,
    };
  }
}
