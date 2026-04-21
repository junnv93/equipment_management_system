export interface NormalizedCspReport {
  reportShape: 'legacy' | 'reporting-api' | 'unknown';
  blockedUri?: string;
  violatedDirective?: string;
  documentUri?: string;
  sourceFile?: string;
  lineNumber?: number;
  rawPayload: unknown;
  userAgent?: string;
  ipAddress?: string;
}
