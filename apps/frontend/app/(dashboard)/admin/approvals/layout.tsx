import type { ReactNode } from 'react';

// metadata는 page.tsx에서 정의 (중복 방지)

export default function ApprovalsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
