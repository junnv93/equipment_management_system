/**
 * 서버 사이드 인증 세션 유틸리티
 *
 * 서버 컴포넌트에서 사용하는 인증 관련 함수들
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '../auth';

/**
 * 서버 컴포넌트에서 현재 사용자 정보 가져오기
 *
 * @returns 현재 사용자 정보 또는 null
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}
