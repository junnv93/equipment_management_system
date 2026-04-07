import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  type SupportedLocale,
} from '@equipment-management/schemas';

/**
 * 경량 i18n 서비스 (nestjs-i18n 의존성 없이 자체 구현)
 *
 * 전략: 에러 코드 기반 (Code-First)
 * - 백엔드는 영문 메시지 + 에러 코드 반환
 * - 프론트엔드 mapBackendErrorCode()가 로케일별 메시지 표시
 *
 * 사용처:
 * - GlobalExceptionFilter: Accept-Language 기반 로케일 선택
 * - 알림 서비스: 수신자 locale 기반 이메일 본문 생성
 */
@Injectable()
export class I18nService implements OnModuleInit {
  private readonly logger = new Logger(I18nService.name);
  private readonly messages: Partial<Record<SupportedLocale, Record<string, string>>> = {};

  onModuleInit(): void {
    for (const locale of SUPPORTED_LOCALES) {
      try {
        const filePath = join(__dirname, 'messages', `${locale}.json`);
        const raw = readFileSync(filePath, 'utf-8');
        this.messages[locale] = JSON.parse(raw) as Record<string, string>;
        this.logger.log(
          `i18n loaded: ${locale} (${Object.keys(this.messages[locale]!).length} keys)`
        );
      } catch (_error) {
        this.logger.warn(
          `i18n messages not found for locale "${locale}" at ${join(__dirname, 'messages', `${locale}.json`)}. ` +
            `Ensure nest-cli.json assets includes "common/i18n/messages/*.json".`
        );
      }
    }
  }

  /**
   * 메시지가 로딩되었는지 확인
   * onModuleInit 순서가 보장되지 않을 때 호출자가 먼저 로딩 보장에 사용
   */
  ensureLoaded(): void {
    if (Object.keys(this.messages).length === 0) {
      this.onModuleInit();
    }
  }

  /**
   * 키와 로케일로 번역 문자열 조회
   * 폴백 순서: 요청 로케일 → 영어 → 키 자체 반환
   */
  t(key: string, locale: SupportedLocale, params?: Record<string, string>): string {
    // onModuleInit 순서 미보장 시 lazy loading
    if (Object.keys(this.messages).length === 0) {
      this.ensureLoaded();
    }

    const template = this.messages[locale]?.[key] ?? this.messages['en']?.[key] ?? key;

    return params ? this.interpolate(template, params) : template;
  }

  /**
   * HTTP 요청에서 로케일 추출
   * Accept-Language: ko → 'ko', Accept-Language: en → 'en', 기본: 'ko'
   */
  getLocaleFromAcceptLanguage(acceptLanguage: string | undefined): SupportedLocale {
    if (!acceptLanguage) return DEFAULT_LOCALE;

    for (const locale of SUPPORTED_LOCALES) {
      if (acceptLanguage.toLowerCase().includes(locale)) {
        return locale;
      }
    }

    return DEFAULT_LOCALE;
  }

  private interpolate(template: string, params: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (_, key: string) => params[key] ?? `{${key}}`);
  }
}
