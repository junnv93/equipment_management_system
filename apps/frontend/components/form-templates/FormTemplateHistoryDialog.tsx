'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { queryKeys, REFETCH_STRATEGIES } from '@/lib/api/query-config';
import { getFormTemplateHistory } from '@/lib/api/form-templates-api';
import { FORM_TEMPLATES_HISTORY_TOKENS, FORM_TEMPLATES_MOTION } from '@/lib/design-tokens';

interface FormTemplateHistoryDialogProps {
  formNumber: string;
  formName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FormTemplateHistoryDialog({
  formNumber,
  formName,
  open,
  onOpenChange,
}: FormTemplateHistoryDialogProps) {
  const t = useTranslations('form-templates');

  const { data: history, isLoading } = useQuery({
    queryKey: queryKeys.formTemplates.history(formNumber),
    queryFn: () => getFormTemplateHistory(formNumber),
    enabled: open,
    ...REFETCH_STRATEGIES.STATIC,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t('historyDialog.title')} — {formNumber} {formName}
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
                  <TableHead>{t('historyDialog.version')}</TableHead>
                  <TableHead>{t('historyDialog.filename')}</TableHead>
                  <TableHead>{t('historyDialog.uploadDate')}</TableHead>
                  <TableHead>{t('historyDialog.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id} className={FORM_TEMPLATES_HISTORY_TOKENS.bodyRow}>
                    <TableCell className={FORM_TEMPLATES_HISTORY_TOKENS.version}>
                      v{item.version}
                    </TableCell>
                    <TableCell className={FORM_TEMPLATES_HISTORY_TOKENS.filename}>
                      {item.originalFilename}
                    </TableCell>
                    <TableCell className={FORM_TEMPLATES_HISTORY_TOKENS.date}>
                      {new Date(item.uploadedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {item.isActive ? (
                        <Badge
                          className={FORM_TEMPLATES_HISTORY_TOKENS.activeBadge}
                          variant="outline"
                        >
                          {t('historyDialog.active')}
                        </Badge>
                      ) : (
                        <Badge
                          className={FORM_TEMPLATES_HISTORY_TOKENS.inactiveBadge}
                          variant="outline"
                        >
                          {t('historyDialog.inactive')}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
