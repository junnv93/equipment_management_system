'use client';

import { useState, useEffect } from 'react';
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

export function useAuthProviders() {
  const [state, setState] = useState<AuthProvidersState>({
    hasAzureAD: false,
    hasCredentials: false,
    providers: null,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    getProviders()
      .then((providers) => {
        if (!cancelled) {
          setState({
            hasAzureAD: !!providers?.['azure-ad'],
            hasCredentials: !!providers?.credentials,
            providers,
            isLoading: false,
          });
        }
      })
      .catch((error) => {
        console.error('Failed to load auth providers:', error);
        if (!cancelled) {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function AuthProviders({ children }: AuthProvidersProps) {
  const state = useAuthProviders();
  return <>{children(state)}</>;
}
