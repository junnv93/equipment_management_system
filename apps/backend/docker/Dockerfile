# =============================================================================
# Backend Dockerfile — multi-stage with strict layer caching
# =============================================================================
# Stage layout:
#   base       → pnpm + corepack 만 (이미지 캐싱 anchor)
#   deps       → workspace manifest 만 복사하여 설치 (lockfile-only 캐시 레이어)
#   development→ deps + 소스 (HMR 용)
#   builder    → deps + 소스 빌드
#   prod-deps  → manifest 만으로 prod-only 의존성 설치
#   production → builder dist + prod-deps node_modules 만 (최소 surface)
#
# 보안:
#   - 모든 런타임 stage 는 built-in node 사용자 (UID/GID 1000) 로 실행
#   - 개발 stage 도 root 회피
# =============================================================================

# ----- base ------------------------------------------------------------------
FROM node:20-bullseye AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.7.1 --activate

# ----- deps (lockfile-only 레이어) -------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/db/package.json ./packages/db/
COPY packages/shared-constants/package.json ./packages/shared-constants/
RUN pnpm install --frozen-lockfile

# ----- development -----------------------------------------------------------
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /app/packages ./packages
COPY . .
# shared 패키지 빌드 (개발 모드 컴파일러가 dist/ 참조)
RUN pnpm --filter schemas build && pnpm --filter shared-constants build && pnpm --filter db build
RUN chown -R node:node /app
USER node
EXPOSE 3001 9229
CMD ["pnpm", "--filter", "backend", "run", "start:dev"]

# ----- builder ---------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /app/packages ./packages
COPY . .
RUN pnpm --filter schemas build \
 && pnpm --filter shared-constants build \
 && pnpm --filter db build \
 && pnpm --filter backend build

# ----- prod-deps (alpine) ----------------------------------------------------
FROM node:20-alpine AS prod-deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.7.1 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/db/package.json ./packages/db/
COPY packages/shared-constants/package.json ./packages/shared-constants/
RUN pnpm install --frozen-lockfile --prod

# ----- production ------------------------------------------------------------
FROM node:20-alpine AS production
WORKDIR /app

# wget for HEALTHCHECK + tini for proper signal forwarding
RUN apk add --no-cache wget tini

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/packages/schemas/dist ./packages/schemas/dist
COPY --from=builder --chown=node:node /app/packages/schemas/package.json ./packages/schemas/
COPY --from=builder --chown=node:node /app/packages/shared-constants/dist ./packages/shared-constants/dist
COPY --from=builder --chown=node:node /app/packages/shared-constants/package.json ./packages/shared-constants/
COPY --from=builder --chown=node:node /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=node:node /app/apps/backend/package.json ./apps/backend/

ENV NODE_ENV=production \
    PORT=3001

USER node
EXPOSE 3001

# /api/health 엔드포인트가 200 응답해야 healthy
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3001/api/monitoring/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/backend/dist/main.js"]
