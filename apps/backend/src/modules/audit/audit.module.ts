import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { DrizzleModule } from '../../database/drizzle.module';

/**
 * 감사 로그 모듈
 *
 * - 전역 모듈로 설정하여 모든 모듈에서 AuditService 사용 가능
 * - AuditInterceptor를 전역 인터셉터로 등록
 * - @AuditLog() 데코레이터가 적용된 엔드포인트만 로그 기록
 */
@Global()
@Module({
  imports: [DrizzleModule],
  controllers: [AuditController],
  providers: [
    AuditService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditService],
})
export class AuditModule {}
