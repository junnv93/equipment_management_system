'use client';

import { useQuery } from '@tanstack/react-query';
import { getProviders } from 'next-auth/react';
import { queryKeys } from '@/lib/api/query-config';

interface AuthProvidersState {
  hasAzureAD: boolean;
  hasCredentials: boolean;
  providers: Awaited<ReturnType<typeof getProviders>>;
  isLoading: boolean;
  error: Error | null;
}

interface AuthProvidersProps {
  children: (state: AuthProvidersState) => React.ReactNode;
}

export function useAuthProviders(): AuthProvidersState {
  const {
    data: providers,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.auth.providers(),
    queryFn: getProviders,
    staleTime: Infinity, // 런타임에 변경되지 않는 서버 설정값
  });

  return {
    hasAzureAD: !!providers?.['azure-ad'],
    hasCredentials: !!providers?.credentials,
    providers: providers ?? null,
    isLoading,
    error,
  };
}

export function AuthProviders({ children }: AuthProvidersProps) {
  const state = useAuthProviders();
  return <>{children(state)}</>;
}
