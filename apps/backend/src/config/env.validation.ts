import { z } from 'zod';

/**
 * 환경 변수 검증 스키마
 *
 * 애플리케이션 시작 시 필수 환경 변수가 올바르게 설정되었는지 검증합니다.
 * 누락되거나 잘못된 값이 있으면 명확한 에러 메시지와 함께 시작이 실패합니다.
 */
export const envSchema = z.object({
  // 애플리케이션 설정
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),

  // 데이터베이스 설정
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_NAME: z.string().default('equipment_management'),
  DATABASE_URL: z.string().optional(),

  // Redis 설정
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_URL: z.string().optional(),

  // JWT 설정
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRATION: z.string().default('1d'),

  // NextAuth 설정 (프론트엔드 연동)
  NEXTAUTH_SECRET: z.string().optional(),

  // Azure AD 설정 (선택)
  AZURE_AD_CLIENT_ID: z.string().optional(),
  AZURE_AD_CLIENT_SECRET: z.string().optional(),
  AZURE_AD_TENANT_ID: z.string().optional(),

  // 이메일 설정 (선택)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),

  // 로깅 설정
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).default('info'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * 환경 변수 검증 함수
 *
 * ConfigModule.forRoot()의 validate 옵션에서 사용됩니다.
 */
export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `\n\n환경 변수 검증 실패:\n${errors}\n\n` +
        `.env 파일을 확인하거나 필요한 환경 변수를 설정해주세요.\n`
    );
  }

  return result.data;
}
