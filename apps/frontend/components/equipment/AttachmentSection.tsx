'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload, type UploadedFile } from '@/components/shared/FileUpload';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, FileCheck } from 'lucide-react';
import { FORM_SECTION_TOKENS, FOCUS_TOKENS } from '@/lib/design-tokens';

interface AttachmentSectionProps {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
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
  isEdit = false,
  isLoading = false,
  existingAttachments = [],
}: AttachmentSectionProps) {
  const t = useTranslations('equipment.attachmentSection');
  const attachmentType = isEdit ? 'history_card' : 'inspection_report';
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
      <CardContent className="space-y-4">
        {/* 첨부 파일 안내 */}
        <Alert>
          <Info className="h-4 w-4" />
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

        {/* 기존 첨부파일 목록 (수정 모드) */}
        {isEdit && existingAttachments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
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
                      <FileCheck className="h-5 w-5 text-primary" />
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
                  >
                    {t('download')}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 새 파일 업로드 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
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
      </CardContent>
    </Card>
  );
}
