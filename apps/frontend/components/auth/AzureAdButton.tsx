'use client';

import { signIn } from 'next-auth/react';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AUTH_CONTENT, AUTH_LAYOUT_TOKENS, TRANSITION_PRESETS } from '@/lib/design-tokens';

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
      variant="default"
      onClick={handleClick}
      disabled={disabled || isPending}
      className={cn(
        'w-full h-12 text-base font-medium text-white',
        'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0078D4]/50',
        TRANSITION_PRESETS.instantBgShadowTransform,
        'hover:scale-[1.01] hover:shadow-[0_4px_12px_rgba(0,120,212,0.3)] active:scale-[0.99]',
        className
      )}
      style={{
        backgroundColor: isPending
          ? AUTH_LAYOUT_TOKENS.microsoft.bgHover
          : AUTH_LAYOUT_TOKENS.microsoft.bg,
      }}
      onMouseEnter={(e) => {
        if (!isPending)
          e.currentTarget.style.backgroundColor = AUTH_LAYOUT_TOKENS.microsoft.bgHover;
      }}
      onMouseLeave={(e) => {
        if (!isPending) e.currentTarget.style.backgroundColor = AUTH_LAYOUT_TOKENS.microsoft.bg;
      }}
      aria-label={AUTH_CONTENT.button.azureAd}
      data-testid="azure-ad-button"
    >
      {isPending ? (
        <Loader2
          className="mr-3 h-5 w-5 motion-safe:animate-spin motion-reduce:animate-none text-white/70"
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
