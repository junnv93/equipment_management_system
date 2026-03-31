'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle2, Download, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { dataMigrationApi } from '@/lib/api/data-migration-api';
import type { MultiSheetExecuteResult, MigrationSheetType } from '@/lib/api/data-migration-api';
import { toast } from 'sonner';

interface ResultStepProps {
  result: MultiSheetExecuteResult;
  onReset: () => void;
}

const SHEET_ORDER: MigrationSheetType[] = ['equipment', 'calibration', 'repair', 'incident'];

export default function ResultStep({ result, onReset }: ResultStepProps) {
  const t = useTranslations('data-migration');
  const router = useRouter();
  const hasErrors = result.totalErrors > 0;
  const hasMultipleSheets = result.sheets.length > 1;

  const handleDownloadErrorReport = async () => {
    try {
      await dataMigrationApi.downloadErrorReport(result.sessionId);
    } catch {
      toast.error(t('errors.downloadFailed'));
    }
  };

  // 표시 순서 정렬
  const sortedSheets = [...result.sheets].sort(
    (a, b) => SHEET_ORDER.indexOf(a.sheetType) - SHEET_ORDER.indexOf(b.sheetType)
  );

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

      {/* 전체 통계 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-green-50 dark:bg-green-950">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-700 dark:text-green-300">
              {result.totalCreated}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t('result.created')}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{result.totalSkipped}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('result.skipped')}</p>
          </CardContent>
        </Card>
        <Card className={hasErrors ? 'bg-red-50 dark:bg-red-950' : 'bg-muted'}>
          <CardContent className="p-4 text-center">
            <p className={`text-3xl font-bold ${hasErrors ? 'text-destructive' : ''}`}>
              {result.totalErrors}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t('result.errors')}</p>
          </CardContent>
        </Card>
      </div>

      {/* 시트별 상세 (멀티시트인 경우) */}
      {hasMultipleSheets && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            {t('result.sheetBreakdown')}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {sortedSheets.map((sheet) => (
              <Card key={sheet.sheetType}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm">{t(`sheets.${sheet.sheetType}`)}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-2 pb-4 px-4 text-center text-xs">
                  <div className="rounded bg-green-50 p-2 dark:bg-green-950">
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">
                      {sheet.createdCount}
                    </p>
                    <p className="text-muted-foreground">{t('result.created')}</p>
                  </div>
                  <div className="rounded bg-muted p-2">
                    <p className="text-lg font-bold">{sheet.skippedCount}</p>
                    <p className="text-muted-foreground">{t('result.skipped')}</p>
                  </div>
                  <div
                    className={`rounded p-2 ${sheet.errorCount > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-muted'}`}
                  >
                    <p
                      className={`text-lg font-bold ${sheet.errorCount > 0 ? 'text-destructive' : ''}`}
                    >
                      {sheet.errorCount}
                    </p>
                    <p className="text-muted-foreground">{t('result.errors')}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

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
