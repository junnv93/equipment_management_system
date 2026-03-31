'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { documentApi, type DocumentRecord } from '@/lib/api/document-api';
import { getMimeCategory } from '@equipment-management/shared-constants';
import { cn } from '@/lib/utils';
import { TRANSITION_PRESETS } from '@/lib/design-tokens';

interface DocumentPreviewDialogProps {
  document: DocumentRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentPreviewDialog({
  document: doc,
  open,
  onOpenChange,
}: DocumentPreviewDialogProps) {
  const t = useTranslations('equipment.attachmentsTab');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isBlob, setIsBlob] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);

  const category = doc ? getMimeCategory(doc.mimeType) : 'other';

  const loadPreview = useCallback(async () => {
    if (!doc) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await documentApi.getPreviewUrl(doc.id);
      setPreviewUrl(result.url);
      setIsBlob(result.isBlob);
    } catch {
      setError(t('previewError'));
    } finally {
      setIsLoading(false);
    }
  }, [doc, t]);

  useEffect(() => {
    if (open && doc) {
      setImageZoom(1);
      setImageRotation(0);
      loadPreview();
    }
    return () => {
      if (isBlob && previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup on unmount only
  }, [open, doc?.id]);

  const handleDownload = async () => {
    if (!doc) return;
    await documentApi.downloadDocument(doc.id, doc.originalFileName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between pr-8">
            <span className="truncate">{doc?.originalFileName}</span>
            <div className="flex items-center gap-1 ml-4">
              {category === 'image' && previewUrl && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setImageZoom((z) => Math.min(z + 0.25, 3))}
                    aria-label={t('zoomIn')}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setImageZoom((z) => Math.max(z - 0.25, 0.25))}
                    aria-label={t('zoomOut')}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setImageRotation((r) => (r + 90) % 360)}
                    aria-label={t('rotate')}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDownload}
                aria-label={t('download')}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto min-h-0">
          {isLoading && (
            <div className="flex items-center justify-center h-96">
              <Skeleton className="w-full h-full rounded-lg" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
              <X className="h-12 w-12 mb-4" />
              <p>{error}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={loadPreview}>
                {t('retry')}
              </Button>
            </div>
          )}

          {!isLoading && !error && previewUrl && (
            <>
              {category === 'image' && (
                <div className="flex items-center justify-center overflow-auto bg-muted/30 rounded-lg p-4 min-h-[300px]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- presigned/blob URL은 next/image 미지원 */}
                  <img
                    src={previewUrl}
                    alt={doc?.originalFileName ?? ''}
                    className={cn(
                      `max-w-full object-contain ${TRANSITION_PRESETS.fastBorderBgTransform}`
                    )}
                    style={{
                      transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                      maxHeight: '70vh',
                    }}
                  />
                </div>
              )}

              {category === 'pdf' && (
                <iframe
                  src={`${previewUrl}#toolbar=1&navpanes=0`}
                  className="w-full rounded-lg border"
                  style={{ height: '70vh' }}
                  title={doc?.originalFileName ?? 'PDF Preview'}
                />
              )}

              {category !== 'image' && category !== 'pdf' && (
                <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
                  <p className="text-lg font-medium mb-2">{t('previewNotSupported')}</p>
                  <p className="text-sm mb-4">{doc?.originalFileName}</p>
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    {t('download')}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
