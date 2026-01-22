'use client';

import { useState, useEffect } from 'react';
import { getProviders, ClientSafeProvider } from 'next-auth/react';

interface AuthProvidersState {
  hasAzureAD: boolean;
  hasCredentials: boolean;
  providers: Record<string, ClientSafeProvider> | null;
  isLoading: boolean;
}

interface AuthProvidersProps {
  children: (state: AuthProvidersState) => React.ReactNode;
}

export function AuthProviders({ children }: AuthProvidersProps) {
  const [state, setState] = useState<AuthProvidersState>({
    hasAzureAD: false,
    hasCredentials: false,
    providers: null,
    isLoading: true,
  });

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const providers = await getProviders();
        setState({
          hasAzureAD: !!providers?.['azure-ad'],
          hasCredentials: !!providers?.credentials,
          providers,
          isLoading: false,
        });
      } catch (error) {
        console.error('Failed to load auth providers:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadProviders();
  }, []);

  return <>{children(state)}</>;
}

export function useAuthProviders() {
  const [state, setState] = useState<AuthProvidersState>({
    hasAzureAD: false,
    hasCredentials: false,
    providers: null,
    isLoading: true,
  });

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const providers = await getProviders();
        setState({
          hasAzureAD: !!providers?.['azure-ad'],
          hasCredentials: !!providers?.credentials,
          providers,
          isLoading: false,
        });
      } catch (error) {
        console.error('Failed to load auth providers:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadProviders();
  }, []);

  return state;
}
