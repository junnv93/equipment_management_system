'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { AUDIT_DIFF_TOKENS } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

/**
 * 값 포맷팅 유틸리티
 */
function formatValue(
  value: unknown,
  boolLabels?: { trueLabel: string; falseLabel: string }
): string {
  // null, undefined
  if (value === null || value === undefined) {
    return '-';
  }

  // boolean
  if (typeof value === 'boolean') {
    return value ? (boolLabels?.trueLabel ?? 'Yes') : (boolLabels?.falseLabel ?? 'No');
  }

  // 날짜 (ISO 8601 문자열 or Date 객체)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return format(date, 'yyyy-MM-dd HH:mm:ss');
      }
    } catch {
      // 날짜 파싱 실패 시 원본 반환
    }
  }

  // 객체/배열 → JSON 문자열
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2);
  }

  // 문자열/숫자
  return String(value);
}

/**
 * 두 값이 다른지 비교
 */
function isDifferent(prev: unknown, next: unknown): boolean {
  // 객체/배열은 JSON 직렬화로 비교
  if (typeof prev === 'object' || typeof next === 'object') {
    return JSON.stringify(prev) !== JSON.stringify(next);
  }
  return prev !== next;
}

interface AuditLogDiffViewerProps {
  previousValue: Record<string, unknown>;
  newValue: Record<string, unknown>;
  entityType: string;
  className?: string;
}

/**
 * 감사 로그 Diff Viewer 컴포넌트
 *
 * 변경 전후 값을 필드별로 비교하여 테이블 형식으로 표시합니다.
 * - 필드명 자동 변환 (audit.fieldLabels SSOT 사용)
 * - 값 포맷팅 (날짜, boolean, 객체 등)
 * - 변경된 필드만 표시 (previousValue ≠ newValue)
 *
 * @example
 * ```tsx
 * <AuditLogDiffViewer
 *   previousValue={{ status: 'available', location: '수원랩' }}
 *   newValue={{ status: 'checked_out', location: '의왕랩' }}
 *   entityType="equipment"
 * />
 * ```
 */
export function AuditLogDiffViewer({
  previousValue,
  newValue,
  entityType,
  className,
}: AuditLogDiffViewerProps) {
  const t = useTranslations('common');
  const tAudit = useTranslations('audit');
  const boolLabels = { trueLabel: t('diffViewer.boolTrue'), falseLabel: t('diffViewer.boolFalse') };

  // audit.fieldLabels = 전체 엔티티 필드 라벨의 SSOT
  const fieldLabelsMap = tAudit.raw('fieldLabels') as Record<string, Record<string, string>>;
  const resolveFieldLabel = (et: string, field: string): string => {
    return fieldLabelsMap?.[et]?.[field] ?? field;
  };

  // 변경된 필드만 추출
  const allKeys = new Set([...Object.keys(previousValue || {}), ...Object.keys(newValue || {})]);
  const changedFields = Array.from(allKeys).filter((key) => {
    const prev = previousValue?.[key];
    const next = newValue?.[key];
    return isDifferent(prev, next);
  });

  // 변경 사항이 없으면 Empty state
  if (changedFields.length === 0) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${className || ''}`}>
        <p>{t('diffViewer.empty')}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-md border overflow-x-auto ${className || ''}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">{t('diffViewer.field')}</TableHead>
            <TableHead className="w-[40%]">{t('diffViewer.before')}</TableHead>
            <TableHead className="w-[40%]">{t('diffViewer.after')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {changedFields.map((field) => {
            const prev = previousValue?.[field];
            const next = newValue?.[field];

            return (
              <TableRow key={field}>
                <TableCell className="font-medium">
                  <Badge variant="outline">{resolveFieldLabel(entityType, field)}</Badge>
                </TableCell>
                <TableCell className={AUDIT_DIFF_TOKENS.removed}>
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {formatValue(prev, boolLabels)}
                  </pre>
                </TableCell>
                <TableCell className={AUDIT_DIFF_TOKENS.added}>
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {formatValue(next, boolLabels)}
                  </pre>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
