'use client';

import { useTranslations } from 'next-intl';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { createAuditLabelFns } from '@/lib/utils/audit-label-utils';
import { type AuditLog, type AuditLogFilter } from '@equipment-management/schemas';

interface PrintableAuditReportProps {
  logs: AuditLog[];
  title?: string;
  filters?: AuditLogFilter;
  generatedBy?: string;
}

/**
 * 인쇄 가능한 감사 로그 보고서
 *
 * @media print CSS로 인쇄 시에만 표시됩니다.
 * - 품질 심사 증적 자료용
 * - 페이지 나누기, 헤더/푸터 포함
 * - 색상 보존 (print-color-adjust: exact)
 *
 * @example
 * ```tsx
 * <PrintableAuditReport
 *   logs={filteredLogs}
 *   title="2025년 교정 승인 이력"
 *   filters={{ entityType: 'calibration', action: 'approve' }}
 *   generatedBy="홍석환"
 * />
 * ```
 */
export function PrintableAuditReport({
  logs,
  title,
  filters,
  generatedBy,
}: PrintableAuditReportProps) {
  const tAudit = useTranslations('audit');
  const tCommon = useTranslations('common');
  const { fmtDateTime } = useDateFormatter();
  const { getActionLabel, getEntityTypeLabel } = createAuditLabelFns(tAudit);

  /**
   * 필터 정보 포맷팅
   */
  const formatFilters = (f: AuditLogFilter): string => {
    const parts: string[] = [];
    if (f.entityType) parts.push(`대상=${getEntityTypeLabel(f.entityType)}`);
    if (f.action) parts.push(`액션=${getActionLabel(f.action)}`);
    if (f.userId) parts.push(`사용자=${f.userId}`);
    if (f.startDate) parts.push(`시작일=${f.startDate}`);
    if (f.endDate) parts.push(`종료일=${f.endDate}`);
    return parts.length > 0 ? parts.join(', ') : '전체';
  };

  /**
   * 변경 사항 요약
   */
  const renderChangesSummary = (log: AuditLog): string => {
    if (!log.details) return '-';

    const { previousValue, newValue } = log.details;
    if (!previousValue || !newValue) return '-';

    const changedFields = Object.keys(newValue).filter(
      (key) => JSON.stringify(previousValue[key]) !== JSON.stringify(newValue[key])
    );

    if (changedFields.length === 0) return tAudit('report.noChanges');
    return tAudit('report.fieldsChanged', { count: changedFields.length });
  };

  return (
    <div className="print:block hidden">
      {/* 헤더 */}
      <div className="print:mb-8">
        <h1 className="text-3xl font-bold mb-2">{tAudit('report.title')}</h1>
        {title && <h2 className="text-xl text-muted-foreground mb-4">{title}</h2>}
        <div className="mt-4 text-sm text-muted-foreground space-y-1">
          <p>
            {tAudit('report.printedAt')}: {fmtDateTime(new Date())}
          </p>
          {generatedBy && (
            <p>
              {tAudit('report.printedBy')}: {generatedBy}
            </p>
          )}
          {filters && (
            <p>
              {tAudit('filter')}: {formatFilters(filters)}
            </p>
          )}
        </div>
        <hr className="mt-4 mb-6 border-border" />
      </div>

      {/* 로그 목록 */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-foreground">
            <th className="text-left p-3 font-semibold">{tAudit('table.time')}</th>
            <th className="text-left p-3 font-semibold">{tAudit('table.user')}</th>
            <th className="text-left p-3 font-semibold">{tAudit('table.action')}</th>
            <th className="text-left p-3 font-semibold">{tAudit('table.target')}</th>
            <th className="text-left p-3 font-semibold">{tAudit('table.changes')}</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr
              key={log.id}
              className={`border-b border-border print:break-inside-avoid ${index % 2 === 0 ? 'bg-muted' : ''}`}
            >
              <td className="p-3 align-top">
                <div className="font-mono text-xs whitespace-nowrap">
                  {fmtDateTime(log.timestamp)}
                </div>
              </td>
              <td className="p-3 align-top">
                <div className="font-medium">{log.userName}</div>
                <div className="text-xs text-muted-foreground">
                  {tCommon(`userRoles.${log.userRole}` as Parameters<typeof tCommon>[0])}
                </div>
              </td>
              <td className="p-3 align-top">
                <div className="inline-block px-2 py-1 rounded bg-muted text-foreground">
                  {getActionLabel(log.action)}
                </div>
              </td>
              <td className="p-3 align-top">
                <div className="font-medium truncate max-w-[200px]">
                  {log.entityName || (
                    <span className="text-muted-foreground text-xs">
                      {getEntityTypeLabel(log.entityType)} ({log.entityId.substring(0, 8)}...)
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {getEntityTypeLabel(log.entityType)}
                </div>
              </td>
              <td className="p-3 align-top">
                <div className="text-xs">{renderChangesSummary(log)}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 푸터 */}
      <div className="print:mt-8 text-xs text-muted-foreground space-y-1">
        <p>{tAudit('totalLogs', { count: logs.length })}</p>
        <p>{tAudit('report.footerNote')}</p>
        <p>UL Solutions - Equipment Management System</p>
      </div>
    </div>
  );
}
