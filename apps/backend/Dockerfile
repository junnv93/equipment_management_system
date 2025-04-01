FROM node:18-alpine AS base
WORKDIR /app

# 공통 의존성 레이어
FROM base AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

# 의존성 파일만 복사하여 레이어 캐싱 활용
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages ./packages/

# 의존성 설치
RUN pnpm install --strict-peer-dependencies=false

# 개발 환경
FROM base AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=development
ENV PORT=3001
EXPOSE 3001
EXPOSE 9229

# 개발 환경에서 pnpm 설치
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

# 백엔드 서비스 실행
CMD ["pnpm", "--filter", "backend", "start:dev"]

# 빌드 환경
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# pnpm 설치
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

# 빌드 실행
RUN pnpm --filter backend build

# 프로덕션 환경
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# 필요한 파일만 복사
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/apps/backend/package.json ./

# 프로덕션 의존성만 설치
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/packages ./packages/
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate
RUN pnpm install --prod --strict-peer-dependencies=false

# 보안을 위해 루트가 아닌 사용자로 전환
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3001

CMD ["node", "dist/main"] 