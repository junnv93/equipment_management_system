'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, FileUp } from 'lucide-react';
import { FORM_TEMPLATE_FILE_RULE } from '@equipment-management/shared-constants';
import { ErrorCode } from '@equipment-management/schemas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { queryKeys } from '@/lib/api/query-config';
import {
  createFormTemplateVersion,
  replaceFormTemplateFile,
  type FormTemplateHistoryItem,
} from '@/lib/api/form-templates-api';
import { translateApiError } from '@/lib/api/error';
import { FORM_TEMPLATES_UPLOAD_TOKENS, FORM_TEMPLATES_MOTION } from '@/lib/design-tokens';

/**
 * 업로드 다이얼로그의 동작 모드.
 * - `create`: 최초 등록 + 개정 등록 공통 (백엔드가 현행 row 존재 여부로 자동 분기)
 * - `replace`: 동일 formNumber 파일 교체
 */
export type UploadDialogMode = 'create' | 'replace';

interface FormTemplateUploadDialogProps {
  formName: string;
  currentFormNumber: string | null;
  mode: UploadDialogMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 업로드 에러 코드 → i18n 키 매핑 (SSOT: schemas/errors.ts ErrorCode enum).
 * 모듈 로컬 매핑으로 두어 이 다이얼로그만의 맥락을 명확히 표현합니다.
 */
const UPLOAD_ERROR_CODE_MAP: Readonly<Record<string, string>> = {
  [ErrorCode.FormNumberAlreadyExists]: 'uploadDialog.errorNumberExists',
  [ErrorCode.InvalidFormName]: 'uploadDialog.error',
  [ErrorCode.InvalidFormNumberFormat]: 'uploadDialog.error',
} as const;

export default function FormTemplateUploadDialog({
  formName,
  currentFormNumber,
  mode,
  open,
  onOpenChange,
}: FormTemplateUploadDialogProps) {
  const t = useTranslations('form-templates');
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formNumber, setFormNumber] = useState('');
  const [changeSummary, setChangeSummary] = useState('');

  // 개정 모드(create + 기존 현행 row 존재)일 때만 changeSummary 입력 표시
  const isReviseMode = mode === 'create' && currentFormNumber !== null;

  // 모드 전환 시 상태 초기화
  useEffect(() => {
    if (open) {
      setSelectedFile(null);
      setFormNumber('');
      setChangeSummary('');
    }
  }, [open, mode]);

  /**
   * mutation 성공 시 formTemplates 쿼리 트리 **전체**를 무효화.
   * list / historyByName / searchByNumber 모두 한 번에 커버되므로 과거 검색 결과가
   * stale하게 남는 문제를 방지합니다.
   */
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.formTemplates.all });
  };

  const onSuccess = (_data: FormTemplateHistoryItem) => {
    toast.success(
      mode === 'create' ? t('uploadDialog.successCreate') : t('uploadDialog.successReplace')
    );
    invalidateAll();
    setSelectedFile(null);
    setFormNumber('');
    setChangeSummary('');
    onOpenChange(false);
  };

  const onError = (error: unknown) => {
    toast.error(
      translateApiError(error, t, {
        codeMap: UPLOAD_ERROR_CODE_MAP,
        fallbackKey: 'uploadDialog.error',
      })
    );
  };

  const createMutation = useMutation({
    mutationFn: ({ file, number, summary }: { file: File; number: string; summary: string }) =>
      createFormTemplateVersion({ formName, formNumber: number, changeSummary: summary, file }),
    onSuccess,
    onError,
  });

  const replaceMutation = useMutation({
    mutationFn: ({ file }: { file: File }) => replaceFormTemplateFile({ formName, file }),
    onSuccess,
    onError,
  });

  const isPending = createMutation.isPending || replaceMutation.isPending;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    if (mode === 'create') {
      if (!formNumber.trim()) return;
      // 최초 등록은 changeSummary UI 미표시 — 백엔드 스키마(min 5)를 만족시키는 기본값 사용
      const summary = isReviseMode ? changeSummary.trim() : '최초 등록';
      if (isReviseMode && summary.length < 5) return;
      createMutation.mutate({ file: selectedFile, number: formNumber.trim(), summary });
    } else {
      replaceMutation.mutate({ file: selectedFile });
    }
  };

  const canSubmit =
    !!selectedFile &&
    !isPending &&
    (mode === 'replace' ||
      (formNumber.trim().length > 0 && (!isReviseMode || changeSummary.trim().length >= 5)));

  // 설명 문구는 모드 + 기존 현행 row 유무로 결정 (초기/개정/교체)
  const descriptionKey = (() => {
    if (mode === 'replace') return 'uploadDialog.descriptionReplace';
    return currentFormNumber ? 'uploadDialog.descriptionRevise' : 'uploadDialog.descriptionInitial';
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('uploadDialog.title')}</DialogTitle>
          <DialogDescription>
            {t(descriptionKey, {
              formName,
              currentFormNumber: currentFormNumber ?? '',
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 모드 힌트 */}
          <p className="text-xs text-muted-foreground">{t('uploadDialog.modeHint')}</p>

          {/* create 모드(최초 + 개정 공통): formNumber 입력 */}
          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="form-template-number">{t('uploadDialog.newFormNumber')}</Label>
              <Input
                id="form-template-number"
                value={formNumber}
                onChange={(e) => setFormNumber(e.target.value)}
                placeholder={t('uploadDialog.newFormNumberPlaceholder')}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">{t('uploadDialog.newFormNumberHint')}</p>
            </div>
          )}

          {/* 개정 모드에서만 changeSummary 입력 (UL-QP-03 §7.5) */}
          {isReviseMode && (
            <div className="space-y-2">
              <Label htmlFor="form-template-change-summary">
                {t('uploadDialog.changeSummary')}
              </Label>
              <Textarea
                id="form-template-change-summary"
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder={t('uploadDialog.changeSummaryPlaceholder')}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">{t('uploadDialog.changeSummaryHint')}</p>
            </div>
          )}

          {/* 파일 선택 드롭존 */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={FORM_TEMPLATE_FILE_RULE.accept}
              onChange={handleFileChange}
              className="hidden"
              aria-label={t('uploadDialog.selectFile')}
            />
            <button
              type="button"
              className={`${FORM_TEMPLATES_UPLOAD_TOKENS.dropzone} ${selectedFile ? FORM_TEMPLATES_UPLOAD_TOKENS.dropzoneActive : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <>
                  <FileUp className={FORM_TEMPLATES_UPLOAD_TOKENS.dropzoneIcon} />
                  <span className={FORM_TEMPLATES_UPLOAD_TOKENS.selectedFile}>
                    {selectedFile.name}
                  </span>
                  <span className={FORM_TEMPLATES_UPLOAD_TOKENS.dropzoneHint}>
                    {t('uploadDialog.dropzoneHint')}
                  </span>
                </>
              ) : (
                <>
                  <Upload className={FORM_TEMPLATES_UPLOAD_TOKENS.dropzoneIcon} />
                  <span className={FORM_TEMPLATES_UPLOAD_TOKENS.dropzoneText}>
                    {t('uploadDialog.selectFile')}
                  </span>
                  <span className={FORM_TEMPLATES_UPLOAD_TOKENS.dropzoneHint}>
                    {t('uploadDialog.dropzoneHint')}
                  </span>
                </>
              )}
            </button>
          </div>

          <Button
            className={`${FORM_TEMPLATES_UPLOAD_TOKENS.uploadBtn} ${FORM_TEMPLATES_MOTION.buttonPress}`}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isPending
              ? t('uploadDialog.uploading')
              : mode === 'create'
                ? currentFormNumber
                  ? t('revise')
                  : t('register')
                : t('replace')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
