import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NotFound() {
  const t = await getTranslations('navigation');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-8 w-8 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-bold tracking-tight text-foreground">404</h1>
          <h2 className="text-xl font-semibold text-foreground">{t('layout.notFoundTitle')}</h2>
          <p className="text-muted-foreground">{t('layout.notFoundDescription')}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="default" asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              {t('layout.goToHome')}
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/equipment">
              <ArrowLeft className="h-4 w-4" />
              {t('layout.goToEquipment')}
            </Link>
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">{t('layout.notFoundHelp')}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Link href="/equipment" className="text-sm text-primary hover:underline">
              {t('equipment')}
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link href="/calibration" className="text-sm text-primary hover:underline">
              {t('calibration')}
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link href="/checkouts" className="text-sm text-primary hover:underline">
              {t('checkouts')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
