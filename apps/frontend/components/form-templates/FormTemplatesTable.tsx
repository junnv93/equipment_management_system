'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Upload, History } from 'lucide-react';
import { Permission } from '@equipment-management/shared-constants';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { downloadFormTemplate } from '@/lib/api/form-templates-api';
import type { FormTemplateListItem } from '@/lib/api/form-templates-api';
import FormTemplateUploadDialog from './FormTemplateUploadDialog';
import FormTemplateHistoryDialog from './FormTemplateHistoryDialog';

interface FormTemplatesTableProps {
  templates: FormTemplateListItem[];
}

export default function FormTemplatesTable({ templates }: FormTemplatesTableProps) {
  const t = useTranslations('form-templates');
  const { can } = useAuth();
  const canManage = can(Permission.MANAGE_FORM_TEMPLATES);

  const [uploadTarget, setUploadTarget] = useState<FormTemplateListItem | null>(null);
  const [historyTarget, setHistoryTarget] = useState<FormTemplateListItem | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('table.formNumber')}</TableHead>
            <TableHead>{t('table.formName')}</TableHead>
            <TableHead>{t('table.retention')}</TableHead>
            <TableHead className="text-center">{t('table.version')}</TableHead>
            <TableHead>{t('table.lastUpload')}</TableHead>
            <TableHead>{t('table.filename')}</TableHead>
            <TableHead className="text-right">{t('table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((tpl) => (
            <TableRow key={tpl.formNumber}>
              <TableCell className="font-medium">{tpl.formNumber}</TableCell>
              <TableCell>{tpl.name}</TableCell>
              <TableCell>{tpl.retentionLabel}</TableCell>
              <TableCell className="text-center">
                {tpl.activeTemplate ? `v${tpl.activeTemplate.version}` : t('table.noTemplate')}
              </TableCell>
              <TableCell>
                {tpl.activeTemplate
                  ? new Date(tpl.activeTemplate.uploadedAt).toLocaleDateString()
                  : '-'}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {tpl.activeTemplate?.originalFilename ?? '-'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {tpl.activeTemplate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFormTemplate(tpl.formNumber)}
                    >
                      <Download className="mr-1 h-4 w-4" />
                      {t('download')}
                    </Button>
                  )}
                  {canManage && (
                    <Button variant="ghost" size="sm" onClick={() => setUploadTarget(tpl)}>
                      <Upload className="mr-1 h-4 w-4" />
                      {t('upload')}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setHistoryTarget(tpl)}>
                    <History className="mr-1 h-4 w-4" />
                    {t('history')}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {uploadTarget && (
        <FormTemplateUploadDialog
          formNumber={uploadTarget.formNumber}
          formName={uploadTarget.name}
          open={!!uploadTarget}
          onOpenChange={(open) => {
            if (!open) setUploadTarget(null);
          }}
        />
      )}

      {historyTarget && (
        <FormTemplateHistoryDialog
          formNumber={historyTarget.formNumber}
          formName={historyTarget.name}
          open={!!historyTarget}
          onOpenChange={(open) => {
            if (!open) setHistoryTarget(null);
          }}
        />
      )}
    </>
  );
}
