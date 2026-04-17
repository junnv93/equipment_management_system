'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Upload, History, FilePlus, MoreHorizontal } from 'lucide-react';
import { Permission } from '@equipment-management/shared-constants';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { downloadFormTemplateById } from '@/lib/api/form-templates-api';
import type { FormTemplateListItem } from '@/lib/api/form-templates-api';
import { getDownloadErrorToast } from '@/lib/errors/download-error-utils';
import { FORM_TEMPLATES_TABLE_TOKENS, FORM_TEMPLATES_STATUS_TOKENS } from '@/lib/design-tokens';
import FormTemplateUploadDialog, { type UploadDialogMode } from './FormTemplateUploadDialog';
import FormTemplateHistoryDialog from './FormTemplateHistoryDialog';
import { useToast } from '@/components/ui/use-toast';

interface FormTemplatesTableProps {
  templates: FormTemplateListItem[];
}

interface UploadTarget {
  template: FormTemplateListItem;
  mode: UploadDialogMode;
}

export default function FormTemplatesTable({ templates }: FormTemplatesTableProps) {
  const t = useTranslations('form-templates');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const { can } = useAuth();
  const canManage = can(Permission.MANAGE_FORM_TEMPLATES);

  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(null);
  const [historyTarget, setHistoryTarget] = useState<FormTemplateListItem | null>(null);

  const isRegistered = (tpl: FormTemplateListItem) => tpl.current !== null;

  return (
    <>
      <div className={FORM_TEMPLATES_TABLE_TOKENS.container}>
        <Table>
          <TableHeader>
            <TableRow className={FORM_TEMPLATES_TABLE_TOKENS.headerRow}>
              <TableHead className={FORM_TEMPLATES_TABLE_TOKENS.headerCell}>
                {t('table.formName')}
              </TableHead>
              <TableHead className={FORM_TEMPLATES_TABLE_TOKENS.headerCell}>
                {t('table.formNumber')}
              </TableHead>
              <TableHead className={FORM_TEMPLATES_TABLE_TOKENS.headerCell}>
                {t('table.retention')}
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
                  key={tpl.formName}
                  className={`${FORM_TEMPLATES_TABLE_TOKENS.rowHover} ${FORM_TEMPLATES_TABLE_TOKENS.rowStripe}`}
                >
                  {/* 양식명 — 안정 식별자, mono + status dot */}
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={`${FORM_TEMPLATES_TABLE_TOKENS.statusDot} ${statusTokens.dot}`}
                          aria-label={
                            registered ? t('status.registered') : t('status.unregistered')
                          }
                        />
                        <span className="text-sm font-medium">{tpl.formName}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {t(`category.${tpl.category}`)}
                        </Badge>
                      </span>
                      <span className="pl-4 text-[11px] text-muted-foreground">
                        {t(`recommendedManager.${tpl.category}`)}
                      </span>
                    </div>
                  </TableCell>

                  {/* 현행 양식 번호 */}
                  <TableCell>
                    {tpl.current ? (
                      <span className={FORM_TEMPLATES_TABLE_TOKENS.formNumber}>
                        {tpl.current.formNumber}
                      </span>
                    ) : (
                      <Badge className={statusTokens.badge} variant="outline">
                        {t('table.noTemplate')}
                      </Badge>
                    )}
                  </TableCell>

                  {/* 보존연한 */}
                  <TableCell className="text-sm text-muted-foreground">
                    {tpl.retentionLabel}
                  </TableCell>

                  {/* 최종 등록 */}
                  <TableCell className={FORM_TEMPLATES_TABLE_TOKENS.date}>
                    {tpl.current ? new Date(tpl.current.uploadedAt).toLocaleDateString() : '-'}
                  </TableCell>

                  {/* 파일명 */}
                  <TableCell className={FORM_TEMPLATES_TABLE_TOKENS.filename}>
                    {tpl.current?.originalFilename ?? '-'}
                  </TableCell>

                  {/* 액션 */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label={t('table.menuAriaLabel', { formName: tpl.formName })}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {tpl.current && (
                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                await downloadFormTemplateById(tpl.current!.id);
                              } catch (err) {
                                toast({
                                  variant: 'destructive',
                                  ...getDownloadErrorToast(err, tCommon('errors.downloadFailed')),
                                });
                              }
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {t('download')}
                          </DropdownMenuItem>
                        )}
                        {canManage && !tpl.current && (
                          <DropdownMenuItem
                            onClick={() => setUploadTarget({ template: tpl, mode: 'create' })}
                          >
                            <FilePlus className="h-4 w-4 mr-2" />
                            {t('register')}
                          </DropdownMenuItem>
                        )}
                        {canManage && tpl.current && (
                          <>
                            <DropdownMenuItem
                              onClick={() => setUploadTarget({ template: tpl, mode: 'create' })}
                            >
                              <FilePlus className="h-4 w-4 mr-2" />
                              {t('revise')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setUploadTarget({ template: tpl, mode: 'replace' })}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {t('replace')}
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem onClick={() => setHistoryTarget(tpl)}>
                          <History className="h-4 w-4 mr-2" />
                          {t('history')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {uploadTarget && (
        <FormTemplateUploadDialog
          formName={uploadTarget.template.formName}
          currentFormNumber={uploadTarget.template.current?.formNumber ?? null}
          mode={uploadTarget.mode}
          open={!!uploadTarget}
          onOpenChange={(open) => {
            if (!open) setUploadTarget(null);
          }}
        />
      )}

      {historyTarget && (
        <FormTemplateHistoryDialog
          formName={historyTarget.formName}
          open={!!historyTarget}
          onOpenChange={(open) => {
            if (!open) setHistoryTarget(null);
          }}
        />
      )}
    </>
  );
}
