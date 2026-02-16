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
  DISPOSAL_REASON_LABELS,
  DISPOSAL_REVIEW_STATUS_LABELS,
  type DisposalRequest,
} from '@equipment-management/schemas';
import { formatDateTime } from '@/lib/utils/date';

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
  const stages: TimelineStage[] = [
    {
      id: 'request',
      title: '폐기 요청',
      icon: <Clock className="h-5 w-5" />,
      completed: true,
      data: {
        person: disposalRequest.requestedByName,
        time: disposalRequest.requestedAt,
        content: `${DISPOSAL_REASON_LABELS[disposalRequest.reason]}\n\n${disposalRequest.reasonDetail}`,
        attachments: disposalRequest.attachments,
      },
    },
    {
      id: 'review',
      title: '기술책임자 검토',
      icon:
        disposalRequest.reviewStatus === 'rejected' &&
        disposalRequest.rejectionStep === 'review' ? (
          <XCircle className="h-5 w-5" />
        ) : (
          <Check className="h-5 w-5" />
        ),
      completed: ['reviewed', 'approved', 'rejected'].includes(disposalRequest.reviewStatus),
      data:
        disposalRequest.reviewStatus === 'rejected' && disposalRequest.rejectionStep === 'review'
          ? {
              person: disposalRequest.rejectedByName,
              time: disposalRequest.rejectedAt,
              content: `반려 사유:\n${disposalRequest.rejectionReason}`,
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
      title: '시험소장 최종 승인',
      icon:
        disposalRequest.reviewStatus === 'rejected' &&
        disposalRequest.rejectionStep === 'approval' ? (
          <XCircle className="h-5 w-5" />
        ) : (
          <Check className="h-5 w-5" />
        ),
      completed: disposalRequest.reviewStatus === 'approved',
      data:
        disposalRequest.reviewStatus === 'rejected' && disposalRequest.rejectionStep === 'approval'
          ? {
              person: disposalRequest.rejectedByName,
              time: disposalRequest.rejectedAt,
              content: `반려 사유:\n${disposalRequest.rejectionReason}`,
            }
          : disposalRequest.approvedByName
            ? {
                person: disposalRequest.approvedByName,
                time: disposalRequest.approvedAt,
                content: disposalRequest.approvalComment || '승인 완료',
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
          <DialogTitle>폐기 상세 내역</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-gray-900 dark:text-gray-100">{equipmentName}</span>{' '}
            장비의 폐기 진행 내역입니다.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">진행 상태</h3>
            <Badge
              variant={
                disposalRequest.reviewStatus === 'approved'
                  ? 'default'
                  : disposalRequest.reviewStatus === 'rejected'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {DISPOSAL_REVIEW_STATUS_LABELS[disposalRequest.reviewStatus]}
            </Badge>
          </div>

          <div className="relative space-y-6">
            {stages.map((stage, index) => {
              const isLast = index === stages.length - 1;
              const isRejected =
                disposalRequest.reviewStatus === 'rejected' &&
                stage.id === disposalRequest.rejectionStep;

              return (
                <div key={stage.id} className="relative">
                  {!isLast && (
                    <div
                      className={`absolute left-[18px] top-[36px] h-full w-[2px] ${
                        stage.completed ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  )}

                  <div className="flex gap-4">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                        isRejected
                          ? 'border-red-500 bg-red-500 text-white'
                          : stage.completed
                            ? 'border-green-500 bg-green-500 text-white'
                            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400'
                      }`}
                    >
                      {stage.icon}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div>
                        <h3
                          className={`font-medium ${
                            isRejected
                              ? 'text-red-700 dark:text-red-400'
                              : stage.completed
                                ? 'text-green-700 dark:text-green-400'
                                : 'text-gray-400'
                          }`}
                        >
                          {stage.title}
                        </h3>
                        {stage.data && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {stage.data.person} |{' '}
                            {stage.data.time && formatDateTime(stage.data.time)}
                          </p>
                        )}
                      </div>

                      {stage.data && (
                        <Card
                          className={
                            isRejected
                              ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30'
                              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                          }
                        >
                          <CardContent className="pt-4 pb-4">
                            {stage.data.content && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {stage.data.content}
                              </p>
                            )}
                            {stage.data.attachments && stage.data.attachments.length > 0 && (
                              <div className="mt-3 space-y-1">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                  첨부 파일:
                                </p>
                                {stage.data.attachments.map((file) => (
                                  <a
                                    key={file.id}
                                    href={file.url}
                                    download={file.filename}
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                    aria-label={`다운로드: ${file.filename}`}
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
