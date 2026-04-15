'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Download, Lock } from 'lucide-react';
import { Permission } from '@equipment-management/shared-constants';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import {
  listFormTemplateHistoryByName,
  listFormTemplateRevisionsByName,
  downloadFormTemplateById,
} from '@/lib/api/form-templates-api';
import { FORM_TEMPLATES_HISTORY_TOKENS, FORM_TEMPLATES_MOTION } from '@/lib/design-tokens';

interface FormTemplateHistoryDialogProps {
  formName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FormTemplateHistoryDialog({
  formName,
  open,
  onOpenChange,
}: FormTemplateHistoryDialogProps) {
  const t = useTranslations('form-templates');
  const { can } = useAuth();
  const canDownloadHistory = can(Permission.DOWNLOAD_FORM_TEMPLATE_HISTORY);

  const { data: history, isLoading } = useQuery({
    queryKey: queryKeys.formTemplates.historyByName(formName),
    queryFn: () => listFormTemplateHistoryByName(formName),
    enabled: open,
    ...QUERY_CONFIG.FORM_TEMPLATES,
  });

  const { data: revisions } = useQuery({
    queryKey: queryKeys.formTemplates.revisionsByName(formName),
    queryFn: () => listFormTemplateRevisionsByName(formName),
    enabled: open,
    ...QUERY_CONFIG.FORM_TEMPLATES,
  });

  const changeSummaryByFormNumber = new Map(
    (revisions ?? []).map((r) => [r.newFormNumber, r.changeSummary])
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {t('historyDialog.title')} — {formName}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}

        {!isLoading && (!history || history.length === 0) && (
          <p className={FORM_TEMPLATES_HISTORY_TOKENS.empty}>{t('historyDialog.empty')}</p>
        )}

        {!isLoading && history && history.length > 0 && (
          <div
            className={`${FORM_TEMPLATES_HISTORY_TOKENS.tableContainer} ${FORM_TEMPLATES_MOTION.contentEntrance}`}
          >
            <Table>
              <TableHeader>
                <TableRow className={FORM_TEMPLATES_HISTORY_TOKENS.headerRow}>
                  <TableHead>{t('historyDialog.formNumber')}</TableHead>
                  <TableHead>{t('historyDialog.filename')}</TableHead>
                  <TableHead>{t('historyDialog.changeSummary')}</TableHead>
                  <TableHead>{t('historyDialog.uploadDate')}</TableHead>
                  <TableHead>{t('historyDialog.status')}</TableHead>
                  <TableHead className="text-right">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => {
                  const canDownload = item.isCurrent || canDownloadHistory;
                  const downloadButton = (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canDownload}
                      onClick={() => canDownload && downloadFormTemplateById(item.id)}
                      aria-label={`${t('download')} ${item.formNumber}`}
                    >
                      {canDownload ? (
                        <Download className="h-3.5 w-3.5" />
                      ) : (
                        <Lock className="h-3.5 w-3.5" />
                      )}
                      {t('download')}
                    </Button>
                  );

                  return (
                    <TableRow key={item.id} className={FORM_TEMPLATES_HISTORY_TOKENS.bodyRow}>
                      <TableCell className={FORM_TEMPLATES_HISTORY_TOKENS.version}>
                        {item.formNumber}
                      </TableCell>
                      <TableCell className={FORM_TEMPLATES_HISTORY_TOKENS.filename}>
                        {item.originalFilename}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {changeSummaryByFormNumber.get(item.formNumber) ?? '-'}
                      </TableCell>
                      <TableCell className={FORM_TEMPLATES_HISTORY_TOKENS.date}>
                        {new Date(item.uploadedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {item.isCurrent ? (
                          <Badge
                            className={FORM_TEMPLATES_HISTORY_TOKENS.activeBadge}
                            variant="outline"
                          >
                            {t('historyDialog.current')}
                          </Badge>
                        ) : (
                          <Badge
                            className={FORM_TEMPLATES_HISTORY_TOKENS.inactiveBadge}
                            variant="outline"
                          >
                            {t('historyDialog.superseded')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {canDownload ? (
                          downloadButton
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0}>{downloadButton}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t('historyDialog.downloadHistoryDenied')}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
