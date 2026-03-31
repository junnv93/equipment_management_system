'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  X,
  Upload,
  File,
  FileImage,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRANSITION_PRESETS } from '@/lib/design-tokens';
import { ALLOWED_EXTENSIONS, FILE_UPLOAD_LIMITS } from '@equipment-management/shared-constants';
import { validateFile as validateFileUtil } from '@/lib/utils/file-validation';

export interface UploadedFile {
  file: File;
  uuid?: string; // 서버에서 반환된 UUID
  preview?: string; // 이미지 미리보기 URL
  progress?: number; // 업로드 진행률 (0-100)
  status?: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface FileUploadProps {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  accept?: string;
  maxSize?: number; // bytes
  maxFiles?: number;
  disabled?: boolean;
  label?: string;
  description?: string;
  attachmentType?: string;
  showProgress?: boolean;
}

/**
 * 파일 타입별 아이콘 반환
 */
function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
    return FileImage;
  }
  if (['pdf'].includes(ext || '')) {
    return FileText;
  }
  return File;
}

/**
 * 파일 타입별 색상 반환
 */
function getFileTypeColor(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
    return 'text-brand-ok';
  }
  if (['pdf'].includes(ext || '')) {
    return 'text-brand-critical';
  }
  if (['doc', 'docx'].includes(ext || '')) {
    return 'text-brand-info';
  }
  if (['xls', 'xlsx'].includes(ext || '')) {
    return 'text-brand-ok';
  }
  return 'text-muted-foreground';
}

export function FileUpload({
  files,
  onChange,
  accept = ALLOWED_EXTENSIONS.join(','),
  maxSize = FILE_UPLOAD_LIMITS.MAX_FILE_SIZE,
  maxFiles = FILE_UPLOAD_LIMITS.MAX_FILE_COUNT,
  disabled = false,
  label,
  description,
  attachmentType: _attachmentType = 'other',
  showProgress = true,
}: FileUploadProps) {
  const t = useTranslations('common.fileUpload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const displayLabel = label ?? t('label');
  const displayDescription = description ?? t('description');

  const validateFile = useCallback(
    (file: File): string | null => {
      const error = validateFileUtil(file, { accept, maxSize });
      if (!error) return null;
      if (error.type === 'size') {
        return t('sizeTooLarge', { maxSizeMB: error.maxSizeMB ?? 0 });
      }
      return t('unsupportedType', { accept });
    },
    [accept, maxSize, t]
  );

  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles || selectedFiles.length === 0) return;

      const newFiles: UploadedFile[] = [];
      const newErrors: string[] = [];

      Array.from(selectedFiles).forEach((file) => {
        if (files.length + newFiles.length >= maxFiles) {
          newErrors.push(t('maxFilesExceeded', { maxFiles }));
          return;
        }

        // 중복 파일 체크
        const isDuplicate = files.some(
          (f) => f.file.name === file.name && f.file.size === file.size
        );
        if (isDuplicate) {
          newErrors.push(t('duplicate', { fileName: file.name }));
          return;
        }

        const error = validateFile(file);
        if (error) {
          newErrors.push(`${file.name}: ${error}`);
          return;
        }

        const uploadedFile: UploadedFile = {
          file,
          status: 'pending',
          progress: 0,
        };

        newFiles.push(uploadedFile);
      });

      setErrors(newErrors);

      if (newFiles.length > 0) {
        const allFiles = [...files, ...newFiles];
        onChange(allFiles);

        // 이미지 파일의 미리보기를 비동기 생성 후 re-render 유발
        newFiles.forEach((uf) => {
          if (uf.file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              uf.preview = e.target?.result as string;
              onChange([...allFiles]);
            };
            reader.readAsDataURL(uf.file);
          }
        });
      }

      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [files, maxFiles, onChange, validateFile, t]
  );

  const handleRemove = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      onChange(newFiles);
    },
    [files, onChange]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const droppedFiles = e.dataTransfer.files;
      handleFileSelect(droppedFiles);
    },
    [disabled, handleFileSelect]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderFileStatus = (uploadedFile: UploadedFile) => {
    switch (uploadedFile.status) {
      case 'uploading':
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
            <span>{t('uploading')}</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center gap-1 text-sm text-brand-ok">
            <CheckCircle2 className="h-4 w-4" />
            <span>{t('success')}</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1 text-sm text-brand-critical">
            <AlertCircle className="h-4 w-4" />
            <span>{uploadedFile.error || t('error')}</span>
          </div>
        );
      default:
        return (
          <span className="text-xs text-muted-foreground">
            {formatFileSize(uploadedFile.file.size)}
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>{displayLabel}</Label>
        {displayDescription && (
          <p className="text-sm text-muted-foreground">{displayDescription}</p>
        )}
      </div>

      {/* 드래그 앤 드롭 영역 */}
      <div
        className={cn(
          `relative border-2 border-dashed rounded-lg p-8 ${TRANSITION_PRESETS.fastBorderBgTransform}`,
          dragActive
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div
            className={cn(
              `p-4 rounded-full ${TRANSITION_PRESETS.fastColor}`,
              dragActive ? 'bg-primary/10' : 'bg-muted'
            )}
          >
            <Upload
              className={cn(
                `h-8 w-8 ${TRANSITION_PRESETS.fastColor}`,
                dragActive ? 'text-primary' : 'text-muted-foreground'
              )}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">{dragActive ? t('dropHere') : t('dragOrClick')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('formatHint', {
                extensions: accept.split(',').join(', '),
                maxSize: formatFileSize(maxSize),
                maxFiles,
              })}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || files.length >= maxFiles}
          >
            {t('selectFile')}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={disabled}
      />

      {/* 에러 메시지 */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-brand-critical flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          ))}
        </div>
      )}

      {/* 업로드된 파일 목록 */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {t('uploadedFiles', { count: files.length, max: maxFiles })}
            </p>
            {files.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange([])}
                disabled={disabled}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                {t('deleteAll')}
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {files.map((uploadedFile, index) => {
              const FileIcon = getFileIcon(uploadedFile.file.name);
              const fileColor = getFileTypeColor(uploadedFile.file.name);

              return (
                <div
                  key={`${uploadedFile.file.name}-${index}`}
                  className={`group relative flex items-center justify-between p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 ${TRANSITION_PRESETS.fastColor}`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* 이미지 미리보기 또는 아이콘 */}
                    {uploadedFile.preview ? (
                      <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden border bg-card">
                        {/* eslint-disable-next-line @next/next/no-img-element -- blob URL 미리보기는 next/image 미지원 */}
                        <img
                          src={uploadedFile.preview}
                          alt={uploadedFile.file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded border bg-card">
                        <FileIcon className={cn('h-6 w-6', fileColor)} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={uploadedFile.file.name}>
                        {uploadedFile.file.name}
                      </p>
                      <div className="flex items-center gap-2">
                        {renderFileStatus(uploadedFile)}
                      </div>

                      {/* 진행률 표시 */}
                      {showProgress && uploadedFile.status === 'uploading' && (
                        <Progress value={uploadedFile.progress || 0} className="h-1 mt-2" />
                      )}
                    </div>
                  </div>

                  {/* 삭제 버튼 */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(index)}
                    disabled={disabled || uploadedFile.status === 'uploading'}
                    className={`flex-shrink-0 opacity-0 group-hover:opacity-100 ${TRANSITION_PRESETS.fastOpacity}`}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">{t('deleteFile')}</span>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
