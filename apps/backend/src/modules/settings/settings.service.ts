import { Injectable, Inject } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { systemSettings as settingsTable } from '@equipment-management/db/schema';
import type {
  SystemSettings,
  CalibrationAlertSettingsResponse,
} from '@equipment-management/schemas';
import {
  DEFAULT_CALIBRATION_ALERT_DAYS,
  DEFAULT_SYSTEM_SETTINGS,
} from '@equipment-management/schemas';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CacheInvalidationHelper } from '../../common/cache/cache-invalidation.helper';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';

const SETTINGS_CACHE_TTL = 10 * 60 * 1000; // 10분 — 변경 빈도 낮은 데이터

type DbOrTx = AppDatabase | Parameters<Parameters<AppDatabase['transaction']>[0]>[0];

@Injectable()
export class SettingsService {
  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService,
    private readonly cacheInvalidationHelper: CacheInvalidationHelper
  ) {}

  // ─── Cache Key Builders ───

  private calibrationCacheKey(site?: string): string {
    return `${CACHE_KEY_PREFIXES.SETTINGS}calibration:alertDays:${site ?? 'global'}`;
  }

  private systemCacheKey(): string {
    return `${CACHE_KEY_PREFIXES.SETTINGS}system`;
  }

  // ─── Private: DB Access ───

  private async getSettingValue(
    category: string,
    key: string,
    site?: string,
    executor: DbOrTx = this.db
  ): Promise<unknown | null> {
    if (site) {
      const siteRow = await executor
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

    const globalRow = await executor
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

  private async setSettingValue(
    category: string,
    key: string,
    value: unknown,
    updatedBy: string,
    site?: string,
    executor: DbOrTx = this.db
  ): Promise<void> {
    const conditions = [eq(settingsTable.category, category), eq(settingsTable.key, key)];
    if (site) {
      conditions.push(eq(settingsTable.site, site));
    } else {
      conditions.push(isNull(settingsTable.site));
    }

    const existing = await executor
      .select()
      .from(settingsTable)
      .where(and(...conditions))
      .limit(1);

    if (existing.length > 0) {
      await executor
        .update(settingsTable)
        .set({ value: value as Record<string, unknown>, updatedBy, updatedAt: new Date() })
        .where(eq(settingsTable.id, existing[0].id));
    } else {
      await executor.insert(settingsTable).values({
        category,
        key,
        value: value as Record<string, unknown>,
        site: site || null,
        updatedBy,
      });
    }
  }

  // ─── Calibration Settings ───

  async getCalibrationAlertDays(site?: string): Promise<CalibrationAlertSettingsResponse> {
    const cacheKey = this.calibrationCacheKey(site);

    const alertDays = await this.cacheService.getOrSet<number[]>(
      cacheKey,
      async () => {
        const value = await this.getSettingValue('calibration', 'alertDays', site);
        return Array.isArray(value) ? (value as number[]) : DEFAULT_CALIBRATION_ALERT_DAYS;
      },
      SETTINGS_CACHE_TTL
    );

    return { alertDays };
  }

  async updateCalibrationAlertDays(
    alertDays: number[],
    updatedBy: string,
    site?: string
  ): Promise<CalibrationAlertSettingsResponse> {
    const sorted = [...alertDays].sort((a, b) => b - a);
    await this.setSettingValue('calibration', 'alertDays', sorted, updatedBy, site);
    await this.cacheInvalidationHelper.invalidateSettings();
    return { alertDays: sorted };
  }

  // ─── System Settings ───

  async getSystemSettings(): Promise<SystemSettings> {
    return this.cacheService.getOrSet<SystemSettings>(
      this.systemCacheKey(),
      async () => {
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
      },
      SETTINGS_CACHE_TTL
    );
  }

  async updateSystemSettings(
    settings: Partial<SystemSettings>,
    updatedBy: string
  ): Promise<SystemSettings> {
    await this.db.transaction(async (tx) => {
      for (const [key, value] of Object.entries(settings)) {
        if (value !== undefined) {
          await this.setSettingValue('system', key, value, updatedBy, undefined, tx);
        }
      }
    });
    await this.cacheInvalidationHelper.invalidateSettings();
    return this.getSystemSettings();
  }
}
