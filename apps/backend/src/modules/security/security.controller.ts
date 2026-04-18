import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { SkipResponseTransform } from '../../common/interceptors/response-transform.interceptor';
import { THROTTLE_PRESETS, throttleAllNamed } from '../../common/config/throttle.constants';

/**
 * CSP violation report — `Content-Security-Policy` + `Report-To` 헤더의 수집 엔드포인트.
 *
 * 설계:
 * - **SSOT**: 경로는 `API_ENDPOINTS.SECURITY.CSP_REPORT`(shared-constants)이 단일 소스.
 *           proxy.ts의 report-uri/Report-To가 이 상수를 참조.
 * - **Public**: CSP violation은 브라우저가 인증 없이 POST하므로 `@Public()` 필수.
 * - **Throttled**: 악의적 flood 방지 (분당 10/IP). `@Throttle` 데코레이터로 guard 통과.
 * - **Schema flexible**: 브라우저 구현별 payload 차이(`csp-report` 구 스펙 vs Reporting API 신 스펙)
 *   를 모두 수용 — 로깅만 하고 validator 생략.
 * - **Structured logging**: 위반 블록된 URI/directive/document를 구조적 필드로 남겨
 *   Grafana/Loki 집계 가능.
 *
 * 운영:
 * - Grafana에 "CSP violations by directive" 대시보드 추가 권장.
 * - 높은 빈도 위반 → 원인 조사(정당한 inline 스크립트면 nonce 적용, 3rd-party면 CSP 확장).
 */
@Controller('security')
export class SecurityController {
  private readonly logger = new Logger('CspReport');

  @Post('csp-report')
  @Public()
  @Throttle(throttleAllNamed(THROTTLE_PRESETS.CSP_REPORT))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiExcludeEndpoint()
  @SkipResponseTransform()
  handleReport(@Body() body: unknown): void {
    // 브라우저 payload 형태 2종 지원:
    //   1) Legacy `report-uri`: { "csp-report": { "blocked-uri": ..., "violated-directive": ... } }
    //   2) Reporting API `report-to`: [ { type: "csp-violation", body: { blockedURL, effectiveDirective, ... } }, ... ]
    const reports = Array.isArray(body) ? body : [body];

    for (const entry of reports) {
      const legacy = (entry as { 'csp-report'?: Record<string, unknown> })['csp-report'];
      const modern = entry as { type?: string; body?: Record<string, unknown> };

      if (legacy) {
        this.logger.warn('CSP violation (legacy)', {
          blockedUri: legacy['blocked-uri'],
          violatedDirective: legacy['violated-directive'],
          documentUri: legacy['document-uri'],
          sourceFile: legacy['source-file'],
          lineNumber: legacy['line-number'],
        });
        continue;
      }

      if (modern?.type === 'csp-violation' && modern.body) {
        this.logger.warn('CSP violation (reporting-api)', {
          blockedUrl: modern.body.blockedURL,
          effectiveDirective: modern.body.effectiveDirective,
          documentUrl: modern.body.documentURL,
          sourceFile: modern.body.sourceFile,
          lineNumber: modern.body.lineNumber,
        });
        continue;
      }

      // 알 수 없는 형식 — 원본을 최소 로깅
      this.logger.warn('CSP violation (unknown shape)', { entry });
    }
  }
}
