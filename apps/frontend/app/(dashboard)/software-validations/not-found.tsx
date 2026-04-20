import Link from 'next/link';
import { FileCheck, ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { getPageContainerClasses } from '@/lib/design-tokens';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

export default async function SoftwareValidationsNotFound() {
  const t = await getTranslations('software');

  return (
    <div className={getPageContainerClasses('list', '')}>
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="bg-muted rounded-full p-4 mb-4">
          <FileCheck className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {t('validation.notFound.title')}
        </h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          {t('validation.notFound.description')}
        </p>
        <Button asChild className="gap-2">
          <Link href={FRONTEND_ROUTES.SOFTWARE_VALIDATIONS.LIST}>
            <ArrowLeft className="h-4 w-4" />
            {t('validation.notFound.backToList')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
