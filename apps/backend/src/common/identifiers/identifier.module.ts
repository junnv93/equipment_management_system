import { Global, Module } from '@nestjs/common';
import { IdentifierService } from './identifier.service';

/**
 * Identifier SSOT 전역 모듈.
 *
 * @Global 등록으로 모든 feature 모듈에서 imports 추가 없이
 * IdentifierService를 주입할 수 있다 (FileUploadModule과 동일 패턴).
 */
@Global()
@Module({
  providers: [IdentifierService],
  exports: [IdentifierService],
})
export class IdentifierModule {}
