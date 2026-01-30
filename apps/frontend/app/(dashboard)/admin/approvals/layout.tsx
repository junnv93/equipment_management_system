import type { ReactNode } from 'react';

export const metadata = {
  title: '승인 관리 | 장비 관리 시스템',
  description: '장비, 교정, 반출 등 각종 승인 요청을 통합 관리합니다.',
};

export default function ApprovalsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
