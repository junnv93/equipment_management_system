FROM node:18-alpine AS base
WORKDIR /app

# 공통 의존성 레이어
FROM base AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

# 의존성 파일만 복사하여 레이어 캐싱 활용
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages ./packages/

# 의존성 설치
RUN pnpm install --strict-peer-dependencies=false

# 개발 환경
FROM base AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=development
ENV PORT=3000
EXPOSE 3000

# 개발 환경에서 pnpm 설치
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

# 프론트엔드 서비스 실행
CMD ["pnpm", "--filter", "frontend", "dev"]

# 빌드 환경
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# pnpm 설치
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate

# 빌드 실행
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm --filter frontend build

# 프로덕션 환경
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED 1

# 필요한 파일만 복사
COPY --from=build /app/apps/frontend/public ./apps/frontend/public
COPY --from=build /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=build /app/apps/frontend/next.config.js ./apps/frontend/
COPY --from=build /app/apps/frontend/package.json ./apps/frontend/

# 프로덕션 의존성만 설치
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/packages ./packages/
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate
RUN pnpm install --prod --strict-peer-dependencies=false

# 보안을 위해 루트가 아닌 사용자로 전환
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

CMD ["node", "apps/frontend/node_modules/.bin/next", "start", "-p", "3000"] 