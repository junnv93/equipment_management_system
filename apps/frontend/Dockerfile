# =============================================================================
# Frontend Dockerfile — multi-stage with strict layer caching
# =============================================================================
# Stage layout:
#   base       → corepack + pnpm 만 (이미지 캐싱 anchor)
#   deps       → workspace manifest 만 복사하여 설치 (lockfile-only 캐시 레이어)
#   development→ deps + 소스 (HMR 용)
#   builder    → deps + 소스 빌드 (Next.js standalone)
#   production → standalone server.js + 정적 에셋만 (node_modules 불필요)
#
# 보안:
#   - 모든 런타임 stage 는 built-in node 사용자 (UID/GID 1000) 로 실행
#   - 글로벌 npm 설치(pnpm/typescript/rimraf) 제거 → workspace devDeps 로 일원화
# =============================================================================

# ----- base ------------------------------------------------------------------
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat \
 && corepack enable && corepack prepare pnpm@10.7.1 --activate

# ----- deps (lockfile-only 레이어) -------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# root package.json 의 `preinstall` 훅이 참조하는 스크립트. 파일이 거의 바뀌지
# 않아 manifest 레이어 캐시 재사용률은 유지되면서 `MODULE_NOT_FOUND` 를 제거.
COPY scripts/check-no-stale-lockfiles.mjs ./scripts/check-no-stale-lockfiles.mjs
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/shared-constants/package.json ./packages/shared-constants/
COPY packages/db/package.json ./packages/db/
RUN pnpm install --frozen-lockfile

# ----- development -----------------------------------------------------------
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=deps /app/packages ./packages
COPY . .
# shared 패키지 사전 빌드 (Next.js dev compiler 가 dist/ 참조)
RUN pnpm --filter schemas build && pnpm --filter shared-constants build
RUN chown -R node:node /app
USER node
ENV NODE_ENV=development \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["pnpm", "--filter", "frontend", "run", "dev"]

# ----- builder ---------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=deps /app/packages ./packages
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter schemas build \
 && pnpm --filter shared-constants build \
 && pnpm --filter frontend build

# ----- production ------------------------------------------------------------
FROM base AS production
WORKDIR /app

# wget for HEALTHCHECK + tini for proper signal forwarding
RUN apk add --no-cache wget tini

ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0

# Next.js standalone output (모노레포 구조 보존)
COPY --from=builder --chown=node:node /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder --chown=node:node /app/apps/frontend/.next/static ./apps/frontend/.next/static

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/frontend/server.js"]
