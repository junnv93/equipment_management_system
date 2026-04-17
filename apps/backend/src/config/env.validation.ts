import { z } from 'zod';

/**
 * 환경 변수 검증 스키마
 *
 * 애플리케이션 시작 시 필수 환경 변수가 올바르게 설정되었는지 검증합니다.
 * 누락되거나 잘못된 값이 있으면 명확한 에러 메시지와 함께 시작이 실패합니다.
 */
export const envSchema = z
  .object({
    // 애플리케이션 설정
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3001),
    BODY_SIZE_LIMIT: z.string().default('10mb'),

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
    REDIS_PASSWORD: z.string().optional(),

    // 캐시 드라이버 설정 (memory: 기본, redis: 프로덕션 권장)
    CACHE_DRIVER: z.enum(['memory', 'redis']).default('memory'),

    // JWT 설정
    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
    JWT_EXPIRATION: z.string().default('1d'),

    // Handover QR 토큰 (QR Phase 3) — 인수인계 1회용 서명 토큰. JWT_SECRET과 분리된 별도 secret.
    HANDOVER_TOKEN_SECRET: z
      .string()
      .min(32, 'HANDOVER_TOKEN_SECRET must be at least 32 characters'),

    // Internal API 설정 (서비스 간 통신)
    INTERNAL_API_KEY: z.string().min(32, 'INTERNAL_API_KEY must be at least 32 characters'),
    INTERNAL_API_KEY_PREVIOUS: z.string().optional(),

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
    SMTP_FROM: z.string().email().optional(),
    SMTP_SECURE: z.coerce.boolean().default(false),

    // 보안 설정
    PERMISSIONS_GUARD_MODE: z.enum(['AUDIT', 'DENY']).default('DENY'),
    FRONTEND_URL: z.string().url().optional(),
    REFRESH_TOKEN_SECRET: z.string().min(16).optional(),
    ENABLE_SWAGGER: z.string().optional(),

    // 로깅 설정
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).default('info'),

    // 파일 스토리지 설정
    STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
    UPLOAD_DIR: z.string().default('./uploads'),

    // S3 호환 오브젝트 스토리지 (RustFS) — STORAGE_DRIVER=s3 시 필수
    S3_ENDPOINT: z.string().url().optional(),
    S3_ACCESS_KEY: z.string().min(1).optional(),
    S3_SECRET_KEY: z.string().min(1).optional(),
    S3_BUCKET: z.string().default('equipment-files'),
  })
  .refine(
    (data) =>
      data.STORAGE_DRIVER !== 's3' ||
      (data.S3_ENDPOINT !== undefined &&
        data.S3_ACCESS_KEY !== undefined &&
        data.S3_SECRET_KEY !== undefined),
    { message: 'S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY는 STORAGE_DRIVER=s3일 때 필수입니다' }
  )
  .refine(
    (data) =>
      data.NODE_ENV !== 'production' ||
      (data.FRONTEND_URL !== undefined && data.FRONTEND_URL !== ''),
    { message: 'FRONTEND_URL은 프로덕션 환경에서 필수입니다 (CORS origin 설정에 필요)' }
  );

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * env-sync drift 검증용 시나리오
 *
 * envSchema 의 `.refine()` 은 조건부 required (NODE_ENV=production, STORAGE_DRIVER=s3)
 * 를 강제하지만, 빈 객체로 safeParse 하면 기본값(`NODE_ENV: development`) 때문에
 * 해당 refine 이 trigger 되지 않는다. 따라서 `scripts/verify-env-sync.ts` 는 각
 * 시나리오를 **모두** safeParse 하여 required 키의 union 을 추출해야 .env.example
 * drift 를 완전 커버한다.
 *
 * 새 `.refine()` 을 envSchema 에 추가하면 반드시 여기에도 대응 시나리오를 추가하라.
 */
export const ENV_SYNC_SCENARIOS = {
  /** 기본 (development) — always-required 키만 */
  base: {},
  /** 프로덕션 — FRONTEND_URL refine 활성화 */
  production: { NODE_ENV: 'production' },
  /** S3 스토리지 — S3_* refine 활성화 */
  s3Storage: { STORAGE_DRIVER: 's3' },
  /** 프로덕션 + S3 — 모든 refine 활성화 */
  productionS3: { NODE_ENV: 'production', STORAGE_DRIVER: 's3' },
} as const satisfies Record<string, Record<string, string>>;

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
