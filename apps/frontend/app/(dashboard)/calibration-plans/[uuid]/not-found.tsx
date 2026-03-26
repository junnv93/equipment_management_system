import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, ArrowLeft, List } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getPageContainerClasses } from '@/lib/design-tokens';

export default async function CalibrationPlanNotFound() {
  const t = await getTranslations('calibration');

  return (
    <div className={getPageContainerClasses('list', '')}>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mt-6 text-2xl font-bold tracking-tight">{t('notFound.title')}</h2>
        <p className="mt-2 text-muted-foreground max-w-md whitespace-pre-line">
          {t('notFound.description')}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="gap-2">
            <Link href="/calibration-plans">
              <List className="h-4 w-4" />
              {t('notFound.backToList')}
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              {t('notFound.backToHome')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
