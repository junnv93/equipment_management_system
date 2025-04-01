FROM node:18-alpine AS base

# 공통 레이어 - 모든 스테이지에서 재사용됨
FROM base AS deps
WORKDIR /app

# pnpm 설치
RUN corepack enable && corepack prepare pnpm@latest --activate

# 의존성 파일만 복사 (레이어 캐싱 활용)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/*/package.json ./packages/*/

# 개발 환경
FROM deps AS development
WORKDIR /app

# 필요한 도구 설치
RUN apk add --no-cache python3 make g++

# 모든 의존성 설치 (개발 의존성 포함)
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store \
    pnpm install --no-frozen-lockfile --strict-peer-dependencies=false

# 전체 소스 코드 복사
COPY packages ./packages
WORKDIR /app/apps/backend

# 소스 코드는 개발 환경에서 볼륨으로 마운트됨
EXPOSE 3001 9229

# 백엔드 서비스 실행
CMD ["pnpm", "start:dev"]

# 프로덕션 빌드
FROM deps AS build
WORKDIR /app

# 필요한 도구 설치
RUN apk add --no-cache python3 make g++

# 모든 의존성 설치 (개발 의존성 포함)
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store \
    pnpm install --no-frozen-lockfile --strict-peer-dependencies=false

# 소스 코드 복사
COPY packages ./packages
COPY apps/backend ./apps/backend

# 백엔드 빌드
RUN pnpm --filter=backend build

# 프로덕션 환경 - 최소 이미지
FROM base AS production
WORKDIR /app

# pnpm 설치
RUN corepack enable && corepack prepare pnpm@latest --activate

# 필요한 파일만 복사
COPY --from=deps /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=build /app/apps/backend/package.json ./apps/backend/
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/packages ./packages

# 프로덕션 의존성만 설치 (개발 의존성 제외)
RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store \
    pnpm install --prod --no-frozen-lockfile --strict-peer-dependencies=false

# 보안을 위해 비루트 사용자로 전환
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs
USER nestjs

# 환경 변수 설정
ENV NODE_ENV=production

EXPOSE 3001
CMD ["node", "apps/backend/dist/main"] 