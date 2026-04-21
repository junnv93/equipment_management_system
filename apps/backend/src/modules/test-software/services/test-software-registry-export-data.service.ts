import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, or, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { AppDatabase } from '@equipment-management/db';
import { testSoftware } from '@equipment-management/db/schema/test-software';
import { users } from '@equipment-management/db/schema/users';
import { EXPORT_QUERY_LIMITS } from '@equipment-management/shared-constants';
import type { SoftwareAvailability, TestField } from '@equipment-management/schemas';
import type { EnforcedScope } from '../../../common/scope/scope-enforcer';
import { likeContains, safeIlike } from '../../../common/utils/like-escape';

export interface TestSoftwareRegistryRow {
  managementNumber: string;
  name: string;
  softwareVersion: string | null;
  testField: TestField;
  primaryManagerName: string | null;
  secondaryManagerName: string | null;
  installedAt: Date | null;
  manufacturer: string | null;
  location: string | null;
  availability: SoftwareAvailability;
  requiresValidation: boolean;
}

export interface TestSoftwareRegistryExportData {
  rows: TestSoftwareRegistryRow[];
}

/**
 * UL-QP-18-07 시험용 소프트웨어 관리대장 내보내기 데이터 수집 서비스.
 *
 * DB 조회 + 스코프 검증 + 필터 적용만 담당.
 * 렌더링 관심사(셀 좌표, DocxTemplate 호출)는 TestSoftwareRegistryRendererService로 분리.
 */
@Injectable()
export class TestSoftwareRegistryExportDataService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  async getData(
    params: Record<string, string>,
    filter: EnforcedScope
  ): Promise<TestSoftwareRegistryExportData> {
    const conditions: SQL<unknown>[] = [];

    if (filter.site) {
      conditions.push(eq(testSoftware.site, filter.site));
    }
    if (params.testField) {
      conditions.push(eq(testSoftware.testField, params.testField as TestField));
    }
    if (params.availability) {
      conditions.push(eq(testSoftware.availability, params.availability as SoftwareAvailability));
    }
    if (params.manufacturer) {
      conditions.push(eq(testSoftware.manufacturer, params.manufacturer));
    }
    if (params.search) {
      const pattern = likeContains(params.search);
      conditions.push(
        or(
          safeIlike(testSoftware.managementNumber, pattern),
          safeIlike(testSoftware.name, pattern),
          safeIlike(testSoftware.manufacturer, pattern)
        )!
      );
    }

    const primaryManager = alias(users, 'primaryManager');
    const secondaryManager = alias(users, 'secondaryManager');

    const rows = await this.db
      .select({
        managementNumber: testSoftware.managementNumber,
        name: testSoftware.name,
        softwareVersion: testSoftware.softwareVersion,
        testField: testSoftware.testField,
        primaryManagerName: primaryManager.name,
        secondaryManagerName: secondaryManager.name,
        installedAt: testSoftware.installedAt,
        manufacturer: testSoftware.manufacturer,
        location: testSoftware.location,
        availability: testSoftware.availability,
        requiresValidation: testSoftware.requiresValidation,
      })
      .from(testSoftware)
      .leftJoin(primaryManager, eq(testSoftware.primaryManagerId, primaryManager.id))
      .leftJoin(secondaryManager, eq(testSoftware.secondaryManagerId, secondaryManager.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(testSoftware.managementNumber))
      .limit(EXPORT_QUERY_LIMITS.FULL_EXPORT);

    return { rows: rows as TestSoftwareRegistryRow[] };
  }
}
