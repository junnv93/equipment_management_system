'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload, type UploadedFile } from '@/components/shared/FileUpload';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, FileCheck } from 'lucide-react';

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
  const attachmentType = isEdit ? 'history_card' : 'inspection_report';
  const attachmentLabel = isEdit ? '이력카드' : '검수보고서';
  const attachmentDescription = isEdit
    ? '기존 장비 수정 시 이력카드를 첨부하세요'
    : '신규 장비 등록 시 검수보고서를 첨부하세요';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            4
          </span>
          파일 첨부
        </CardTitle>
        <CardDescription>{attachmentDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 첨부 파일 안내 */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>파일 첨부 안내</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
              <li>지원 형식: PDF, 이미지(JPG, PNG), 문서(DOC, DOCX, XLS, XLSX)</li>
              <li>파일 크기: 최대 10MB</li>
              <li>파일 개수: 최대 10개</li>
              <li>드래그 앤 드롭으로 쉽게 업로드할 수 있습니다</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* 기존 첨부파일 목록 (수정 모드) */}
        {isEdit && existingAttachments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              기존 첨부파일
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
                    className="text-sm text-primary hover:underline"
                  >
                    다운로드
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 새 파일 업로드 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            {isEdit ? '새 파일 추가' : attachmentLabel + ' 첨부'}
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
