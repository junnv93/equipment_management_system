'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import nonConformancesApi, { NonConformance } from '@/lib/api/non-conformances-api';
import { formatDate } from '@/lib/utils/date';
import {
  getSemanticBadgeClasses,
  ncStatusToSemantic,
  NC_APPROVE_BUTTON_TOKENS,
  NC_INFO_NOTICE_TOKENS,
  getPageContainerClasses,
} from '@/lib/design-tokens';
import { PageHeader } from '@/components/shared/PageHeader';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { getErrorMessage } from '@/lib/api/error';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export default function NonConformanceApprovalsContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useTranslations('non-conformances');
  const [closingId, setClosingId] = useState<string | null>(null);
  const [closureNotes, setClosureNotes] = useState<Record<string, string>>({});

  // TanStack Query로 서버 상태 관리
  const {
    data: nonConformances = [],
    isLoading: loading,
    isError,
    refetch,
  } = useQuery<NonConformance[]>({
    queryKey: [...queryKeys.nonConformances.lists(), { status: 'corrected' }],
    queryFn: async () => {
      const data = await nonConformancesApi.getPendingCloseNonConformances();
      return data.data;
    },
    ...QUERY_CONFIG.PENDING_APPROVALS,
  });

  // useMutation으로 종료 처리
  const closeMutation = useMutation({
    mutationFn: async ({ id, version, notes }: { id: string; version: number; notes?: string }) => {
      return nonConformancesApi.closeNonConformance(id, {
        version,
        closureNotes: notes || undefined,
      });
    },
    onSuccess: (_data, variables) => {
      toast({
        title: t('approvals.toasts.closeSuccess'),
        description: t('approvals.toasts.closeSuccessDesc'),
      });
      setClosureNotes((prev) => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
    },
    onError: (error: unknown) => {
      toast({
        title: t('approvals.toasts.closeError'),
        description: getErrorMessage(error, t('approvals.toasts.closeErrorDesc')),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setClosingId(null);
      // SSOT: 서버 동기화는 onSettled에서
      queryClient.invalidateQueries({ queryKey: queryKeys.nonConformances.all });
    },
  });

  const handleClose = (id: string) => {
    const nc = nonConformances.find((n) => n.id === id);
    if (!nc) return;
    setClosingId(id);
    closeMutation.mutate({
      id,
      version: nc.version,
      notes: closureNotes[id],
    });
  };

  if (loading) {
    return (
      <div className={getPageContainerClasses()}>
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-20 w-full rounded-lg" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
            <div className="pt-4 border-t border-border flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className={getPageContainerClasses()}>
        <Card className="p-6 bg-destructive/10 border-destructive/20 dark:bg-destructive/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">{t('approvals.error.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('approvals.error.description')}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              {t('approvals.retry')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={getPageContainerClasses()}>
      {/* 헤더 */}
      <PageHeader title={t('approvals.title')} subtitle={t('approvals.description')} />

      {/* 안내 메시지 — NC_INFO_NOTICE_TOKENS SSOT */}
      <div className={NC_INFO_NOTICE_TOKENS.container}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={NC_INFO_NOTICE_TOKENS.icon} aria-hidden="true" />
          <p className={`${NC_INFO_NOTICE_TOKENS.text} whitespace-pre-line`}>
            {t('approvals.infoMessage')}
          </p>
        </div>
      </div>

      {/* 부적합 목록 */}
      {nonConformances.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="inline-block motion-safe:animate-gentle-bounce">
            <div className="h-12 w-12 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Clock className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            </div>
          </div>
          <h3 className="mt-4 text-base font-medium tracking-tight text-foreground">
            {t('approvals.empty.title')}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {t('approvals.empty.description')}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {nonConformances.map((nc, index) => (
            <Card
              key={nc.id}
              className="p-6 motion-safe:animate-[staggerFadeIn_0.3s_ease-out_forwards]"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={getSemanticBadgeClasses(ncStatusToSemantic(nc.status))}>
                      {t(`ncStatus.${nc.status}` as Parameters<typeof t>[0])}
                    </span>
                    <time dateTime={nc.discoveryDate} className="text-sm text-muted-foreground">
                      {t('approvals.discoveryDate')}: {formatDate(nc.discoveryDate, 'yyyy-MM-dd')}
                    </time>
                  </div>
                  <Link
                    href={`/equipment/${nc.equipmentId}`}
                    className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                  >
                    {t('approvals.viewEquipment')}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {t('approvals.cause')}
                  </h4>
                  <p className="text-foreground mt-1 leading-relaxed">{nc.cause}</p>
                </div>

                {nc.correctionContent && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {t('approvals.correction')}
                    </h4>
                    <p className="text-foreground mt-1 leading-relaxed">{nc.correctionContent}</p>
                  </div>
                )}

                {nc.correctionDate && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {t('approvals.correctionDate')}
                    </h4>
                    <time dateTime={nc.correctionDate} className="text-foreground mt-1 block">
                      {formatDate(nc.correctionDate, 'yyyy-MM-dd')}
                    </time>
                  </div>
                )}
              </div>

              {/* 종료 승인 영역 */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor={`closure-notes-${nc.id}`}>
                      {t('approvals.closureNotesLabel')}
                    </Label>
                    <Input
                      id={`closure-notes-${nc.id}`}
                      type="text"
                      value={closureNotes[nc.id] || ''}
                      onChange={(e) =>
                        setClosureNotes((prev) => ({
                          ...prev,
                          [nc.id]: e.target.value,
                        }))
                      }
                      className="mt-1.5"
                      placeholder={t('approvals.closureNotesPlaceholder')}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => handleClose(nc.id)}
                      disabled={closingId === nc.id}
                      className={NC_APPROVE_BUTTON_TOKENS.approve}
                    >
                      {closingId === nc.id ? (
                        <>
                          <RefreshCw
                            className="h-4 w-4 mr-2 motion-safe:animate-spin"
                            aria-hidden="true"
                          />
                          {t('approvals.processing')}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                          {t('approvals.approveButton')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
