import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Internal API Key Guard with Dual-Key Rotation Support
 *
 * 서비스 간 통신(예: NextAuth → NestJS)을 인증하는 Guard입니다.
 * 무중단 키 로테이션을 위해 이중 키를 지원합니다.
 *
 * 환경변수:
 * - INTERNAL_API_KEY: 현재 유효한 키
 * - INTERNAL_API_KEY_PREVIOUS: 로테이션 중인 이전 키 (선택적)
 *
 * 키 로테이션 절차:
 * 1. 새 키 생성
 * 2. INTERNAL_API_KEY를 새 키로 교체
 * 3. 이전 키를 INTERNAL_API_KEY_PREVIOUS로 설정
 * 4. 모든 클라이언트가 새 키로 전환된 후 PREVIOUS 제거
 *
 * 헤더 형식:
 * X-Internal-Api-Key: <api-key>
 */
@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  private readonly validKeys: string[];

  constructor(private readonly configService: ConfigService) {
    // 이중 키 로드 (null/undefined 필터링)
    this.validKeys = [
      this.configService.get<string>('INTERNAL_API_KEY'),
      this.configService.get<string>('INTERNAL_API_KEY_PREVIOUS'),
    ].filter((key): key is string => Boolean(key));

    if (this.validKeys.length === 0) {
      throw new Error('INTERNAL_API_KEY must be set in environment variables');
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-internal-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('Missing X-Internal-Api-Key header');
    }

    if (!this.validKeys.includes(apiKey as string)) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
