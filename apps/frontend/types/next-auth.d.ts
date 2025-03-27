import 'next-auth';
import { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * 기본 세션에 확장된 프로퍼티 추가
   */
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }

  /**
   * 사용자 객체에 확장된 프로퍼티 추가
   */
  interface User {
    id: string;
    role: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * JWT 토큰에 확장된 프로퍼티 추가
   */
  interface JWT {
    role: string;
  }
} 