import { Module } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { DrizzleModule } from '../../database/drizzle.module';

/**
 * Security 모듈 — CSP violation 수집 등 브라우저 보안 리포팅 엔드포인트를 담당.
 */
@Module({
  imports: [DrizzleModule],
  controllers: [SecurityController],
  providers: [SecurityService],
})
export class SecurityModule {}
