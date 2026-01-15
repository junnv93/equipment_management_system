FROM node:18-alpine AS base

# ----- 공통 베이스 -----
FROM base AS deps
WORKDIR /app

# 패키지 매니저 설치
RUN corepack enable && corepack prepare pnpm@latest --activate

# 의존성 설치를 위한 파일 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/schemas/package.json ./packages/schemas/

# 의존성 설치
RUN pnpm install --frozen-lockfile

# ----- 개발 환경 -----
FROM base AS development
WORKDIR /app

# 패키지 매니저 설정
RUN corepack enable && corepack prepare pnpm@latest --activate

# 의존성 복사
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 필수 패키지 추가 설치 - workspace 의존성 문제 해결
RUN cd /app/apps/backend && pnpm add @nestjs/jwt@10.2.0 cookie-parser@1.4.6 compression@1.7.4 prom-client drizzle-zod

# 개발 모드 실행 명령
EXPOSE 3001
CMD ["pnpm", "--filter", "backend", "run", "dev"]

# ----- 빌드 환경 -----
FROM base AS builder
WORKDIR /app

# 패키지 매니저 설정
RUN corepack enable && corepack prepare pnpm@latest --activate

# 의존성 복사
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 필수 패키지 추가 설치 - workspace 의존성 문제 해결
RUN cd /app/apps/backend && pnpm add @nestjs/jwt@10.2.0 cookie-parser@1.4.6 compression@1.7.4 prom-client drizzle-zod

# 스키마 및 백엔드 빌드
RUN pnpm --filter schemas build
RUN pnpm --filter backend build

# ----- 프로덕션 환경 -----
FROM base AS production
WORKDIR /app

# 패키지 매니저 설정
RUN corepack enable && corepack prepare pnpm@latest --activate

# 필요한 파일만 복사
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/schemas/dist ./packages/schemas/dist
COPY --from=builder /app/packages/schemas/package.json ./packages/schemas/
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/

# 환경 변수 설정
ENV NODE_ENV=production

# 실행 명령
EXPOSE 3001
CMD ["node", "apps/backend/dist/main.js"] 