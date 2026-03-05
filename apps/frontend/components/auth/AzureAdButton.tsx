'use client';

import { signIn } from 'next-auth/react';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AUTH_CONTENT, getAuthInteractiveScaleClasses } from '@/lib/design-tokens';

interface AzureAdButtonProps {
  callbackUrl?: string;
  disabled?: boolean;
  className?: string;
  onError?: (error: Error) => void;
}

export function AzureAdButton({
  callbackUrl = '/',
  disabled = false,
  className,
  onError,
}: AzureAdButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      try {
        await signIn('azure-ad', { callbackUrl });
      } catch (error) {
        onError?.(error as Error);
      }
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={disabled || isPending}
      className={cn(
        'w-full h-12 text-base font-medium',
        'bg-white hover:bg-slate-50 border-slate-200',
        'dark:bg-card dark:hover:bg-card/90 dark:border-border',
        'text-slate-700 hover:text-slate-900',
        'dark:text-foreground dark:hover:text-foreground',
        'motion-safe:transition-[background-color,border-color,color,box-shadow,transform] motion-safe:duration-200 motion-reduce:transition-none',
        getAuthInteractiveScaleClasses(),
        'hover:border-slate-300 hover:shadow-sm',
        className
      )}
      aria-label={AUTH_CONTENT.button.azureAd}
      data-testid="azure-ad-button"
    >
      {isPending ? (
        <Loader2
          className="mr-3 h-5 w-5 motion-safe:animate-spin motion-reduce:animate-none text-slate-500 dark:text-muted-foreground"
          aria-hidden="true"
        />
      ) : (
        <svg
          className="mr-3 h-5 w-5"
          viewBox="0 0 21 21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect width="10" height="10" fill="#F25022" />
          <rect x="11" width="10" height="10" fill="#7FBA00" />
          <rect y="11" width="10" height="10" fill="#00A4EF" />
          <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
        </svg>
      )}
      {isPending ? AUTH_CONTENT.button.azureAdLoading : AUTH_CONTENT.button.azureAd}
    </Button>
  );
}
