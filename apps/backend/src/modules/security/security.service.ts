import { Injectable, Inject, Logger } from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { cspReports } from '@equipment-management/db/schema';

export interface NormalizedCspReport {
  reportShape: 'legacy' | 'reporting-api' | 'unknown';
  blockedUri?: string;
  violatedDirective?: string;
  documentUri?: string;
  sourceFile?: string;
  lineNumber?: string;
  rawPayload: unknown;
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(@Inject('DRIZZLE_INSTANCE') private readonly db: AppDatabase) {}

  async saveReport(report: NormalizedCspReport): Promise<void> {
    try {
      await this.db.insert(cspReports).values({
        reportShape: report.reportShape,
        blockedUri: report.blockedUri,
        violatedDirective: report.violatedDirective,
        documentUri: report.documentUri,
        sourceFile: report.sourceFile,
        lineNumber: report.lineNumber,
        rawPayload: report.rawPayload,
        userAgent: report.userAgent,
        ipAddress: report.ipAddress,
      });
    } catch (err) {
      // throw 금지 — CSP 엔드포인트 실패가 브라우저로 전파되면 안 됨
      this.logger.error('CSP report persistence failed', err);
    }
  }
}
