'use client';

import { signIn } from 'next-auth/react';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AUTH_CONTENT, AUTH_LAYOUT_TOKENS, TRANSITION_PRESETS } from '@/lib/design-tokens';
import { MicrosoftLogo } from '@/lib/brand-assets/microsoft-logo';

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
        'focus-visible:ring-2 focus-visible:ring-offset-2',
        AUTH_LAYOUT_TOKENS.microsoft.focusRing,
        TRANSITION_PRESETS.instantBgShadowTransform,
        'hover:scale-[1.01] active:scale-[0.99]',
        AUTH_LAYOUT_TOKENS.microsoft.hoverShadow,
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
        <MicrosoftLogo className="mr-3 h-5 w-5" />
      )}
      {isPending ? AUTH_CONTENT.button.azureAdLoading : AUTH_CONTENT.button.azureAd}
    </Button>
  );
}
