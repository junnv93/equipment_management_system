import 'next-auth';
import 'next-auth/jwt';

/**
 * 사이트 코드 타입
 * teams-api.ts의 Site 타입과 동기화 유지
 */
type SiteCode = 'suwon' | 'uiwang' | 'pyeongtaek';

declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    roles: string[];
    department?: string;
    site?: SiteCode;
    teamId?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      roles: string[];
      department?: string;
      site?: SiteCode;
      teamId?: string;
    };
    accessToken?: string;
    error?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    roles?: string[];
    department?: string;
    site?: SiteCode;
    teamId?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    sessionStartedAt?: number;
    error?: string;
  }
}
