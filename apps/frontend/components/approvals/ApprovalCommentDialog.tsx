'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getApprovalActionButtonClasses } from '@/lib/design-tokens';
import { type ApprovalItem, type ApprovalCategory, TAB_META } from '@/lib/api/approvals-api';
import { getLocalizedSummary } from '@/lib/utils/approval-summary-utils';
import { useSiteLabels } from '@/lib/i18n/use-enum-labels';

interface SingleCommentDialogProps {
  mode: 'single';
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  comment: string;
  onCommentChange: (v: string) => void;
  item: ApprovalItem;
  isPending: boolean;
}

interface BulkCommentDialogProps {
  mode: 'bulk';
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  comment: string;
  onCommentChange: (v: string) => void;
  activeTab: ApprovalCategory;
  bulkCount: number;
  isPending: boolean;
}

type ApprovalCommentDialogProps = SingleCommentDialogProps | BulkCommentDialogProps;

/**
 * 승인 코멘트 입력 다이얼로그 — single 단건 / bulk 일괄 통합
 *
 * single 모드: 단건 승인 코멘트 (commentRequired 카테고리)
 * bulk 모드  : 일괄 승인 코멘트 (commentRequired 카테고리)
 *
 * 두 다이얼로그의 구조가 동일하므로 mode prop으로 title/description/button만 분기.
 */
export function ApprovalCommentDialog(props: ApprovalCommentDialogProps) {
  const t = useTranslations('approvals');
  const siteLabels = useSiteLabels();

  const { isOpen, onClose, onConfirm, comment, onCommentChange, isPending } = props;

  let title: string;
  let description: string;
  let labelHtmlFor: string;
  let placeholder: string;
  let confirmLabel: string;
  let tabMeta: (typeof TAB_META)[ApprovalCategory] | undefined;

  if (props.mode === 'single') {
    const { item } = props;
    tabMeta = TAB_META[item.category];
    // commentDialogTitleKey는 실제 i18n 경로를 저장 — 값 자체를 직접 사용 (패턴 재구성 금지)
    title = tabMeta?.commentDialogTitleKey
      ? t(tabMeta.commentDialogTitleKey as Parameters<typeof t>[0])
      : t('commentDialog.titleFallback');
    description = getLocalizedSummary(item, t, siteLabels);
    labelHtmlFor = 'approve-comment';
    placeholder = tabMeta?.commentPlaceholderKey
      ? t(tabMeta.commentPlaceholderKey as Parameters<typeof t>[0])
      : t('commentDialog.placeholderFallback');
    confirmLabel = t(`tabMeta.${item.category}.action` as Parameters<typeof t>[0]);
  } else {
    const { activeTab, bulkCount } = props;
    tabMeta = TAB_META[activeTab];
    title = tabMeta?.commentDialogTitleKey
      ? t(tabMeta.commentDialogTitleKey as Parameters<typeof t>[0])
      : t('bulkCommentDialog.titleFallback');
    description = t('bulkCommentDialog.description', { count: bulkCount });
    labelHtmlFor = 'bulk-approve-comment';
    placeholder = tabMeta?.commentPlaceholderKey
      ? t(tabMeta.commentPlaceholderKey as Parameters<typeof t>[0])
      : t('commentDialog.placeholderFallback');
    confirmLabel = t('bulkCommentDialog.buttonLabel', {
      count: bulkCount,
      action: t(`tabMeta.${activeTab}.action` as Parameters<typeof t>[0]),
    });
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor={labelHtmlFor}>{t('commentDialog.label')} *</Label>
            <Textarea
              id={labelHtmlFor}
              placeholder={placeholder}
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('actions.cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => void onConfirm()}
            disabled={!comment.trim() || isPending}
            loading={isPending}
            className={getApprovalActionButtonClasses('approve')}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
