import { pgTable, uuid, timestamp, varchar, json, integer, index } from 'drizzle-orm/pg-core';

/**
 * CSP Violation Reports (UL-QP 외부 — 보안 모니터링)
 *
 * 브라우저가 Content-Security-Policy + Report-To 헤더에 따라 POST하는 위반 리포트.
 * Legacy (csp-report 객체) + Reporting API (csp-violation 배열) 두 shape 수용.
 *
 * 운영 가이드:
 * - 높은 빈도 directive는 CSP 재검토 (정당한 inline → nonce, 3rd-party → 허용)
 * - 90일 경과 row는 배치 삭제 권장 (후속 cron — docs/operations/csp-reports-retention.md)
 */
export const cspReports = pgTable(
  'csp_reports',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    receivedAt: timestamp('received_at').defaultNow().notNull(),

    // 두 payload shape에서 공통 추출된 정규화 필드
    reportShape: varchar('report_shape', { length: 20 }).notNull(), // 'legacy' | 'reporting-api' | 'unknown'
    blockedUri: varchar('blocked_uri', { length: 2000 }),
    violatedDirective: varchar('violated_directive', { length: 200 }),
    documentUri: varchar('document_uri', { length: 2000 }),
    sourceFile: varchar('source_file', { length: 2000 }),
    lineNumber: integer('line_number'),

    // 원본 payload (감사·재분석용)
    rawPayload: json('raw_payload').notNull(),

    // 요청 메타데이터
    userAgent: varchar('user_agent', { length: 500 }),
    ipAddress: varchar('ip_address', { length: 50 }),
  },
  (table) => ({
    receivedAtIdx: index('csp_reports_received_at_idx').on(table.receivedAt),
    directiveIdx: index('csp_reports_violated_directive_idx').on(table.violatedDirective),
    // 집계용: directive별 시계열 COUNT
    directiveReceivedAtIdx: index('csp_reports_directive_received_at_idx').on(
      table.violatedDirective,
      table.receivedAt
    ),
  })
);

export type CspReport = typeof cspReports.$inferSelect;
export type NewCspReport = typeof cspReports.$inferInsert;
