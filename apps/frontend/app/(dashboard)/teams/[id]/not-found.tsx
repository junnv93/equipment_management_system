import Link from 'next/link';
import { Users, ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { getPageContainerClasses } from '@/lib/design-tokens';

/**
 * 팀 상세 Not Found 페이지
 */
export default async function TeamNotFound() {
  const t = await getTranslations('teams');

  return (
    <div className={getPageContainerClasses('list', '')}>
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="bg-muted rounded-full p-4 mb-4">
          <Users className="h-12 w-12 text-muted-foreground" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">{t('notFound.title')}</h1>

        <p className="text-muted-foreground mb-6 max-w-md">{t('notFound.descriptionDetail')}</p>

        <Button asChild className="gap-2">
          <Link href="/teams">
            <ArrowLeft className="h-4 w-4" />
            {t('notFound.backToList')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
