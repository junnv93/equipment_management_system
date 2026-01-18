/**
 * 세션 및 토큰 관리 유틸리티
 *
 * 서버 사이드에서 사용하는 세션 및 토큰 관련 함수들
 */

import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

/**
 * 서버 사이드에서 액세스 토큰 가져오기
 *
 * @returns 액세스 토큰 또는 null
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return null;
  }

  return session.accessToken;
}
