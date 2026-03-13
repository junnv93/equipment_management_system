'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, XCircle, Download } from 'lucide-react';
import {
  type DisposalRequest,
  DisposalReviewStatusValues as DRSVal,
} from '@equipment-management/schemas';
import { formatDateTime } from '@/lib/utils/date';
import { DISPOSAL_TIMELINE_TOKENS, DISPOSAL_FILE_LINK_TOKENS } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

interface DisposalDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disposalRequest: DisposalRequest;
  equipmentName: string;
}

interface TimelineStage {
  id: string;
  title: string;
  icon: React.ReactNode;
  completed: boolean;
  data?: {
    person?: string;
    time?: string;
    content?: string;
    attachments?: Array<{ id: string; filename: string; url: string }>;
  };
}

export function DisposalDetailDialog({
  open,
  onOpenChange,
  disposalRequest,
  equipmentName,
}: DisposalDetailDialogProps) {
  const t = useTranslations('disposal');
  const tReason = useTranslations('disposal.reason');
  const tStatus = useTranslations('disposal.status');

  const stages: TimelineStage[] = [
    {
      id: 'request',
      title: t('detailDialog.stages.request'),
      icon: <Clock className="h-5 w-5" />,
      completed: true,
      data: {
        person: disposalRequest.requestedByName,
        time: disposalRequest.requestedAt,
        content: `${tReason(disposalRequest.reason)}\n\n${disposalRequest.reasonDetail}`,
        attachments: disposalRequest.attachments,
      },
    },
    {
      id: 'review',
      title: t('detailDialog.stages.review'),
      icon:
        disposalRequest.reviewStatus === DRSVal.REJECTED &&
        disposalRequest.rejectionStep === 'review' ? (
          <XCircle className="h-5 w-5" />
        ) : (
          <Check className="h-5 w-5" />
        ),
      completed: (
        [DRSVal.REVIEWED, DRSVal.APPROVED, DRSVal.REJECTED] as readonly string[]
      ).includes(disposalRequest.reviewStatus),
      data:
        disposalRequest.reviewStatus === DRSVal.REJECTED &&
        disposalRequest.rejectionStep === 'review'
          ? {
              person: disposalRequest.rejectedByName,
              time: disposalRequest.rejectedAt,
              content: t('detailDialog.rejectionReason', {
                reason: disposalRequest.rejectionReason || '',
              }),
            }
          : disposalRequest.reviewedByName
            ? {
                person: disposalRequest.reviewedByName,
                time: disposalRequest.reviewedAt,
                content: disposalRequest.reviewOpinion,
              }
            : undefined,
    },
    {
      id: 'approval',
      title: t('detailDialog.stages.approval'),
      icon:
        disposalRequest.reviewStatus === DRSVal.REJECTED &&
        disposalRequest.rejectionStep === 'approval' ? (
          <XCircle className="h-5 w-5" />
        ) : (
          <Check className="h-5 w-5" />
        ),
      completed: disposalRequest.reviewStatus === DRSVal.APPROVED,
      data:
        disposalRequest.reviewStatus === DRSVal.REJECTED &&
        disposalRequest.rejectionStep === 'approval'
          ? {
              person: disposalRequest.rejectedByName,
              time: disposalRequest.rejectedAt,
              content: t('detailDialog.rejectionReason', {
                reason: disposalRequest.rejectionReason || '',
              }),
            }
          : disposalRequest.approvedByName
            ? {
                person: disposalRequest.approvedByName,
                time: disposalRequest.approvedAt,
                content: disposalRequest.approvalComment || t('detailDialog.approvalComplete'),
              }
            : undefined,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <DialogHeader>
          <DialogTitle>{t('detailDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('detailDialog.description', { name: equipmentName })}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t('detailDialog.progressStatus')}
            </h3>
            <Badge
              variant={
                disposalRequest.reviewStatus === DRSVal.APPROVED
                  ? 'default'
                  : disposalRequest.reviewStatus === DRSVal.REJECTED
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {tStatus(disposalRequest.reviewStatus)}
            </Badge>
          </div>

          <div className="relative space-y-6">
            {stages.map((stage, index) => {
              const isLast = index === stages.length - 1;
              const isRejected =
                disposalRequest.reviewStatus === DRSVal.REJECTED &&
                stage.id === disposalRequest.rejectionStep;

              return (
                <div key={stage.id} className="relative">
                  {!isLast && (
                    <div
                      className={`${DISPOSAL_TIMELINE_TOKENS.connector.base} ${
                        stage.completed
                          ? DISPOSAL_TIMELINE_TOKENS.connector.completed
                          : DISPOSAL_TIMELINE_TOKENS.connector.pending
                      }`}
                    />
                  )}

                  <div className="flex gap-4">
                    <div
                      className={`${DISPOSAL_TIMELINE_TOKENS.node.base} ${DISPOSAL_TIMELINE_TOKENS.node.size} ${
                        isRejected
                          ? DISPOSAL_TIMELINE_TOKENS.node.rejected
                          : stage.completed
                            ? DISPOSAL_TIMELINE_TOKENS.node.completed
                            : DISPOSAL_TIMELINE_TOKENS.node.pending
                      }`}
                    >
                      {stage.icon}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div>
                        <h3
                          className={`font-medium ${
                            isRejected
                              ? DISPOSAL_TIMELINE_TOKENS.title.rejected
                              : stage.completed
                                ? DISPOSAL_TIMELINE_TOKENS.title.completed
                                : DISPOSAL_TIMELINE_TOKENS.title.pending
                          }`}
                        >
                          {stage.title}
                        </h3>
                        {stage.data && (
                          <p className="text-xs text-muted-foreground">
                            {stage.data.person} |{' '}
                            {stage.data.time && formatDateTime(stage.data.time)}
                          </p>
                        )}
                      </div>

                      {stage.data && (
                        <Card
                          className={
                            isRejected
                              ? DISPOSAL_TIMELINE_TOKENS.card.rejected
                              : DISPOSAL_TIMELINE_TOKENS.card.default
                          }
                        >
                          <CardContent className="pt-4 pb-4">
                            {stage.data.content && (
                              <p className="text-sm text-foreground whitespace-pre-wrap">
                                {stage.data.content}
                              </p>
                            )}
                            {stage.data.attachments && stage.data.attachments.length > 0 && (
                              <div className="mt-3 space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                  {t('common.attachments')}
                                </p>
                                {stage.data.attachments.map((file) => (
                                  <a
                                    key={file.id}
                                    href={file.url}
                                    download={file.filename}
                                    className={DISPOSAL_FILE_LINK_TOKENS.base}
                                    aria-label={t('common.downloadAriaLabel', {
                                      name: file.filename,
                                    })}
                                  >
                                    <Download className="h-4 w-4" />
                                    {file.filename}
                                  </a>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
