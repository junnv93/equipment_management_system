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
import { Badge } from '@/components/ui/badge';
import { downloadFormTemplate } from '@/lib/api/form-templates-api';
import type { FormTemplateListItem } from '@/lib/api/form-templates-api';
import {
  FORM_TEMPLATES_TABLE_TOKENS,
  FORM_TEMPLATES_STATUS_TOKENS,
  FORM_TEMPLATES_MOTION,
} from '@/lib/design-tokens';
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

  const isRegistered = (tpl: FormTemplateListItem) => tpl.activeTemplate !== null;

  return (
    <>
      <div className={FORM_TEMPLATES_TABLE_TOKENS.container}>
        <Table>
          <TableHeader>
            <TableRow className={FORM_TEMPLATES_TABLE_TOKENS.headerRow}>
              <TableHead className={FORM_TEMPLATES_TABLE_TOKENS.headerCell}>
                {t('table.formNumber')}
              </TableHead>
              <TableHead className={FORM_TEMPLATES_TABLE_TOKENS.headerCell}>
                {t('table.formName')}
              </TableHead>
              <TableHead className={FORM_TEMPLATES_TABLE_TOKENS.headerCell}>
                {t('table.retention')}
              </TableHead>
              <TableHead className={`${FORM_TEMPLATES_TABLE_TOKENS.headerCell} text-center`}>
                {t('table.version')}
              </TableHead>
              <TableHead className={FORM_TEMPLATES_TABLE_TOKENS.headerCell}>
                {t('table.lastUpload')}
              </TableHead>
              <TableHead className={FORM_TEMPLATES_TABLE_TOKENS.headerCell}>
                {t('table.filename')}
              </TableHead>
              <TableHead className={`${FORM_TEMPLATES_TABLE_TOKENS.headerCell} text-right`}>
                {t('table.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((tpl) => {
              const registered = isRegistered(tpl);
              const statusTokens = registered
                ? FORM_TEMPLATES_STATUS_TOKENS.registered
                : FORM_TEMPLATES_STATUS_TOKENS.unregistered;

              return (
                <TableRow
                  key={tpl.formNumber}
                  className={`${FORM_TEMPLATES_TABLE_TOKENS.rowHover} ${FORM_TEMPLATES_TABLE_TOKENS.rowStripe}`}
                >
                  {/* 양식 번호 — mono font 강조 + 상태 dot */}
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={`${FORM_TEMPLATES_TABLE_TOKENS.statusDot} ${statusTokens.dot}`}
                        aria-label={registered ? t('status.registered') : t('status.unregistered')}
                      />
                      <span className={FORM_TEMPLATES_TABLE_TOKENS.formNumber}>
                        {tpl.formNumber}
                      </span>
                    </span>
                  </TableCell>

                  {/* 양식명 */}
                  <TableCell className="text-sm">{tpl.name}</TableCell>

                  {/* 보존연한 */}
                  <TableCell className="text-sm text-muted-foreground">
                    {tpl.retentionLabel}
                  </TableCell>

                  {/* 버전 */}
                  <TableCell className="text-center">
                    {tpl.activeTemplate ? (
                      <span className={FORM_TEMPLATES_TABLE_TOKENS.version}>
                        v{tpl.activeTemplate.version}
                      </span>
                    ) : (
                      <Badge className={statusTokens.badge} variant="outline">
                        {t('table.noTemplate')}
                      </Badge>
                    )}
                  </TableCell>

                  {/* 최종 업로드 */}
                  <TableCell className={FORM_TEMPLATES_TABLE_TOKENS.date}>
                    {tpl.activeTemplate
                      ? new Date(tpl.activeTemplate.uploadedAt).toLocaleDateString()
                      : '-'}
                  </TableCell>

                  {/* 파일명 */}
                  <TableCell className={FORM_TEMPLATES_TABLE_TOKENS.filename}>
                    {tpl.activeTemplate?.originalFilename ?? '-'}
                  </TableCell>

                  {/* 액션 */}
                  <TableCell className="text-right">
                    <div className={FORM_TEMPLATES_TABLE_TOKENS.actionGroup}>
                      {tpl.activeTemplate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`${FORM_TEMPLATES_TABLE_TOKENS.actionBtn} ${FORM_TEMPLATES_MOTION.buttonPress}`}
                          onClick={() => downloadFormTemplate(tpl.formNumber)}
                          aria-label={`${t('download')} ${tpl.formNumber}`}
                        >
                          <Download className="h-3.5 w-3.5" />
                          {t('download')}
                        </Button>
                      )}
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`${FORM_TEMPLATES_TABLE_TOKENS.actionBtn} ${FORM_TEMPLATES_MOTION.buttonPress}`}
                          onClick={() => setUploadTarget(tpl)}
                          aria-label={`${t('upload')} ${tpl.formNumber}`}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {t('upload')}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`${FORM_TEMPLATES_TABLE_TOKENS.actionBtn} ${FORM_TEMPLATES_MOTION.buttonPress}`}
                        onClick={() => setHistoryTarget(tpl)}
                        aria-label={`${t('history')} ${tpl.formNumber}`}
                      >
                        <History className="h-3.5 w-3.5" />
                        {t('history')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

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
