'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle2, Download, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { dataMigrationApi } from '@/lib/api/data-migration-api';
import type { MigrationExecuteResult } from '@/lib/api/data-migration-api';
import { toast } from 'sonner';

interface ResultStepProps {
  result: MigrationExecuteResult;
  onReset: () => void;
}

export default function ResultStep({ result, onReset }: ResultStepProps) {
  const t = useTranslations('data-migration');
  const router = useRouter();
  const hasErrors = result.errorCount > 0;

  const handleDownloadErrorReport = async () => {
    try {
      await dataMigrationApi.downloadErrorReport(result.sessionId);
    } catch {
      toast.error(t('errors.downloadFailed'));
    }
  };

  return (
    <div className="space-y-6">
      {/* 결과 헤더 */}
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        {hasErrors ? (
          <AlertTriangle className="h-12 w-12 text-amber-500" />
        ) : (
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        )}
        <h2 className="text-xl font-semibold">{t('result.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {hasErrors ? t('result.partialSuccess') : t('result.success')}
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-green-50 dark:bg-green-950">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-700 dark:text-green-300">
              {result.createdCount}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t('result.created')}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{result.skippedCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('result.skipped')}</p>
          </CardContent>
        </Card>
        <Card className={hasErrors ? 'bg-red-50 dark:bg-red-950' : 'bg-muted'}>
          <CardContent className="p-4 text-center">
            <p className={`text-3xl font-bold ${hasErrors ? 'text-destructive' : ''}`}>
              {result.errorCount}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t('result.errors')}</p>
          </CardContent>
        </Card>
      </div>

      {/* 액션 버튼 */}
      <div className="flex flex-wrap justify-center gap-3">
        {hasErrors && (
          <Button variant="outline" onClick={handleDownloadErrorReport}>
            <Download className="mr-2 h-4 w-4" />
            {t('result.downloadErrorReport')}
          </Button>
        )}
        <Button variant="outline" onClick={onReset}>
          {t('result.migrateAgain')}
        </Button>
        <Button onClick={() => router.push(FRONTEND_ROUTES.EQUIPMENT.LIST)}>
          {t('result.viewEquipmentList')}
        </Button>
      </div>
    </div>
  );
}
