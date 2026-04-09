'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  FileCheck,
  Pencil,
  Paperclip,
  Upload,
  Download,
  Trash2,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { UserCombobox } from '@/components/ui/user-combobox';
import { softwareValidationApi } from '@/lib/api/software-api';
import type { UpdateSoftwareValidationDto } from '@/lib/api/software-api';
import { documentApi, type DocumentRecord } from '@/lib/api/document-api';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { isConflictError } from '@/lib/api/error';
import {
  getPageContainerClasses,
  PAGE_HEADER_TOKENS,
  DOCUMENT_TABLE,
  DOCUMENT_EMPTY_STATE,
} from '@/lib/design-tokens';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { ExportFormButton } from '@/components/shared/ExportFormButton';
import { DocumentTypeValues, DOCUMENT_TYPE_LABELS } from '@equipment-management/schemas';
import type { ValidationStatus, DocumentType } from '@equipment-management/schemas';
import { formatFileSize } from '@/lib/utils/format';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { ALLOWED_EXTENSIONS } from '@equipment-management/shared-constants';

interface ValidationDetailContentProps {
  softwareId: string;
  validationId: string;
}

const STATUS_VARIANT: Record<
  ValidationStatus,
  'secondary' | 'outline' | 'default' | 'destructive'
> = {
  draft: 'secondary',
  submitted: 'outline',
  approved: 'outline',
  quality_approved: 'default',
  rejected: 'destructive',
};

const MIME_ICONS: Record<string, typeof FileText> = {
  'application/pdf': FileText,
  'image/jpeg': ImageIcon,
  'image/png': ImageIcon,
  'image/gif': ImageIcon,
  'application/vnd.ms-excel': FileSpreadsheet,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileSpreadsheet,
};

export default function ValidationDetailContent({
  softwareId,
  validationId,
}: ValidationDetailContentProps) {
  const t = useTranslations('software');
  const { fmtDate, fmtDateTime } = useDateFormatter();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditOpen, setIsEditOpen] = useState(searchParams.get('edit') === 'true');
  const [editForm, setEditForm] = useState<{
    vendorName: string;
    vendorSummary: string;
    receivedBy: string;
    receivedDate: string;
    attachmentNote: string;
    softwareVersion: string;
    testDate: string;
  } | null>(null);

  const { data: validation, isLoading } = useQuery({
    queryKey: queryKeys.softwareValidations.detail(validationId),
    queryFn: () => softwareValidationApi.get(validationId),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSoftwareValidationDto) =>
      softwareValidationApi.update(validationId, data),
    onSuccess: () => {
      toast({ title: t('toast.updateSuccess') });
      setIsEditOpen(false);
      queryClient.invalidateQueries({
        queryKey: queryKeys.softwareValidations.detail(validationId),
      });
    },
    onError: (error) => {
      if (isConflictError(error)) {
        toast({ title: t('toast.versionConflict'), variant: 'destructive' });
        queryClient.invalidateQueries({
          queryKey: queryKeys.softwareValidations.detail(validationId),
        });
      } else {
        toast({ title: t('toast.error'), variant: 'destructive' });
      }
    },
  });

  const { data: docs = [], isLoading: docsLoading } = useQuery({
    queryKey: queryKeys.documents.byValidation(validationId),
    queryFn: () => documentApi.getValidationDocuments(validationId),
    staleTime: CACHE_TIMES.LONG,
  });

  const invalidateDocs = () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.documents.byValidation(validationId),
    });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const docType =
        validation?.validationType === 'vendor'
          ? DocumentTypeValues.VALIDATION_VENDOR_ATTACHMENT
          : DocumentTypeValues.VALIDATION_TEST_DATA;
      return documentApi.uploadDocument(file, docType, {
        softwareValidationId: validationId,
      });
    },
    onSuccess: () => {
      toast({ title: t('validation.documents.uploadSuccess') });
      invalidateDocs();
    },
    onError: () => {
      toast({ title: t('validation.documents.uploadError'), variant: 'destructive' });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = async (doc: DocumentRecord) => {
    await documentApi.downloadDocument(doc.id, doc.originalFileName);
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm(t('validation.documents.deleteConfirm'))) return;
    try {
      await documentApi.deleteDocument(docId);
      toast({ title: t('validation.documents.deleteSuccess') });
      invalidateDocs();
    } catch {
      toast({ title: t('validation.documents.deleteError'), variant: 'destructive' });
    }
  };

  const openEditDialog = () => {
    if (!validation) return;
    setEditForm({
      vendorName: validation.vendorName ?? '',
      vendorSummary: validation.vendorSummary ?? '',
      receivedBy: validation.receivedBy ?? '',
      receivedDate: validation.receivedDate?.split('T')[0] ?? '',
      attachmentNote: validation.attachmentNote ?? '',
      softwareVersion: validation.softwareVersion ?? '',
      testDate: validation.testDate?.split('T')[0] ?? '',
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!validation || !editForm) return;
    const data: UpdateSoftwareValidationDto = {
      version: validation.version,
      ...(editForm.softwareVersion ? { softwareVersion: editForm.softwareVersion } : {}),
      ...(editForm.testDate ? { testDate: editForm.testDate } : {}),
      ...(editForm.vendorName ? { vendorName: editForm.vendorName } : {}),
      ...(editForm.vendorSummary ? { vendorSummary: editForm.vendorSummary } : {}),
      ...(editForm.receivedBy ? { receivedBy: editForm.receivedBy } : {}),
      ...(editForm.receivedDate ? { receivedDate: editForm.receivedDate } : {}),
      ...(editForm.attachmentNote ? { attachmentNote: editForm.attachmentNote } : {}),
    };
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!validation) {
    return (
      <div className={getPageContainerClasses('detail')}>
        <p className="text-muted-foreground">{t('detail.notFound')}</p>
      </div>
    );
  }

  const isVendor = validation.validationType === 'vendor';
  const isSelf = validation.validationType === 'self';

  return (
    <div className={getPageContainerClasses('detail')}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(FRONTEND_ROUTES.SOFTWARE.VALIDATION(softwareId))}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        {t('validation.detail.backToList')}
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className={PAGE_HEADER_TOKENS.title}>{t('validation.detail.title')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <ExportFormButton
            formNumber="UL-QP-18-09"
            params={{ validationId }}
            label={t('validation.actions.exportValidation')}
            errorToastDescription={t('toast.error')}
          />
          {validation.status === 'draft' && (
            <Button variant="outline" size="sm" onClick={openEditDialog}>
              <Pencil className="mr-1 h-3.5 w-3.5" />
              {t('validation.actions.edit')}
            </Button>
          )}
          <Badge variant={STATUS_VARIANT[validation.status]} className="text-sm">
            {t(`validationStatus.${validation.status}`)}
          </Badge>
        </div>
      </div>

      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCheck className="h-5 w-5 text-brand-info" aria-hidden="true" />
            {t('validation.detail.basicInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('validation.detail.validationType')}
              </dt>
              <dd className="text-sm font-medium">
                {t(`validationType.${validation.validationType}`)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                {t('validation.detail.softwareVersion')}
              </dt>
              <dd className="text-sm font-mono">{validation.softwareVersion || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t('validation.detail.testDate')}</dt>
              <dd className="text-sm">
                {validation.testDate ? fmtDate(validation.testDate) : '-'}
              </dd>
            </div>
            {validation.infoDate && (
              <div>
                <dt className="text-sm text-muted-foreground">{t('validation.detail.infoDate')}</dt>
                <dd className="text-sm">{fmtDate(validation.infoDate)}</dd>
              </div>
            )}
            {validation.softwareAuthor && (
              <div>
                <dt className="text-sm text-muted-foreground">
                  {t('validation.detail.softwareAuthor')}
                </dt>
                <dd className="text-sm">{validation.softwareAuthor}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* 방법 1: 공급자 정보 */}
      {isVendor && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('validation.detail.vendorInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">
                  {t('validation.detail.vendorName')}
                </dt>
                <dd className="text-sm font-medium">{validation.vendorName || '-'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">
                  {t('validation.detail.vendorSummary')}
                </dt>
                <dd className="text-sm whitespace-pre-wrap">{validation.vendorSummary || '-'}</dd>
              </div>
              {validation.receivedBy && (
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('validation.detail.receivedBy')}
                  </dt>
                  <dd className="text-sm">{validation.receivedBy}</dd>
                </div>
              )}
              {validation.receivedDate && (
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('validation.detail.receivedDate')}
                  </dt>
                  <dd className="text-sm">{fmtDate(validation.receivedDate)}</dd>
                </div>
              )}
              {validation.attachmentNote && (
                <div className="sm:col-span-2">
                  <dt className="text-sm text-muted-foreground">
                    {t('validation.detail.attachmentNote')}
                  </dt>
                  <dd className="text-sm whitespace-pre-wrap">{validation.attachmentNote}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* 방법 2: 자체 시험 */}
      {isSelf && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('validation.detail.selfTestInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">
                  {t('validation.detail.referenceDocuments')}
                </dt>
                <dd className="text-sm whitespace-pre-wrap">
                  {validation.referenceDocuments || '-'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">
                  {t('validation.detail.operatingUnitDescription')}
                </dt>
                <dd className="text-sm whitespace-pre-wrap">
                  {validation.operatingUnitDescription || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  {t('validation.detail.softwareComponents')}
                </dt>
                <dd className="text-sm whitespace-pre-wrap">
                  {validation.softwareComponents || '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">
                  {t('validation.detail.hardwareComponents')}
                </dt>
                <dd className="text-sm whitespace-pre-wrap">
                  {validation.hardwareComponents || '-'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* 승인 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('validation.detail.approvalInfo')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {validation.submittedAt && (
              <>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {t('validation.detail.submittedAt')}
                  </dt>
                  <dd className="text-sm">{fmtDateTime(validation.submittedAt)}</dd>
                </div>
              </>
            )}
            {validation.technicalApprovedAt && (
              <div>
                <dt className="text-sm text-muted-foreground">
                  {t('validation.detail.technicalApprovedAt')}
                </dt>
                <dd className="text-sm">{fmtDateTime(validation.technicalApprovedAt)}</dd>
              </div>
            )}
            {validation.qualityApprovedAt && (
              <div>
                <dt className="text-sm text-muted-foreground">
                  {t('validation.detail.qualityApprovedAt')}
                </dt>
                <dd className="text-sm">{fmtDateTime(validation.qualityApprovedAt)}</dd>
              </div>
            )}
            {validation.rejectionReason && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">
                  {t('validation.detail.rejectionReason')}
                </dt>
                <dd className="text-sm text-destructive whitespace-pre-wrap">
                  {validation.rejectionReason}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-muted-foreground">{t('validation.detail.createdAt')}</dt>
              <dd className="text-sm">{fmtDateTime(validation.createdAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* 첨부파일 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Paperclip className="h-5 w-5 text-brand-info" aria-hidden="true" />
            {t('validation.documents.title')}
            {docs.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {docs.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {validation.status === 'draft' && (
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept={ALLOWED_EXTENSIONS.join(',')}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                <Upload className="mr-1 h-3.5 w-3.5" />
                {uploadMutation.isPending
                  ? t('validation.documents.uploading')
                  : t('validation.documents.upload')}
              </Button>
            </div>
          )}

          {docsLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : docs.length === 0 ? (
            <div className={DOCUMENT_EMPTY_STATE.container}>
              <Paperclip className={DOCUMENT_EMPTY_STATE.icon} />
              <p className={DOCUMENT_EMPTY_STATE.text}>{t('validation.documents.empty')}</p>
            </div>
          ) : (
            <div className={DOCUMENT_TABLE.wrapper}>
              <Table>
                <TableHeader>
                  <TableRow className={DOCUMENT_TABLE.stickyHeader}>
                    <TableHead>{t('validation.documents.tableHeaders.fileName')}</TableHead>
                    <TableHead>{t('validation.documents.tableHeaders.type')}</TableHead>
                    <TableHead>{t('validation.documents.tableHeaders.size')}</TableHead>
                    <TableHead>{t('validation.documents.tableHeaders.uploadedAt')}</TableHead>
                    <TableHead>{t('validation.documents.tableHeaders.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map((doc) => {
                    const Icon = MIME_ICONS[doc.mimeType] ?? File;
                    const typeLabel =
                      DOCUMENT_TYPE_LABELS[doc.documentType as DocumentType] ?? doc.documentType;

                    return (
                      <TableRow
                        key={doc.id}
                        className={[DOCUMENT_TABLE.rowHover, DOCUMENT_TABLE.stripe].join(' ')}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span
                              className={`truncate max-w-[200px] ${DOCUMENT_TABLE.fileNameCell}`}
                              title={doc.originalFileName}
                            >
                              {doc.originalFileName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {typeLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className={DOCUMENT_TABLE.numericCell}>
                          {formatFileSize(doc.fileSize)}
                        </TableCell>
                        <TableCell className={DOCUMENT_TABLE.numericCell}>
                          {fmtDate(doc.uploadedAt)}
                        </TableCell>
                        <TableCell>
                          <div className={DOCUMENT_TABLE.actionsCell}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDownload(doc)}
                              aria-label={`${t('validation.documents.download')} ${doc.originalFileName}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {validation.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteDoc(doc.id)}
                                aria-label={`${t('validation.documents.delete')} ${doc.originalFileName}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('validation.editDialog.title')}</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('validation.form.versionLabel')}</Label>
                <Input
                  value={editForm.softwareVersion}
                  onChange={(e) => setEditForm({ ...editForm, softwareVersion: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('validation.form.testDateLabel')}</Label>
                <Input
                  type="date"
                  value={editForm.testDate}
                  onChange={(e) => setEditForm({ ...editForm, testDate: e.target.value })}
                />
              </div>
              {isVendor && (
                <>
                  <div className="space-y-2">
                    <Label>{t('validation.form.vendorNameLabel')}</Label>
                    <Input
                      value={editForm.vendorName}
                      onChange={(e) => setEditForm({ ...editForm, vendorName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('validation.form.vendorSummaryLabel')}</Label>
                    <Textarea
                      value={editForm.vendorSummary}
                      onChange={(e) => setEditForm({ ...editForm, vendorSummary: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('validation.form.receivedByLabel')}</Label>
                      <UserCombobox
                        value={editForm.receivedBy || undefined}
                        onChange={(id) => setEditForm({ ...editForm, receivedBy: id ?? '' })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('validation.form.receivedDateLabel')}</Label>
                      <Input
                        type="date"
                        value={editForm.receivedDate}
                        onChange={(e) => setEditForm({ ...editForm, receivedDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('validation.form.attachmentNoteLabel')}</Label>
                    <Textarea
                      value={editForm.attachmentNote}
                      onChange={(e) => setEditForm({ ...editForm, attachmentNote: e.target.value })}
                      placeholder={t('validation.form.attachmentNotePlaceholder')}
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  {t('validation.form.cancel')}
                </Button>
                <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                  {updateMutation.isPending
                    ? t('validation.editDialog.saving')
                    : t('validation.editDialog.save')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
