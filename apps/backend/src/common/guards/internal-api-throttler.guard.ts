import { ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerStorage,
  getOptionsToken,
  getStorageToken,
} from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

/** Timing-safe 문자열 비교 (타이밍 사이드채널 방어) */
function safeTimingCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Internal API Throttler Guard
 *
 * ThrottlerGuard를 확장하여 신뢰된 내부 서비스 요청(Next.js SSR)의 throttle을 bypass합니다.
 *
 * 동작 원리:
 * - X-Internal-Api-Key 헤더가 유효한 INTERNAL_API_KEY 값이면 → throttle 완전 bypass
 * - 헤더가 없거나 유효하지 않으면 → 기존 ThrottlerGuard 동작 그대로
 *
 * 사용 사례:
 * - Next.js 서버 컴포넌트의 SSR 요청: 동일 IP에서 병렬 요청이 발생해도 429 없음
 * - 브라우저 클라이언트 요청: 기존과 동일하게 IP 기반 throttle 적용
 *
 * 보안:
 * - INTERNAL_API_KEY는 32자 이상의 랜덤 값 (env.validation.ts 검증)
 * - 이중 키 로테이션 지원 (INTERNAL_API_KEY_PREVIOUS)
 * - 브라우저에서 이 헤더를 위조해도 키를 모르면 bypass 불가
 */
@Injectable()
export class InternalApiThrottlerGuard extends ThrottlerGuard {
  private readonly validInternalKeys: string[];

  constructor(
    @Inject(getOptionsToken()) options: ThrottlerModuleOptions,
    @Inject(getStorageToken()) storageService: ThrottlerStorage,
    reflector: Reflector,
    configService: ConfigService
  ) {
    super(options, storageService, reflector);

    // 생성 시 한 번만 로드 (요청마다 ConfigService 조회 방지)
    this.validInternalKeys = [
      configService.get<string>('INTERNAL_API_KEY'),
      configService.get<string>('INTERNAL_API_KEY_PREVIOUS'),
    ].filter((key): key is string => Boolean(key));
  }

  protected override async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const { req } = this.getRequestResponse(context);
    const apiKey = req.headers['x-internal-api-key'] as string | undefined;

    // 유효한 내부 API 키 → throttle 완전 bypass (timing-safe 비교)
    if (apiKey && this.validInternalKeys.some((key) => safeTimingCompare(key, apiKey))) {
      return true;
    }

    // 기본 동작 유지 (@SkipThrottle() 데코레이터 등)
    return super.shouldSkip(context);
  }
}
