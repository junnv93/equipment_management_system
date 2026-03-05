'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  const t = useTranslations('navigation');

  useEffect(() => {
    console.error('Global error caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t('layout.globalErrorTitle')}
          </h1>
          <p className="text-muted-foreground">
            {error.message || t('layout.globalErrorDescription')}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/60">
              {t('layout.errorCode')} {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t('layout.retry')}
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              {t('layout.goToHome')}
            </Link>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">{t('layout.supportNote')}</p>
      </div>
    </div>
  );
}
