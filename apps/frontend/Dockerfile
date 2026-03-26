FROM node:20-alpine AS base
WORKDIR /app

# 공통 의존성 레이어
FROM base AS deps
RUN apk add --no-cache libc6-compat && \
    npm install -g pnpm@10.7.0 next typescript rimraf

# 의존성 파일만 복사하여 레이어 캐싱 활용
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY packages/schemas/package.json ./packages/schemas/
COPY apps/frontend/package.json ./apps/frontend/

# 재현 가능한 빌드를 위해 lockfile 고정
RUN pnpm install --frozen-lockfile

# 개발 환경
FROM base AS development
WORKDIR /app

# 필요한 개발 도구 설치
RUN apk add --no-cache curl && \
    npm install -g pnpm@10.7.0 next typescript rimraf

# deps 단계에서 설치한 의존성 복사
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules

# 소스 코드 복사
COPY . .

# schemas 패키지 빌드
WORKDIR /app/packages/schemas
RUN rimraf dist && npx tsc -p tsconfig.json --skipLibCheck

# 프론트엔드 작업 디렉토리로 이동
WORKDIR /app/apps/frontend

# pnpm 경로 설정
ENV PNPM_HOME=/usr/local/bin
ENV PATH=${PNPM_HOME}:${PATH}:/app/node_modules/.bin

ENV NODE_ENV=development
ENV PORT=3000
EXPOSE 3000

# 프론트엔드 서비스 실행
CMD ["npm", "run", "dev"]

# 빌드 환경
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 필요한 도구 설치
RUN npm install -g typescript rimraf

# 스키마 빌드 후 프론트엔드 빌드
RUN cd packages/schemas && rimraf dist && npx tsc -p tsconfig.json --skipLibCheck
RUN cd apps/frontend && npm run build

ENV NEXT_TELEMETRY_DISABLED 1

# 프로덕션 환경
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED 1

# 필요한 파일만 복사
COPY --from=build /app/apps/frontend/public ./public
COPY --from=build /app/apps/frontend/.next ./.next
COPY --from=build /app/apps/frontend/next.config.js ./
COPY --from=build /app/apps/frontend/package.json ./
COPY --from=build /app/packages/schemas/dist ./packages/schemas/dist
COPY --from=build /app/packages/schemas/package.json ./packages/schemas/package.json

# 프로덕션 의존성만 설치
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate
RUN pnpm install --prod --frozen-lockfile

# 보안을 위해 루트가 아닌 사용자로 전환
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

# 프로덕션 서비스 실행
CMD ["node", "node_modules/.bin/next", "start"] 