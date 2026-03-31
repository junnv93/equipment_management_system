'use client';

import { useCallback, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, FileSpreadsheet, X, Download } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { dataMigrationApi } from '@/lib/api/data-migration-api';
import type { PreviewOptions, MigrationPreviewResult } from '@/lib/api/data-migration-api';
import { toast } from 'sonner';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

interface FileUploadStepProps {
  onPreviewComplete: (result: MigrationPreviewResult, options: PreviewOptions) => void;
}

export default function FileUploadStep({ onPreviewComplete }: FileUploadStepProps) {
  const t = useTranslations('data-migration');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [options, setOptions] = useState<PreviewOptions>({
    autoGenerateManagementNumber: false,
    skipDuplicates: true,
  });

  const previewMutation = useMutation({
    mutationFn: ({ file, opts }: { file: File; opts: PreviewOptions }) =>
      dataMigrationApi.previewEquipmentMigration(file, opts),
    onSuccess: (result, { opts }) => {
      onPreviewComplete(result, opts);
    },
    onError: () => {
      toast.error(t('errors.previewFailed'));
    },
  });

  const templateMutation = useMutation({
    mutationFn: dataMigrationApi.downloadTemplate,
    onError: () => {
      toast.error(t('errors.downloadFailed'));
    },
  });

  const validateAndSetFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.xlsx')) {
        toast.error(t('errors.invalidFileType'));
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(t('errors.fileTooLarge'));
        return;
      }
      setSelectedFile(file);
    },
    [t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSetFile(file);
    },
    [validateAndSetFile]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handlePreview = () => {
    if (!selectedFile) {
      toast.error(t('errors.fileRequired'));
      return;
    }
    previewMutation.mutate({ file: selectedFile, opts: options });
  };

  const isPending = previewMutation.isPending;

  return (
    <div className="space-y-6">
      {/* 파일 드롭존 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('upload.title')}</CardTitle>
          <CardDescription>{t('upload.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedFile ? (
            <div
              role="button"
              tabIndex={0}
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors cursor-pointer ${
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
              }}
            >
              <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium">
                {isDragOver ? t('upload.dropzoneActive') : t('upload.dropzone')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('upload.fileTypeHint')} · {t('upload.maxSizeHint')}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleInputChange}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
              <FileSpreadsheet className="h-8 w-8 shrink-0 text-green-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('upload.removeFile')}
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 가져오기 옵션 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('upload.options')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="auto-generate">{t('upload.autoGenerateNumber')}</Label>
              <p className="text-xs text-muted-foreground">{t('upload.autoGenerateNumberHint')}</p>
            </div>
            <Switch
              id="auto-generate"
              checked={options.autoGenerateManagementNumber ?? false}
              onCheckedChange={(checked) =>
                setOptions((prev) => ({ ...prev, autoGenerateManagementNumber: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="skip-duplicates">{t('upload.skipDuplicates')}</Label>
              <p className="text-xs text-muted-foreground">{t('upload.skipDuplicatesHint')}</p>
            </div>
            <Switch
              id="skip-duplicates"
              checked={options.skipDuplicates ?? true}
              onCheckedChange={(checked) =>
                setOptions((prev) => ({ ...prev, skipDuplicates: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-site">{t('upload.defaultSite')}</Label>
            <p className="text-xs text-muted-foreground">{t('upload.defaultSiteHint')}</p>
            <Select
              value={options.defaultSite ?? ''}
              onValueChange={(val) =>
                setOptions((prev) => ({
                  ...prev,
                  defaultSite: val as PreviewOptions['defaultSite'],
                }))
              }
            >
              <SelectTrigger id="default-site" className="w-48">
                <SelectValue placeholder="-" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="suwon">{t('upload.sites.suwon')}</SelectItem>
                <SelectItem value="uiwang">{t('upload.sites.uiwang')}</SelectItem>
                <SelectItem value="pyeongtaek">{t('upload.sites.pyeongtaek')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 액션 버튼 */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => templateMutation.mutate()}
          disabled={templateMutation.isPending}
        >
          <Download className="mr-2 h-4 w-4" />
          {t('upload.downloadTemplate')}
        </Button>
        <Button onClick={handlePreview} disabled={!selectedFile || isPending}>
          {isPending ? (
            t('upload.loading')
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {t('upload.startPreview')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
