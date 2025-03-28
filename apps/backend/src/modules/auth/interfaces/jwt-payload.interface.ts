import { UserRole } from './user-role.enum';

export interface JwtPayload {
  sub: number; // 사용자 ID
  email: string;
  role: UserRole;
  iat?: number; // 발급 시간 (자동 추가됨)
  exp?: number; // 만료 시간 (자동 추가됨)
}
