# 기술 스택 평가 및 권장 사항

**작성일**: 2026-01-15  
**버전**: 1.0

---

## 📊 현재 기술 스택 평가

### ✅ 우수한 선택 (유지 권장)

| 기술 | 등급 | 평가 |
|------|------|------|
| Next.js 14 | A+ | 최신 버전, App Router 지원 |
| Drizzle ORM | A+ | TypeScript 친화적, 성능 우수 |
| TanStack Query | A+ | 서버 상태 관리의 표준 |
| pnpm + Turborepo | A | 모노레포 최적 조합 |
| NestJS 10 | A | 엔터프라이즈급 아키텍처 |
| PostgreSQL 15 | A | 안정적, 확장 가능 |
| ShadCN/UI | A | 커스터마이징 용이 |
| TypeScript | A+ | 타입 안전성 |

---

## ⚠️ 개선이 필요한 영역

### 1. 클라이언트 상태 관리

**현재**: Zustand  
**문제점**:
- 프로젝트에서 실제로 필요한 전역 상태가 거의 없음
- 대부분의 상태는 서버 상태 (TanStack Query로 충분)
- 불필요한 복잡성 추가

**권장 사항**:

#### 옵션 A: 최소화 (권장)
```typescript
// 1. 서버 상태: TanStack Query
const { data: equipment } = useQuery({
  queryKey: ['equipment', id],
  queryFn: () => fetchEquipment(id),
});

// 2. 로컬 UI 상태: useState/useReducer
const [isModalOpen, setIsModalOpen] = useState(false);

// 3. URL 상태: Next.js searchParams
const searchParams = useSearchParams();
const status = searchParams.get('status');

// 4. Zustand는 진짜 필요한 것만
// - 테마 설정
// - 언어 설정
// - 사용자 세션 정보 (JWT)
```

#### 옵션 B: Jotai로 교체
```typescript
// 더 원자적, Next.js App Router 친화적
import { atom, useAtom } from 'jotai';

// 원자적 상태 정의
const themeAtom = atom<'light' | 'dark'>('light');
const userAtom = atom<User | null>(null);

// 사용
const [theme, setTheme] = useAtom(themeAtom);
```

**결론**: Zustand 사용을 **최소화**하거나 제거하고, 진짜 필요한 전역 상태만 Jotai로 관리

---

### 2. 인증 시스템 부재

**현재**: JWT 언급만 있고 구현 없음  
**문제점**: 인증이 프로젝트의 핵심 기능인데 미완성

**권장 사항**: **NextAuth.js v5 (Auth.js)** 도입

```bash
pnpm add next-auth@beta
```

**구현 예시**:
```typescript
// apps/frontend/auth.config.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        // 백엔드 API로 인증
        const response = await fetch(`${process.env.API_URL}/auth/login`, {
          method: 'POST',
          body: JSON.stringify(credentials),
        });
        
        if (!response.ok) return null;
        return await response.json();
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24시간
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
```

**이점**:
- 표준화된 인증 플로우
- 세션 관리 자동화
- CSRF 보호 내장
- 여러 Provider 지원 (이메일, OAuth 등)

---

### 3. 폼 관리 개선

**현재**: React Hook Form + Zod  
**평가**: 좋은 조합이지만, 개선 가능

**권장 추가**: **Conform** (Next.js App Router 최적화)

```typescript
// 서버 액션과 완벽한 통합
'use server'

import { parseWithZod } from '@conform-to/zod';
import { redirect } from 'next/navigation';

export async function createEquipment(prevState: unknown, formData: FormData) {
  const submission = parseWithZod(formData, {
    schema: createEquipmentSchema,
  });

  if (submission.status !== 'success') {
    return submission.reply();
  }

  // 백엔드 API 호출
  await api.equipment.create(submission.value);
  redirect('/equipment');
}
```

**또는 React Hook Form 유지하되**:
```typescript
// @hookform/resolvers와 Zod 통합 개선
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

const form = useForm({
  resolver: zodResolver(createEquipmentSchema),
  defaultValues: {
    name: '',
    // Drizzle 스키마에서 자동 생성된 기본값
  },
});
```

**결론**: 현재 조합 유지, 단 Drizzle → Zod 자동 변환 활용

---

### 4. 테스트 도구 누락

**현재**: Jest 언급만 있고 설정 미완성  
**문제점**: 테스트 인프라 부족

**권장 사항**:

#### 백엔드 테스트
```bash
cd apps/backend
pnpm add -D @nestjs/testing supertest
```

**이미 설정되어 있음**, 테스트만 작성하면 됨

#### 프론트엔드 테스트 - Vitest로 전환 권장
```bash
cd apps/frontend
pnpm add -D vitest @vitejs/plugin-react jsdom
pnpm add -D @testing-library/react @testing-library/jest-dom
```

**이유**:
- Vite 기반 (Next.js와 더 잘 어울림)
- Jest보다 5-10배 빠름
- ESM 네이티브 지원

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

#### E2E 테스트 - Playwright 추가
```bash
pnpm add -D @playwright/test
```

**이유**:
- 빠르고 안정적
- 여러 브라우저 테스트
- 네트워크 모킹 내장

---

### 5. 개발자 경험 도구

**현재**: ESLint, Prettier만 있음  
**추가 권장**:

#### A. Husky + lint-staged (Pre-commit Hook)
```bash
pnpm add -D husky lint-staged

# package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

#### B. Commitlint (커밋 메시지 검증)
```bash
pnpm add -D @commitlint/cli @commitlint/config-conventional

# commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
```

#### C. Type Coverage (타입 커버리지 추적)
```bash
pnpm add -D type-coverage

# package.json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-coverage": "type-coverage --at-least 95"
  }
}
```

---

## 🚀 추가 권장 도구

### 1. 에러 추적 - Sentry

**추천 이유**:
- 프로덕션 에러 실시간 추적
- 성능 모니터링
- Next.js 네이티브 지원

```bash
pnpm add @sentry/nextjs @sentry/nestjs
```

### 2. 로깅 개선 - Pino

**현재**: Winston 사용 중  
**권장**: Pino로 교체

**이유**:
- Winston보다 5-10배 빠름
- 구조화된 로그
- NestJS와 완벽한 통합

```bash
cd apps/backend
pnpm add nestjs-pino pino-http pino-pretty
```

```typescript
// app.module.ts
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
      },
    }),
  ],
})
```

### 3. API 클라이언트 개선

**현재**: Axios + 수동 타입 정의  
**권장**: **tRPC** 고려 (타입 안전 End-to-End)

```typescript
// 백엔드와 프론트엔드 간 완전한 타입 안전성
// apps/backend/src/trpc/equipment.router.ts
export const equipmentRouter = router({
  list: publicProcedure
    .input(equipmentQuerySchema)
    .query(async ({ input }) => {
      return await equipmentService.findAll(input);
    }),
  
  create: protectedProcedure
    .input(createEquipmentSchema)
    .mutation(async ({ input }) => {
      return await equipmentService.create(input);
    }),
});

// apps/frontend에서
const { data } = trpc.equipment.list.useQuery({ status: 'available' });
//     ^? Equipment[] - 완전한 타입 추론!
```

**대안**: 현재 REST API 유지하되, **OpenAPI → TypeScript 자동 생성**

```bash
pnpm add -D openapi-typescript-codegen

# package.json
{
  "scripts": {
    "generate:api-types": "openapi-typescript-codegen --input http://localhost:3001/api-json --output ./lib/api/generated"
  }
}
```

### 4. 데이터베이스 마이그레이션 도구

**현재**: Drizzle Kit  
**추가 권장**: **Database Seeding** 도구

```typescript
// apps/backend/src/database/seeds/equipment.seed.ts
import { db } from '../drizzle';
import { equipment, teams, users } from '../drizzle/schema';

export async function seedEquipment() {
  // 테스트 데이터 생성
  await db.insert(equipment).values([
    {
      uuid: randomUUID(),
      name: '테스트 장비 1',
      managementNumber: 'EQ-001',
      // ...
    },
  ]);
}
```

---

## 📋 우선순위별 적용 가이드

### 🔥 즉시 적용 (이번 주)

1. **NextAuth.js 추가** - 인증은 핵심 기능
2. **Husky + lint-staged** - 코드 품질 자동화
3. **Vitest 설정** - 테스트 인프라

### ⚡ 중요 (이번 달)

4. **Zustand 최소화** - 불필요한 복잡성 제거
5. **Pino 로깅** - Winston 교체
6. **Database Seeding** - 개발 효율성

### 💡 검토 (필요시)

7. **tRPC 도입** - 타입 안전성 극대화 (큰 변경)
8. **Sentry 추가** - 프로덕션 준비 시
9. **Playwright E2E** - 안정성 확보 필요 시

---

## 🎯 최종 권장 기술 스택

### 유지
- ✅ Next.js 14 (App Router)
- ✅ NestJS 10
- ✅ PostgreSQL 15
- ✅ Drizzle ORM
- ✅ TanStack Query
- ✅ pnpm + Turborepo
- ✅ ShadCN/UI
- ✅ React Hook Form + Zod

### 추가
- ➕ **NextAuth.js v5** (인증)
- ➕ **Vitest** (프론트엔드 테스트)
- ➕ **Pino** (로깅)
- ➕ **Husky + lint-staged** (Pre-commit)
- ➕ **Playwright** (E2E 테스트)

### 최소화 또는 제거
- ➖ **Zustand** (최소화, 또는 Jotai로 교체)
- ➖ **Winston** (Pino로 교체)

### 선택적 (큰 변경)
- 🤔 **tRPC** (REST 대신, 타입 안전성 극대화)

---

## 📊 비교표

| 구분 | 현재 | 권장 | 이유 |
|------|------|------|------|
| 인증 | 없음 | NextAuth.js | 표준화, 보안 |
| 상태관리 | Zustand | 최소화/Jotai | 단순화 |
| 테스트 | Jest | Vitest | 속도 |
| 로깅 | Winston | Pino | 성능 |
| E2E | 없음 | Playwright | 안정성 |
| API 타입 | 수동 | 자동생성 | 일관성 |

---

## 🎓 학습 리소스

### NextAuth.js v5
- 공식 문서: https://authjs.dev/
- Next.js 통합: https://authjs.dev/getting-started/installation?framework=next.js

### Vitest
- 공식 문서: https://vitest.dev/
- React Testing: https://vitest.dev/guide/ui.html

### Pino
- 공식 문서: https://getpino.io/
- NestJS 통합: https://github.com/iamolegga/nestjs-pino

### Playwright
- 공식 문서: https://playwright.dev/
- Best Practices: https://playwright.dev/docs/best-practices

---

**다음 검토**: 2026-02-15 (1개월 후)
