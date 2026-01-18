'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Upload, File } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UploadedFile {
  file: File;
  uuid?: string; // 서버에서 반환된 UUID
  preview?: string; // 이미지 미리보기 URL
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
  attachmentType?: 'inspection_report' | 'history_card' | 'other';
}

export function FileUpload({
  files,
  onChange,
  accept = '.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx',
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 10,
  disabled = false,
  label = '파일 첨부',
  description = 'PDF, 이미지, 문서 파일을 업로드할 수 있습니다. (최대 10MB)',
  attachmentType = 'other',
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `파일 크기는 ${Math.round(maxSize / 1024 / 1024)}MB를 초과할 수 없습니다.`;
    }
    return null;
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles: UploadedFile[] = [];
    const errors: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      if (files.length + newFiles.length >= maxFiles) {
        errors.push(`최대 ${maxFiles}개까지 업로드할 수 있습니다.`);
        return;
      }

      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
        return;
      }

      const uploadedFile: UploadedFile = { file };

      // 이미지 파일인 경우 미리보기 생성
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedFile.preview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(uploadedFile);
    });

    if (errors.length > 0) {
      // TODO: toast로 에러 표시
      console.error('File upload errors:', errors);
    }

    if (newFiles.length > 0) {
      onChange([...files, ...newFiles]);
    }
  };

  const handleRemove = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label>{label}</Label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>

      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 transition-colors',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">파일을 드래그하거나 클릭하여 업로드</p>
            <p className="text-xs text-muted-foreground mt-1">
              {accept} (최대 {formatFileSize(maxSize)})
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || files.length >= maxFiles}
          >
            파일 선택
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

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            업로드된 파일 ({files.length}/{maxFiles})
          </p>
          <div className="space-y-2">
            {files.map((uploadedFile, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
