'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await signIn('azure-ad', { callbackUrl });
    } catch (error) {
      onError?.(error as Error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        'w-full h-12 text-base font-medium',
        'bg-white hover:bg-slate-50 border-slate-200',
        'text-slate-700 hover:text-slate-900',
        'transition-all duration-200',
        'hover:scale-[1.02] active:scale-[0.98]',
        'hover:border-slate-300 hover:shadow-sm',
        className
      )}
      aria-label="Microsoft 계정으로 로그인"
      data-testid="azure-ad-button"
    >
      {isLoading ? (
        <Loader2 className="mr-3 h-5 w-5 animate-spin text-slate-500" aria-hidden="true" />
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
      {isLoading ? '연결 중...' : 'Microsoft 계정으로 로그인'}
    </Button>
  );
}
