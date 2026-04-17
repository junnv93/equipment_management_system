import { Module } from '@nestjs/common';
import { SecurityController } from './security.controller';

/**
 * Security 모듈 — CSP violation 수집 등 브라우저 보안 리포팅 엔드포인트를 담당.
 */
@Module({
  controllers: [SecurityController],
})
export class SecurityModule {}
