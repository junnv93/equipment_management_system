'use client';

import { daysBetween } from '@/lib/utils/date';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, FileText, Download, MousePointerClick } from 'lucide-react';
import type { ApprovalItem } from '@/lib/api/approvals-api';
import { TAB_META, UNIFIED_APPROVAL_STATUS_LABELS } from '@/lib/api/approvals-api';
import { ApprovalStepIndicator } from './ApprovalStepIndicator';
import { ApprovalHistoryCard } from './ApprovalHistoryCard';
import { CategoryDetails, CategoryBadge } from './detail-renderers';
import {
  getApprovalStatusBadgeClasses,
  getApprovalActionButtonClasses,
  getElapsedDaysClasses,
  APPROVAL_DETAIL_PANEL_TOKENS,
} from '@/lib/design-tokens';
import { getElapsedDaysUrgency } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface ApprovalDetailPanelProps {
  item: ApprovalItem | null;
  onApprove: (item: ApprovalItem) => void;
  onReject: (item: ApprovalItem) => void;
  actionLabel: string;
  isProcessing?: boolean;
}

/**
 * 승인 상세 인라인 패널 — Split View 우측 (xl:+)
 *
 * 모달 대체: 리스트에서 항목 클릭 시 즉시 렌더링.
 * 컨텍스트 차단 없이 연속 triage 가능.
 *
 * Design Token: APPROVAL_DETAIL_PANEL_TOKENS (SSOT)
 */
export function ApprovalDetailPanel({
  item,
  onApprove,
  onReject,
  actionLabel,
  isProcessing = false,
}: ApprovalDetailPanelProps) {
  const t = useTranslations('approvals');
  const { fmtDateTime } = useDateFormatter();
  const tokens = APPROVAL_DETAIL_PANEL_TOKENS;

  // 빈 상태 (항목 미선택)
  if (!item) {
    return (
      <div className={tokens.container}>
        <div className={tokens.empty.wrapper}>
          <div className="text-center">
            <div className={tokens.empty.iconContainer}>
              <MousePointerClick className={tokens.empty.icon} />
            </div>
            <p className={tokens.empty.text}>{t('detailPanel.emptyTitle')}</p>
            <p className={tokens.empty.hint}>{t('detailPanel.emptyHint')}</p>
          </div>
        </div>
      </div>
    );
  }

  const elapsedDays = daysBetween(item.requestedAt);
  const urgency = getElapsedDaysUrgency(elapsedDays);
  const isMultiStep = TAB_META[item.category]?.multiStep ?? false;

  return (
    <div className={tokens.container}>
      <div key={item.id} className={tokens.contentEnter}>
        {/* ── Header ── */}
        <div className={tokens.header.container}>
          <div className={tokens.header.topRow}>
            <Badge className={getApprovalStatusBadgeClasses(item.status)}>
              {UNIFIED_APPROVAL_STATUS_LABELS[item.status] || item.status}
            </Badge>
            <CategoryBadge category={item.category} />
          </div>
          <h3 className={tokens.header.title}>{item.summary}</h3>

          <div className={tokens.header.metaGrid}>
            <div>
              <div className={tokens.header.metaLabel}>{t('detail.requester')}</div>
              <div className={tokens.header.metaValue}>
                {item.requesterName}
                {item.requesterTeam && (
                  <span className="text-muted-foreground font-normal"> · {item.requesterTeam}</span>
                )}
              </div>
            </div>
            <div>
              <div className={tokens.header.metaLabel}>{t('detail.requestDate')}</div>
              <div className={cn(tokens.header.metaValue, 'font-mono tabular-nums text-xs')}>
                {fmtDateTime(item.requestedAt)}
              </div>
            </div>
            <div>
              <div className={tokens.header.metaLabel}>{t('item.elapsedLabel')}</div>
              <div className={getElapsedDaysClasses(elapsedDays)}>
                {elapsedDays === 0
                  ? t('item.elapsedToday')
                  : `${elapsedDays}${t('kpi.dayUnit')}${urgency === 'critical' || urgency === 'emergency' ? ` (${t('kpi.urgentSub')})` : ''}`}
              </div>
            </div>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className={tokens.body}>
          {/* 다단계 승인 진행 상태 */}
          {isMultiStep && (
            <div className={tokens.section.container}>
              <div className={tokens.section.title}>
                {t('detail.approvalStatus')}
                <div className={tokens.section.titleLine} />
              </div>
              <ApprovalStepIndicator
                type={
                  item.category === 'disposal_review' || item.category === 'disposal_final'
                    ? 'disposal'
                    : 'calibration_plan'
                }
                currentStatus={item.status}
                history={item.approvalHistory}
              />
            </div>
          )}

          {/* 요청 상세 정보 */}
          <div className={tokens.section.container}>
            <div className={tokens.section.title}>
              {t('detail.requestDetail')}
              <div className={tokens.section.titleLine} />
            </div>
            <div className="bg-muted/50 rounded-lg p-4 divide-y">
              <CategoryDetails category={item.category} details={item.details} />
            </div>
          </div>

          {/* 첨부 파일 */}
          {item.attachments && item.attachments.length > 0 && (
            <div className={tokens.section.container}>
              <div className={tokens.section.title}>
                {t('detail.attachments')}
                <div className={tokens.section.titleLine} />
              </div>
              {item.attachments.map((attachment) => (
                <div key={attachment.id} className={tokens.attachment.row}>
                  <FileText className={tokens.attachment.icon} aria-hidden="true" />
                  <span className={tokens.attachment.name}>{attachment.filename}</span>
                  <span className={tokens.attachment.size}>
                    {Math.round(attachment.size / 1024)}KB
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    aria-label={`${attachment.filename} ${t('detail.download')}`}
                    onClick={() => window.open(attachment.url, '_blank')}
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* 승인 이력 */}
          {item.approvalHistory && item.approvalHistory.length > 0 && (
            <div className={tokens.section.container}>
              <div className={tokens.section.title}>
                {t('detail.approvalHistory')}
                <div className={tokens.section.titleLine} />
              </div>
              <ApprovalHistoryCard history={item.approvalHistory} />
            </div>
          )}
        </div>

        {/* ── Sticky Footer Actions ── */}
        <div className={tokens.footer.container}>
          <Button
            type="button"
            className={cn(tokens.footer.button, getApprovalActionButtonClasses('approve'))}
            onClick={() => onApprove(item)}
            disabled={isProcessing}
            aria-busy={isProcessing}
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
            {actionLabel}
            <kbd className={tokens.kbdBadge}>A</kbd>
          </Button>
          <Button
            type="button"
            variant="outline"
            className={cn(tokens.footer.button, getApprovalActionButtonClasses('reject'))}
            onClick={() => onReject(item)}
            disabled={isProcessing}
          >
            <XCircle className="h-4 w-4 mr-1.5" aria-hidden="true" />
            {t('detail.reject')}
            <kbd className={tokens.kbdBadge}>R</kbd>
          </Button>
        </div>
      </div>
    </div>
  );
}
