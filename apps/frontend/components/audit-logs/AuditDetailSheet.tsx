'use client';

import { X, Printer, User, Server, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { EntityLinkCell } from '@/components/ui/entity-link-cell';
import { AuditLogDiffViewer } from '@/components/ui/audit-log-diff-viewer';
import { PrintableAuditReport } from './PrintableAuditReport';
import { formatDateTime, cn } from '@/lib/utils';
import {
  AUDIT_ACTION_BADGE_TOKENS,
  DEFAULT_AUDIT_ACTION_BADGE,
  AUDIT_DETAIL_SHEET_TOKENS,
  AUDIT_DETAIL_TOKENS,
} from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';
import type { AuditLog, AuditAction } from '@equipment-management/schemas';
import { createAuditLabelFns } from '@/lib/utils/audit-label-utils';
import { USER_ROLE_LABELS, type UserRole } from '@equipment-management/shared-constants';

interface AuditDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null일 때 패널은 닫힌 상태로 유지 (애니메이션 후 컨텐츠 언마운트 방지) */
  log: AuditLog | null;
}

/**
 * 감사 로그 상세 슬라이드 패널
 *
 * Radix Dialog 기반 Sheet 컴포넌트를 사용하여
 * 포커스 트랩, Escape 닫기, 백드롭 클릭, body scroll 잠금을
 * 네이티브로 처리합니다.
 */
export function AuditDetailSheet({ open, onOpenChange, log }: AuditDetailSheetProps) {
  const t = useTranslations('audit');
  const tc = useTranslations('common');
  const { getActionLabel, getEntityTypeLabel } = createAuditLabelFns(t);

  const hasDetails = log?.details && (log.details.previousValue || log.details.newValue);
  const hasAdditionalInfo = log?.details?.additionalInfo;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideClose
        className={AUDIT_DETAIL_SHEET_TOKENS.content}
        aria-describedby={undefined}
      >
        <SheetTitle className="sr-only">{t('detail.title')}</SheetTitle>

        {/* 화면 표시용 */}
        <div className="print:hidden flex flex-col h-full">
          {/* ── 헤더 ── */}
          <div className={AUDIT_DETAIL_SHEET_TOKENS.header}>
            <div className={AUDIT_DETAIL_SHEET_TOKENS.headerTop}>
              <span className={AUDIT_DETAIL_SHEET_TOKENS.headerLabel}>{t('detail.title')}</span>
              <SheetClose
                aria-label={tc('actions.close')}
                className={AUDIT_DETAIL_SHEET_TOKENS.closeBtn}
              >
                <X className="h-3.5 w-3.5" />
              </SheetClose>
            </div>

            {log && (
              <div className={AUDIT_DETAIL_SHEET_TOKENS.actionRow}>
                <Badge
                  className={
                    AUDIT_ACTION_BADGE_TOKENS[log.action as AuditAction] ??
                    DEFAULT_AUDIT_ACTION_BADGE
                  }
                >
                  {getActionLabel(log.action)}
                </Badge>
                <span className={AUDIT_DETAIL_SHEET_TOKENS.timestamp}>
                  {formatDateTime(log.timestamp)}
                </span>
              </div>
            )}
          </div>

          {/* ── 본문 ── */}
          {log && (
            <div className={AUDIT_DETAIL_SHEET_TOKENS.body}>
              {/* 사용자 정보 */}
              <section aria-labelledby="sheet-user-label">
                <p id="sheet-user-label" className={AUDIT_DETAIL_SHEET_TOKENS.sectionLabel}>
                  <User className="inline h-3 w-3 mr-1" aria-hidden="true" />
                  {t('detail.userInfo')}
                </p>
                <div className={AUDIT_DETAIL_SHEET_TOKENS.sectionCard}>
                  <div className={AUDIT_DETAIL_SHEET_TOKENS.row}>
                    <span className={AUDIT_DETAIL_SHEET_TOKENS.rowKey}>{t('detail.userName')}</span>
                    <span className={cn(AUDIT_DETAIL_SHEET_TOKENS.rowVal, 'font-semibold')}>
                      {log.userName}
                    </span>
                  </div>
                  <div
                    className={cn(
                      AUDIT_DETAIL_SHEET_TOKENS.row,
                      AUDIT_DETAIL_SHEET_TOKENS.rowBorder
                    )}
                  >
                    <span className={AUDIT_DETAIL_SHEET_TOKENS.rowKey}>{t('detail.userRole')}</span>
                    <span className={AUDIT_DETAIL_SHEET_TOKENS.rowVal}>
                      <Badge variant="outline" className="text-xs">
                        {USER_ROLE_LABELS[log.userRole as UserRole] ?? log.userRole}
                      </Badge>
                    </span>
                  </div>
                  <div
                    className={cn(
                      AUDIT_DETAIL_SHEET_TOKENS.row,
                      AUDIT_DETAIL_SHEET_TOKENS.rowBorder
                    )}
                  >
                    <span className={AUDIT_DETAIL_SHEET_TOKENS.rowKey}>{t('detail.userId')}</span>
                    <span className={AUDIT_DETAIL_SHEET_TOKENS.rowValMono}>{log.userId}</span>
                  </div>
                  {log.ipAddress && (
                    <div
                      className={cn(
                        AUDIT_DETAIL_SHEET_TOKENS.row,
                        AUDIT_DETAIL_SHEET_TOKENS.rowBorder
                      )}
                    >
                      <span className={AUDIT_DETAIL_SHEET_TOKENS.rowKey}>
                        <MapPin className="inline h-3 w-3 mr-0.5" aria-hidden="true" />
                        {t('detail.ipAddress')}
                      </span>
                      <span className={AUDIT_DETAIL_SHEET_TOKENS.rowValMono}>{log.ipAddress}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* 대상 정보 */}
              <section aria-labelledby="sheet-target-label">
                <p id="sheet-target-label" className={AUDIT_DETAIL_SHEET_TOKENS.sectionLabel}>
                  <Server className="inline h-3 w-3 mr-1" aria-hidden="true" />
                  {t('detail.targetInfo')}
                </p>
                <div className={AUDIT_DETAIL_SHEET_TOKENS.sectionCard}>
                  <div className={AUDIT_DETAIL_SHEET_TOKENS.row}>
                    <span className={AUDIT_DETAIL_SHEET_TOKENS.rowKey}>
                      {t('detail.targetType')}
                    </span>
                    <span className={AUDIT_DETAIL_SHEET_TOKENS.rowVal}>
                      {getEntityTypeLabel(log.entityType)}
                    </span>
                  </div>
                  <div
                    className={cn(
                      AUDIT_DETAIL_SHEET_TOKENS.row,
                      AUDIT_DETAIL_SHEET_TOKENS.rowBorder
                    )}
                  >
                    <span className={AUDIT_DETAIL_SHEET_TOKENS.rowKey}>{t('detail.targetId')}</span>
                    <span className={AUDIT_DETAIL_SHEET_TOKENS.rowValMono}>{log.entityId}</span>
                  </div>
                  <div
                    className={cn(
                      AUDIT_DETAIL_SHEET_TOKENS.row,
                      AUDIT_DETAIL_SHEET_TOKENS.rowBorder
                    )}
                  >
                    <span className={AUDIT_DETAIL_SHEET_TOKENS.rowKey}>
                      {t('detail.targetName')}
                    </span>
                    <span className={AUDIT_DETAIL_SHEET_TOKENS.rowVal}>
                      <EntityLinkCell
                        entityType={log.entityType}
                        entityId={log.entityId}
                        entityName={log.entityName}
                      />
                    </span>
                  </div>
                </div>
              </section>

              {/* 변경 사항 */}
              {hasDetails && (
                <section aria-labelledby="sheet-changes-label">
                  <p id="sheet-changes-label" className={AUDIT_DETAIL_SHEET_TOKENS.sectionLabel}>
                    {t('detail.changes')}
                  </p>
                  <AuditLogDiffViewer
                    previousValue={(log.details!.previousValue as Record<string, unknown>) || {}}
                    newValue={(log.details!.newValue as Record<string, unknown>) || {}}
                    entityType={log.entityType}
                  />
                </section>
              )}

              {/* 추가 정보 */}
              {hasAdditionalInfo && (
                <section aria-labelledby="sheet-additional-label">
                  <p id="sheet-additional-label" className={AUDIT_DETAIL_SHEET_TOKENS.sectionLabel}>
                    {t('detail.additionalInfo')}
                  </p>
                  <pre
                    className={cn(
                      AUDIT_DETAIL_TOKENS.codeBlock,
                      AUDIT_DETAIL_TOKENS.mono,
                      'p-3 overflow-x-auto rounded-xl border border-brand-border-subtle'
                    )}
                  >
                    {JSON.stringify(log.details!.additionalInfo, null, 2)}
                  </pre>
                </section>
              )}

              {/* 메타데이터 */}
              <section aria-labelledby="sheet-meta-label">
                <p id="sheet-meta-label" className={AUDIT_DETAIL_SHEET_TOKENS.sectionLabel}>
                  {t('detail.metadata')}
                </p>
                <div className={AUDIT_DETAIL_SHEET_TOKENS.sectionCard}>
                  <div className={AUDIT_DETAIL_SHEET_TOKENS.row}>
                    <span className={AUDIT_DETAIL_SHEET_TOKENS.rowKey}>{t('detail.logId')}</span>
                    <span className={AUDIT_DETAIL_SHEET_TOKENS.rowValMono}>{log.id}</span>
                  </div>
                  <div
                    className={cn(
                      AUDIT_DETAIL_SHEET_TOKENS.row,
                      AUDIT_DETAIL_SHEET_TOKENS.rowBorder
                    )}
                  >
                    <span className={AUDIT_DETAIL_SHEET_TOKENS.rowKey}>
                      {t('detail.createdAt')}
                    </span>
                    <span className={AUDIT_DETAIL_SHEET_TOKENS.rowValMono}>
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                  {log.details?.requestId && (
                    <div
                      className={cn(
                        AUDIT_DETAIL_SHEET_TOKENS.row,
                        AUDIT_DETAIL_SHEET_TOKENS.rowBorder
                      )}
                    >
                      <span className={AUDIT_DETAIL_SHEET_TOKENS.rowKey}>
                        {t('detail.requestId')}
                      </span>
                      <span className={AUDIT_DETAIL_SHEET_TOKENS.rowValMono}>
                        {String(log.details.requestId)}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* ── 하단 액션 바 ── */}
          <div className={AUDIT_DETAIL_SHEET_TOKENS.footer}>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {tc('actions.close')}
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              {tc('actions.print')}
            </Button>
          </div>
        </div>

        {/* 인쇄용 (기존 컴포넌트 유지) */}
        {log && (
          <PrintableAuditReport
            logs={[log]}
            title={t('detail.auditLogDetail', { type: getEntityTypeLabel(log.entityType) })}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
