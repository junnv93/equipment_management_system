'use client';

import { RouteError } from '@/components/layout/RouteError';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RouteErrorPage({ error, reset }: ErrorPageProps) {
  return <RouteError error={error} reset={reset} />;
}
