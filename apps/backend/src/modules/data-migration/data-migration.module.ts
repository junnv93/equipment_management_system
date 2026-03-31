import { Module } from '@nestjs/common';
import { DataMigrationController } from './data-migration.controller';
import { DataMigrationService } from './services/data-migration.service';
import { ExcelParserService } from './services/excel-parser.service';
import { MigrationValidatorService } from './services/migration-validator.service';
import { HistoryValidatorService } from './services/history-validator.service';
import { EquipmentModule } from '../equipment/equipment.module';
import { CacheModule } from '../../common/cache/cache.module';

/**
 * 데이터 마이그레이션 모듈
 *
 * Excel(.xlsx) → DB 일괄 장비 등록 기능 제공.
 * Preview(dry-run) → Execute(commit) 2단계 워크플로우.
 *
 * 의존성:
 * - EquipmentModule: EquipmentHistoryService (location history SSOT) + CacheInvalidationHelper
 * - CacheModule: SimpleCacheService (세션 캐시)
 * - FileUploadModule: @Global() — 자동 주입
 * - DrizzleModule: @Global() — 자동 주입
 */
@Module({
  imports: [EquipmentModule, CacheModule],
  controllers: [DataMigrationController],
  providers: [
    DataMigrationService,
    ExcelParserService,
    MigrationValidatorService,
    HistoryValidatorService,
  ],
})
export class DataMigrationModule {}
