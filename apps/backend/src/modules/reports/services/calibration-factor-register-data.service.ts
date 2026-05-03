import { Inject, Injectable } from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { and, eq, gte, isNull, lte, or } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import { CalibrationFactorApprovalStatusValues } from '@equipment-management/schemas';
import { QUERY_SAFETY_LIMITS } from '@equipment-management/shared-constants';
import type { EnforcedScope } from '../../../common/scope/scope-enforcer';

export interface CalibrationFactorRegisterRow {
  sequence: number;
  managementNumber: string;
  equipmentName: string;
  factorLabel: string;
  effectiveDate: string;
  checkedBy: string;
  changedDate: string;
}

export interface CalibrationFactorRegisterData {
  rows: CalibrationFactorRegisterRow[];
}

@Injectable()
export class CalibrationFactorRegisterDataService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  async getData(filter: EnforcedScope): Promise<CalibrationFactorRegisterData> {
    const today = new Date().toISOString().split('T')[0];
    const conditions = [
      eq(schema.calibrationFactors.approvalStatus, CalibrationFactorApprovalStatusValues.APPROVED),
      isNull(schema.calibrationFactors.deletedAt),
      lte(schema.calibrationFactors.effectiveDate, today),
      or(
        isNull(schema.calibrationFactors.expiryDate),
        gte(schema.calibrationFactors.expiryDate, today)
      )!,
    ];

    if (filter.site) conditions.push(eq(schema.equipment.site, filter.site));
    if (filter.teamId) conditions.push(eq(schema.equipment.teamId, filter.teamId));

    const rows = await this.db
      .select({
        managementNumber: schema.equipment.managementNumber,
        equipmentName: schema.equipment.name,
        factorName: schema.calibrationFactors.factorName,
        factorValue: schema.calibrationFactors.factorValue,
        unit: schema.calibrationFactors.unit,
        parameters: schema.calibrationFactors.parameters,
        effectiveDate: schema.calibrationFactors.effectiveDate,
        approvedByName: schema.users.name,
        updatedAt: schema.calibrationFactors.updatedAt,
      })
      .from(schema.calibrationFactors)
      .innerJoin(schema.equipment, eq(schema.calibrationFactors.equipmentId, schema.equipment.id))
      .leftJoin(schema.users, eq(schema.calibrationFactors.approvedBy, schema.users.id))
      .where(and(...conditions))
      .orderBy(schema.equipment.managementNumber, schema.calibrationFactors.effectiveDate)
      .limit(QUERY_SAFETY_LIMITS.CALIBRATION_FACTORS_REGISTRY);

    return {
      rows: rows.map((row, index) => ({
        sequence: index + 1,
        managementNumber: row.managementNumber,
        equipmentName: row.equipmentName,
        factorLabel: buildFactorLabel(
          row.factorName,
          Number(row.factorValue),
          row.unit,
          row.parameters as Record<string, unknown> | null
        ),
        effectiveDate: row.effectiveDate,
        checkedBy: row.approvedByName ?? '-',
        changedDate: formatDate(row.updatedAt),
      })),
    };
  }
}

function buildFactorLabel(
  name: string,
  value: number,
  unit: string,
  parameters: Record<string, unknown> | null
): string {
  const parameterLabel =
    parameters && Object.keys(parameters).length > 0
      ? ` (${Object.entries(parameters)
          .map(([key, val]) => `${key}: ${String(val)}`)
          .join(', ')})`
      : '';

  return `${name}: ${value} ${unit}${parameterLabel}`;
}

function formatDate(value: Date | string | null): string {
  if (!value) return '-';
  return new Date(value).toISOString().split('T')[0];
}
