import type { ReactNode } from 'react';
import { SettingsNavigationClient } from './SettingsNavigationClient';

/**
 * 설정 레이아웃 (Server Component — Non-Blocking)
 *
 * cacheComponents 호환 아키텍처:
 * - async 없음 → 정적 셸로 즉시 프리렌더 가능
 * - 인증 가드: middleware.ts에서 처리 (렌더링 전 JWT 검증)
 * - 역할 기반 네비게이션: SettingsNavigationClient에서 useSession()으로 자체 접근
 *
 * 크로스 사이트 워크플로우:
 * - 역할 기반 네비게이션 항목은 SessionProvider에서 제공
 * - middleware가 인증 보장 → useSession()은 항상 유효한 세션 반환
 * - technical_manager+ 역할만 관리 섹션 노출
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* 정적 헤더 — RSC에서 렌더링 (클라이언트 번들 미포함) */}
      <div className="relative mb-8 overflow-hidden rounded-lg bg-gradient-to-br from-primary/5 via-background to-background p-8 border border-primary/10">
        <div className="absolute inset-0 opacity-[0.015]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
              `,
              backgroundSize: '24px 24px',
            }}
          />
        </div>
        <div className="relative">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">설정</h1>
          <p className="text-muted-foreground text-sm">
            시스템 환경설정 및 개인화 옵션을 관리합니다
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* CSC 네비게이션: useSession()으로 역할 자체 접근 */}
        <SettingsNavigationClient />

        {/* 콘텐츠 영역 */}
        <div className="flex-1 min-w-0">
          <div
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationFillMode: 'backwards' }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
