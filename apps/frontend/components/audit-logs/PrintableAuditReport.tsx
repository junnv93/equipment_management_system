'use client';

import { useDateFormatter } from '@/hooks/use-date-formatter';
import {
  type AuditLog,
  type AuditLogFilter,
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_TYPE_LABELS,
  type AuditAction,
  type AuditEntityType,
} from '@equipment-management/schemas';
import { USER_ROLE_LABELS, type UserRole } from '@equipment-management/shared-constants';

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
 * **i18n 미적용 의도적 예외**:
 * 이 컴포넌트의 한국어 하드코딩은 의도된 설계 결정입니다.
 * UL-QP-18 품질 심사 증적 자료는 한국어 고정 규정 문서이며,
 * 인쇄 전용 출력물로 다국어 지원이 불필요합니다.
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
  title = '감사 로그 보고서',
  filters,
  generatedBy,
}: PrintableAuditReportProps) {
  const { fmtDateTime } = useDateFormatter();

  /**
   * 필터 정보 포맷팅
   */
  const formatFilters = (f: AuditLogFilter): string => {
    const parts: string[] = [];
    if (f.entityType)
      parts.push(
        `대상=${AUDIT_ENTITY_TYPE_LABELS[f.entityType as AuditEntityType] || f.entityType}`
      );
    if (f.action) parts.push(`액션=${AUDIT_ACTION_LABELS[f.action as AuditAction] || f.action}`);
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

    if (changedFields.length === 0) return '변경 없음';
    return `${changedFields.length}개 필드 변경`;
  };

  return (
    <div className="print:block hidden">
      {/* 헤더 */}
      <div className="print:mb-8">
        <h1 className="text-3xl font-bold mb-2">감사 로그 보고서</h1>
        {title && <h2 className="text-xl text-muted-foreground mb-4">{title}</h2>}
        <div className="mt-4 text-sm text-muted-foreground space-y-1">
          <p>출력 일시: {fmtDateTime(new Date())}</p>
          {generatedBy && <p>출력자: {generatedBy}</p>}
          {filters && <p>필터: {formatFilters(filters)}</p>}
        </div>
        <hr className="mt-4 mb-6 border-border" />
      </div>

      {/* 로그 목록 */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-foreground">
            <th className="text-left p-3 font-semibold">시간</th>
            <th className="text-left p-3 font-semibold">사용자</th>
            <th className="text-left p-3 font-semibold">액션</th>
            <th className="text-left p-3 font-semibold">대상</th>
            <th className="text-left p-3 font-semibold">변경 사항</th>
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
                  {USER_ROLE_LABELS[log.userRole as UserRole] || log.userRole}
                </div>
              </td>
              <td className="p-3 align-top">
                <div className="inline-block px-2 py-1 rounded bg-muted text-foreground">
                  {AUDIT_ACTION_LABELS[log.action as AuditAction] || log.action}
                </div>
              </td>
              <td className="p-3 align-top">
                <div className="font-medium truncate max-w-[200px]">
                  {log.entityName || (
                    <span className="text-muted-foreground text-xs">
                      {AUDIT_ENTITY_TYPE_LABELS[log.entityType as AuditEntityType] ||
                        log.entityType}{' '}
                      ({log.entityId.substring(0, 8)}...)
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {AUDIT_ENTITY_TYPE_LABELS[log.entityType as AuditEntityType] || log.entityType}
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
        <p>총 {logs.length.toLocaleString()}개의 로그</p>
        <p>본 문서는 품질 관리 시스템의 공식 감사 기록입니다.</p>
        <p>UL Solutions - Equipment Management System</p>
      </div>
    </div>
  );
}
