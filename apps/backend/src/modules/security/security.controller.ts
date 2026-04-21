import { Body, Controller, HttpCode, HttpStatus, Logger, Post, Req } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public } from '../auth/decorators/public.decorator';
import { SkipResponseTransform } from '../../common/interceptors/response-transform.interceptor';
import { THROTTLE_PRESETS, throttleAllNamed } from '../../common/config/throttle.constants';
import { SecurityService } from './security.service';
import type { NormalizedCspReport } from './security.types';

// PostgreSQL INTEGER 상한 — packages/db/src/schema/csp-reports.ts의 integer('line_number')와 짝
const PG_INT_MAX = 2_147_483_647;

function parseCspLineNumber(raw: unknown): number | undefined {
  if (typeof raw === 'number')
    return Number.isFinite(raw) ? Math.min(Math.trunc(raw), PG_INT_MAX) : undefined;
  if (typeof raw === 'string' && /^\d+$/.test(raw)) return Math.min(parseInt(raw, 10), PG_INT_MAX);
  return undefined;
}

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

  constructor(private readonly securityService: SecurityService) {}

  @Post('csp-report')
  @Public()
  @Throttle(throttleAllNamed(THROTTLE_PRESETS.CSP_REPORT))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiExcludeEndpoint()
  @SkipResponseTransform()
  handleReport(@Body() body: unknown, @Req() req: Request): void {
    const userAgent = req.headers['user-agent'];
    const ipAddress =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      req.socket.remoteAddress;

    // 브라우저 payload 형태 2종 지원:
    //   1) Legacy `report-uri`: { "csp-report": { "blocked-uri": ..., "violated-directive": ... } }
    //   2) Reporting API `report-to`: [ { type: "csp-violation", body: { blockedURL, effectiveDirective, ... } }, ... ]
    const entries = Array.isArray(body) ? body : [body];

    for (const entry of entries) {
      const legacy = (entry as { 'csp-report'?: Record<string, unknown> })['csp-report'];
      const modern = entry as { type?: string; body?: Record<string, unknown> };

      if (legacy) {
        const rawLine = legacy['line-number'];
        const normalized: NormalizedCspReport = {
          reportShape: 'legacy',
          blockedUri: legacy['blocked-uri'] as string | undefined,
          violatedDirective: legacy['violated-directive'] as string | undefined,
          documentUri: legacy['document-uri'] as string | undefined,
          sourceFile: legacy['source-file'] as string | undefined,
          lineNumber: parseCspLineNumber(rawLine),
          rawPayload: entry,
          userAgent,
          ipAddress,
        };
        this.logger.warn('CSP violation (legacy)', {
          blockedUri: normalized.blockedUri,
          violatedDirective: normalized.violatedDirective,
        });
        void this.securityService.saveReport(normalized);
        continue;
      }

      if (modern?.type === 'csp-violation' && modern.body) {
        const rawLine = modern.body.lineNumber;
        const normalized: NormalizedCspReport = {
          reportShape: 'reporting-api',
          blockedUri: modern.body.blockedURL as string | undefined,
          violatedDirective: modern.body.effectiveDirective as string | undefined,
          documentUri: modern.body.documentURL as string | undefined,
          sourceFile: modern.body.sourceFile as string | undefined,
          lineNumber: parseCspLineNumber(rawLine),
          rawPayload: entry,
          userAgent,
          ipAddress,
        };
        this.logger.warn('CSP violation (reporting-api)', {
          blockedUri: normalized.blockedUri,
          violatedDirective: normalized.violatedDirective,
        });
        void this.securityService.saveReport(normalized);
        continue;
      }

      this.logger.warn('CSP violation (unknown shape)', { entry });
      void this.securityService.saveReport({
        reportShape: 'unknown',
        rawPayload: entry,
        userAgent,
        ipAddress,
      });
    }
  }
}
