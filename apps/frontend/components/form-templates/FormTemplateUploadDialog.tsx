'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { queryKeys } from '@/lib/api/query-config';
import { uploadFormTemplate } from '@/lib/api/form-templates-api';

interface FormTemplateUploadDialogProps {
  formNumber: string;
  formName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FormTemplateUploadDialog({
  formNumber,
  formName,
  open,
  onOpenChange,
}: FormTemplateUploadDialogProps) {
  const t = useTranslations('form-templates');
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: (file: File) => uploadFormTemplate(formNumber, file),
    onSuccess: () => {
      toast.success(t('uploadDialog.success'));
      queryClient.invalidateQueries({ queryKey: queryKeys.formTemplates.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.formTemplates.history(formNumber) });
      setSelectedFile(null);
      onOpenChange(false);
    },
    onError: () => {
      toast.error(t('uploadDialog.error'));
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      mutation.mutate(selectedFile);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('uploadDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('uploadDialog.description', { formNumber, formName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.xlsx"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {selectedFile ? selectedFile.name : t('uploadDialog.selectFile')}
            </Button>
            <p className="text-xs text-muted-foreground">{t('uploadDialog.accept')}</p>
          </div>

          <Button
            className="w-full"
            disabled={!selectedFile || mutation.isPending}
            onClick={handleUpload}
          >
            {mutation.isPending ? t('uploadDialog.uploading') : t('upload')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
