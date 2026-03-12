/**
 * ============================================================================
 * Server-Side 세션 관리 - Single Source of Truth
 * ============================================================================
 *
 * ⚠️ IMPORTANT: Server Component 전용 세션/인증 유틸리티
 *
 * 이 파일은 Server Components에서만 사용됩니다.
 * - Next.js 16 Server Components에서 안전하게 사용 가능
 * - getServerSession()을 통해 NextAuth 세션 접근
 * - 절대로 'use client' 컴포넌트에서 import하지 마세요
 *
 * 아키텍처 원칙:
 * - NextAuth = 단일 인증 소스 (Single Source of Truth)
 * - Server Component: 이 파일의 함수 사용
 * - Client Component: next-auth/react의 getSession() 사용
 * - localStorage 토큰 사용 금지
 *
 * ============================================================================
 */

import { cache } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth';
import { getInternalApiKeyHeaders } from '../config/internal-headers';

/**
 * Per-render deduplication: 동일 렌더 트리 내 여러 호출이 단일 Promise를 공유
 *
 * 문제: Server Component에서 getServerSession()을 여러 번 병렬 호출하면
 * 각각 독립적으로 JWT 콜백을 트리거하여 refreshAccessToken()이 중복 실행됨 (429 유발)
 *
 * 해법: React cache()는 같은 렌더 패스 내 동일 인자 호출을 memoize하여
 * JWT 콜백이 단 한 번만 실행되도록 보장
 *
 * @see https://react.dev/reference/react/cache
 */
const getServerSessionCached = cache(() => getServerSession(authOptions));

/**
 * 서버 컴포넌트에서 현재 세션 가져오기
 *
 * @returns 현재 NextAuth 세션 또는 null
 *
 * @example
 * ```typescript
 * export default async function Page() {
 *   const session = await getServerAuthSession();
 *   if (!session) {
 *     redirect('/login');
 *   }
 *   return <div>Welcome, {session.user?.name}</div>;
 * }
 * ```
 */
export async function getServerAuthSession() {
  return getServerSessionCached();
}

/**
 * 서버 컴포넌트에서 현재 사용자 정보 가져오기
 *
 * @returns 현재 사용자 정보 또는 null
 *
 * @example
 * ```typescript
 * export default async function Page() {
 *   const user = await getCurrentUser();
 *   if (!user) {
 *     redirect('/login');
 *   }
 *   return <div>Welcome, {user.name}</div>;
 * }
 * ```
 */
export async function getCurrentUser() {
  const session = await getServerSessionCached();
  return session?.user || null;
}

/**
 * 서버 사이드에서 액세스 토큰 가져오기
 *
 * @returns 액세스 토큰 또는 null
 *
 * @example
 * ```typescript
 * export default async function Page() {
 *   const token = await getAccessToken();
 *   if (!token) {
 *     redirect('/login');
 *   }
 *   // API 호출 시 사용
 *   const response = await fetch(API_URL, {
 *     headers: { Authorization: `Bearer ${token}` }
 *   });
 * }
 * ```
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getServerSessionCached();
  // ✅ Session 타입에 accessToken이 정의됨 (types/next-auth.d.ts)
  return session?.accessToken ?? null;
}

/**
 * Server Component에서 직접 fetch 사용 시 헬퍼 함수
 *
 * Axios 대신 native fetch를 사용하고 싶을 때 사용
 *
 * @example
 * ```typescript
 * export default async function Page() {
 *   const headers = await getServerAuthHeaders();
 *   const response = await fetch(`${API_BASE_URL}/api/equipment`, {
 *     headers,
 *     cache: 'no-store',
 *   });
 *   const data = await response.json();
 *   return <EquipmentList data={data} />;
 * }
 * ```
 */
export async function getServerAuthHeaders(): Promise<HeadersInit> {
  const accessToken = await getAccessToken();

  return {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...getInternalApiKeyHeaders(),
  };
}

/**
 * 사용자가 인증되었는지 확인
 *
 * @returns 인증 여부
 *
 * @example
 * ```typescript
 * export default async function Page() {
 *   if (!await isAuthenticated()) {
 *     redirect('/login');
 *   }
 *   // ...
 * }
 * ```
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSessionCached();
  return !!session?.user;
}

/**
 * 사용자가 특정 역할을 가지고 있는지 확인
 *
 * @param roles 확인할 역할 목록
 * @returns 역할 보유 여부
 *
 * @example
 * ```typescript
 * export default async function AdminPage() {
 *   if (!await hasRole(['lab_manager', 'technical_manager'])) {
 *     notFound(); // 또는 redirect('/unauthorized')
 *   }
 *   // 관리자 전용 콘텐츠 렌더링
 * }
 * ```
 */
export async function hasRole(roles: string[]): Promise<boolean> {
  const session = await getServerSessionCached();
  const userRole = session?.user?.role;
  if (!userRole) return false;
  return roles.includes(userRole.toLowerCase());
}
