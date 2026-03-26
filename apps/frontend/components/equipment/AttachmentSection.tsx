'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload, type UploadedFile } from '@/components/shared/FileUpload';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, FileCheck, Camera, BookOpen } from 'lucide-react';
import { DocumentTypeValues } from '@equipment-management/schemas';
import { FORM_SECTION_TOKENS, FOCUS_TOKENS, DOCUMENT_UPLOAD } from '@/lib/design-tokens';

interface AttachmentSectionProps {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  photoFiles: UploadedFile[];
  onPhotoChange: (files: UploadedFile[]) => void;
  manualFiles: UploadedFile[];
  onManualChange: (files: UploadedFile[]) => void;
  isEdit?: boolean;
  isLoading?: boolean;
  existingAttachments?: Array<{
    uuid: string;
    fileName: string;
    fileSize: number;
    attachmentType: string;
    createdAt: string;
  }>;
}

export function AttachmentSection({
  files,
  onChange,
  photoFiles,
  onPhotoChange,
  manualFiles,
  onManualChange,
  isEdit = false,
  isLoading = false,
  existingAttachments = [],
}: AttachmentSectionProps) {
  const t = useTranslations('equipment.attachmentSection');
  const attachmentType = isEdit
    ? DocumentTypeValues.HISTORY_CARD
    : DocumentTypeValues.INSPECTION_REPORT;
  const attachmentLabel = isEdit ? t('historyCard') : t('inspectionReport');
  const attachmentDescription = isEdit ? t('editDescription') : t('createDescription');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className={FORM_SECTION_TOKENS.badge}>4</span>
          {t('sectionTitle')}
        </CardTitle>
        <CardDescription>{attachmentDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 첨부 파일 안내 */}
        <Alert>
          <Info className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>{t('guideTitle')}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
              <li>{t('guideFormats')}</li>
              <li>{t('guideSize')}</li>
              <li>{t('guideCount')}</li>
              <li>{t('guideDragDrop')}</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* ── 업로드 영역 (AP-02: 안내와 업로드 사이 시각적 분리) ── */}
        <div className={DOCUMENT_UPLOAD.sectionDivider}>
          <div className={DOCUMENT_UPLOAD.uploadGroup}>
            {/* 장비 사진 — AP-01: 좌측 info 보더로 시각적 계층 */}
            <div className={`${DOCUMENT_UPLOAD.uploadArea} ${DOCUMENT_UPLOAD.uploadAreaPhoto}`}>
              <h4 className={DOCUMENT_UPLOAD.uploadTitle}>
                <Camera className="h-4 w-4 text-brand-info" aria-hidden="true" />
                {t('photoTitle')}
              </h4>
              <p className={DOCUMENT_UPLOAD.uploadDescription}>{t('photoDescription')}</p>
              <FileUpload
                files={photoFiles}
                onChange={onPhotoChange}
                accept="image/jpeg,image/png,image/gif"
                label={t('photoTitle')}
                description={t('photoDescription')}
                disabled={isLoading}
              />
            </div>

            {/* 장비 매뉴얼 — AP-01: 좌측 purple 보더로 시각적 구분 */}
            <div className={`${DOCUMENT_UPLOAD.uploadArea} ${DOCUMENT_UPLOAD.uploadAreaManual}`}>
              <h4 className={DOCUMENT_UPLOAD.uploadTitle}>
                <BookOpen className="h-4 w-4 text-brand-purple" aria-hidden="true" />
                {t('manualTitle')}
              </h4>
              <p className={DOCUMENT_UPLOAD.uploadDescription}>{t('manualDescription')}</p>
              <FileUpload
                files={manualFiles}
                onChange={onManualChange}
                accept="application/pdf"
                label={t('manualTitle')}
                description={t('manualDescription')}
                disabled={isLoading}
              />
            </div>

            {/* 검수보고서/이력카드 — AP-01: muted 보더 (보조 레벨) */}
            <div
              className={`${DOCUMENT_UPLOAD.uploadArea} ${DOCUMENT_UPLOAD.uploadAreaAttachment}`}
            >
              <h4 className={DOCUMENT_UPLOAD.uploadTitle}>
                {isEdit ? t('addFile') : t('attachFile', { label: attachmentLabel })}
              </h4>
              <FileUpload
                files={files}
                onChange={onChange}
                attachmentType={attachmentType}
                label={attachmentLabel}
                description={attachmentDescription}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* 기존 첨부파일 목록 (수정 모드) */}
        {isEdit && existingAttachments.length > 0 && (
          <div className="space-y-2">
            <h4 className={DOCUMENT_UPLOAD.uploadTitle}>
              <FileCheck className="h-4 w-4" aria-hidden="true" />
              {t('existingFiles')}
            </h4>
            <div className="grid gap-2">
              {existingAttachments.map((attachment) => (
                <div
                  key={attachment.uuid}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded bg-primary/10">
                      <FileCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{attachment.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {(attachment.fileSize / 1024).toFixed(1)} KB | {attachment.attachmentType}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/api/equipment/attachments/${attachment.uuid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-sm text-primary hover:underline ${FOCUS_TOKENS.classes.default}`}
                    aria-label={`${t('download')} ${attachment.fileName}`}
                  >
                    {t('download')}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
