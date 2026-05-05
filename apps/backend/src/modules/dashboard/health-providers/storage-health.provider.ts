import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { sql } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { MonitoringService } from '../../monitoring/monitoring.service';
import type { StorageHealthProvider, StorageHealthSnapshot } from './types';

/**
 * Storage 메트릭 우선순위:
 *
 *  1. `DASHBOARD_STORAGE_CAPACITY_BYTES` env 가 명시 설정 (number) → `configured-capacity`
 *     - storagePct = pg_database_size / capacity
 *  2. monitoring 서비스의 host disk (`df` 결과) 가 측정 가능 → `host-disk`
 *     - storagePct = diskUsed / diskTotal
 *  3. 둘 다 실패 → `pg-database`
 *     - storagePct = null (frontend 는 backend 식별로 "측정 불가" 분기 가능)
 *     - dbSizeBytes 만 admin 진단용으로 노출
 *
 * `pg_database_size` 호출은 본 파일에서만 수행 (SSOT). 다른 모듈은 호출 금지.
 */
@Injectable()
export class StorageHealthProviderImpl implements StorageHealthProvider {
  private readonly logger = new Logger(StorageHealthProviderImpl.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly monitoringService: MonitoringService,
    @Inject('DRIZZLE_INSTANCE') private readonly db: AppDatabase
  ) {}

  async read(): Promise<StorageHealthSnapshot> {
    const dbSizeBytes = await this.queryDbSizeBytes();

    // 우선순위 1: env 명시 override
    const configuredCapacity = this.configService.get<number | undefined>(
      'DASHBOARD_STORAGE_CAPACITY_BYTES'
    );
    if (typeof configuredCapacity === 'number' && configuredCapacity > 0) {
      const storagePct = Math.min(Math.round((dbSizeBytes / configuredCapacity) * 100), 100);
      return {
        dbSizeBytes,
        diskUsedBytes: null,
        diskTotalBytes: null,
        storagePct,
        backend: 'configured-capacity',
      };
    }

    // 우선순위 2: monitoring df 측정값
    const hostDisk = this.readHostDiskMetrics();
    if (hostDisk !== null) {
      const storagePct = Math.min(Math.round((hostDisk.used / hostDisk.total) * 100), 100);
      return {
        dbSizeBytes,
        diskUsedBytes: hostDisk.used,
        diskTotalBytes: hostDisk.total,
        storagePct,
        backend: 'host-disk',
      };
    }

    // 우선순위 3: pg-database fallback (storagePct 측정 불가)
    return {
      dbSizeBytes,
      diskUsedBytes: null,
      diskTotalBytes: null,
      storagePct: null,
      backend: 'pg-database',
    };
  }

  private async queryDbSizeBytes(): Promise<number> {
    try {
      const result = await this.db.execute<{ size: string }>(
        sql`SELECT pg_database_size(current_database()) AS size`
      );
      return Number(result.rows?.[0]?.size ?? 0);
    } catch (error) {
      this.logger.warn(
        `pg_database_size query failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return 0;
    }
  }

  /**
   * MonitoringService 의 storage 메트릭 reading.
   * `diskTotal === 0` 은 df 측정 실패 (Windows 등) 를 의미 — null 반환하여 fallback 진입.
   */
  private readHostDiskMetrics(): { used: number; total: number } | null {
    try {
      const metrics = this.monitoringService.getSystemMetrics();
      const { diskUsage, diskTotal } = metrics.storage;
      if (diskTotal > 0) {
        return { used: diskUsage, total: diskTotal };
      }
      return null;
    } catch (error) {
      this.logger.warn(
        `MonitoringService.getSystemMetrics failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }
}
