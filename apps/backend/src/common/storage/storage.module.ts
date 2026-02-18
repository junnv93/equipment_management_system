import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';
import { STORAGE_PROVIDER } from './storage.interface';

/**
 * 파일 스토리지 모듈
 *
 * STORAGE_DRIVER 환경변수에 따라 구현체를 선택합니다.
 *   local (기본) → LocalStorageProvider (로컬 파일시스템)
 *   s3           → S3StorageProvider   (RustFS / MinIO / AWS S3)
 *
 * @Global() 선언으로 모든 모듈에서 별도 import 없이 STORAGE_PROVIDER를 주입받을 수 있습니다.
 * CacheModule과 동일한 패턴을 따릅니다.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    LocalStorageProvider,
    S3StorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (
        configService: ConfigService,
        local: LocalStorageProvider,
        s3: S3StorageProvider
      ): LocalStorageProvider | S3StorageProvider => {
        const driver = configService.get<string>('STORAGE_DRIVER');
        if (driver === 's3') {
          return s3;
        }
        return local;
      },
      inject: [ConfigService, LocalStorageProvider, S3StorageProvider],
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
