'use client';

import { useQuery } from '@tanstack/react-query';
import { getProviders } from 'next-auth/react';

interface AuthProvidersState {
  hasAzureAD: boolean;
  hasCredentials: boolean;
  providers: Awaited<ReturnType<typeof getProviders>>;
  isLoading: boolean;
}

interface AuthProvidersProps {
  children: (state: AuthProvidersState) => React.ReactNode;
}

export function useAuthProviders(): AuthProvidersState {
  const { data: providers, isLoading } = useQuery({
    queryKey: ['auth', 'providers'],
    queryFn: getProviders,
    staleTime: Infinity, // 런타임에 변경되지 않는 서버 설정값
  });

  return {
    hasAzureAD: !!providers?.['azure-ad'],
    hasCredentials: !!providers?.credentials,
    providers: providers ?? null,
    isLoading,
  };
}

export function AuthProviders({ children }: AuthProvidersProps) {
  const state = useAuthProviders();
  return <>{children(state)}</>;
}
