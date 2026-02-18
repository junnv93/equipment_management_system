import { Global, Module } from '@nestjs/common';
import { I18nService } from './i18n.service';

/**
 * 글로벌 i18n 모듈
 *
 * @Global() 선언으로 다른 모듈에서 imports 없이 I18nService 주입 가능
 */
@Global()
@Module({
  providers: [I18nService],
  exports: [I18nService],
})
export class I18nModule {}
