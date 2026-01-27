/**
 * Dashboard Layout (Server Component)
 *
 * Next.js 16 Best Practice:
 * - Server Component에서 세션 검증 수행
 * - 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
 * - 클라이언트 레이아웃 UI는 별도 컴포넌트로 분리
 *
 * 참고: /equipment-management 스킬 - references/auth-architecture.md
 */
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import '@/styles/accessibility.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // Server Component에서 세션 검증
  const session = await getServerSession(authOptions);

  // 세션이 없으면 로그인 페이지로 리다이렉트
  if (!session) {
    redirect('/login');
  }

  // 클라이언트 레이아웃 UI 렌더링
  return <DashboardShell>{children}</DashboardShell>;
}
