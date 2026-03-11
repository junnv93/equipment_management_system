import { Injectable, Inject } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import * as schema from '@equipment-management/db/schema';
import { systemSettings as settingsTable } from '@equipment-management/db/schema';
import { DEFAULT_CALIBRATION_ALERT_DAYS } from './dto/calibration-settings.dto';
import { DEFAULT_SYSTEM_SETTINGS, type SystemSettings } from './dto/system-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase
  ) {}

  /**
   * 카테고리별 설정값 조회 (사이트 오버라이드 병합)
   * 사이트 설정이 있으면 우선 사용, 없으면 전역 설정 폴백
   */
  private async getSettingValue(
    category: string,
    key: string,
    site?: string
  ): Promise<unknown | null> {
    // 사이트 설정 먼저 조회
    if (site) {
      const siteRow = await this.db
        .select()
        .from(settingsTable)
        .where(
          and(
            eq(settingsTable.category, category),
            eq(settingsTable.key, key),
            eq(settingsTable.site, site)
          )
        )
        .limit(1);
      if (siteRow.length > 0) {
        return siteRow[0].value;
      }
    }

    // 전역 설정 폴백
    const globalRow = await this.db
      .select()
      .from(settingsTable)
      .where(
        and(
          eq(settingsTable.category, category),
          eq(settingsTable.key, key),
          isNull(settingsTable.site)
        )
      )
      .limit(1);

    return globalRow.length > 0 ? globalRow[0].value : null;
  }

  /**
   * 설정값 저장 (upsert)
   */
  private async setSettingValue(
    category: string,
    key: string,
    value: unknown,
    updatedBy: string,
    site?: string
  ): Promise<void> {
    const conditions = [eq(settingsTable.category, category), eq(settingsTable.key, key)];
    if (site) {
      conditions.push(eq(settingsTable.site, site));
    } else {
      conditions.push(isNull(settingsTable.site));
    }

    const existing = await this.db
      .select()
      .from(settingsTable)
      .where(and(...conditions))
      .limit(1);

    if (existing.length > 0) {
      await this.db
        .update(settingsTable)
        .set({ value: value as Record<string, unknown>, updatedBy, updatedAt: new Date() })
        .where(eq(settingsTable.id, existing[0].id));
    } else {
      await this.db.insert(settingsTable).values({
        category,
        key,
        value: value as Record<string, unknown>,
        site: site || null,
        updatedBy,
      });
    }
  }

  // ─── Calibration Settings ───

  async getCalibrationAlertDays(site?: string): Promise<number[]> {
    const value = await this.getSettingValue('calibration', 'alertDays', site);
    if (Array.isArray(value)) {
      return value as number[];
    }
    return DEFAULT_CALIBRATION_ALERT_DAYS;
  }

  async updateCalibrationAlertDays(
    alertDays: number[],
    updatedBy: string,
    site?: string
  ): Promise<number[]> {
    const sorted = [...alertDays].sort((a, b) => b - a);
    await this.setSettingValue('calibration', 'alertDays', sorted, updatedBy, site);
    return sorted;
  }

  // ─── System Settings ───

  async getSystemSettings(): Promise<SystemSettings> {
    const rows = await this.db
      .select({ key: settingsTable.key, value: settingsTable.value })
      .from(settingsTable)
      .where(and(eq(settingsTable.category, 'system'), isNull(settingsTable.site)));

    const result = { ...DEFAULT_SYSTEM_SETTINGS };
    for (const row of rows) {
      if (row.key in result) {
        (result as Record<string, unknown>)[row.key] = row.value;
      }
    }

    return result;
  }

  async updateSystemSettings(
    settings: Partial<SystemSettings>,
    updatedBy: string
  ): Promise<SystemSettings> {
    for (const [key, value] of Object.entries(settings)) {
      if (value !== undefined) {
        await this.setSettingValue('system', key, value, updatedBy);
      }
    }
    return this.getSystemSettings();
  }
}
