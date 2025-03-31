# 개발 및 프로덕션 모두에서 사용할 베이스 이미지
FROM node:18-alpine AS base

# 작업 디렉토리 설정
WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm turbo

# 개발 환경 구성
FROM base AS development
ENV NODE_ENV=development

# 패키지 파일 복사
COPY package.json pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/ui/package.json ./packages/ui/

# 의존성 설치 - 전체 패키지 및 프론트엔드 전용 패키지 설치
RUN pnpm install --no-frozen-lockfile

# 소스 코드 복사 (node_modules 제외)
COPY --chown=node:node . .

# 명시적으로 Next.js 디렉토리로 이동하여 실행
WORKDIR /app/apps/frontend

# 개발 서버 시작 (직접 npx 사용)
CMD ["npx", "next", "dev"]

# 빌드 환경 구성
FROM base AS builder
ENV NODE_ENV=production

# 패키지 파일 복사
COPY package.json pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/ui/package.json ./packages/ui/

# 의존성 설치 (개발 의존성 포함)
RUN pnpm install --no-frozen-lockfile

# 소스 코드 복사 (node_modules 제외)
COPY --chown=node:node apps/frontend/app ./apps/frontend/app
COPY --chown=node:node apps/frontend/pages ./apps/frontend/pages
COPY --chown=node:node apps/frontend/public ./apps/frontend/public
COPY --chown=node:node apps/frontend/styles ./apps/frontend/styles
COPY --chown=node:node apps/frontend/tsconfig.json ./apps/frontend/
COPY --chown=node:node apps/frontend/next.config.js ./apps/frontend/
COPY --chown=node:node apps/frontend/tailwind.config.js ./apps/frontend/
COPY --chown=node:node packages/api-client/src ./packages/api-client/src
COPY --chown=node:node packages/schemas/src ./packages/schemas/src
COPY --chown=node:node packages/ui/src ./packages/ui/src
COPY --chown=node:node packages/api-client/tsconfig.json ./packages/api-client/
COPY --chown=node:node packages/schemas/tsconfig.json ./packages/schemas/
COPY --chown=node:node packages/ui/tsconfig.json ./packages/ui/
COPY --chown=node:node tsconfig.json .

# 빌드
RUN pnpm turbo run build --filter=frontend...

# 프로덕션 환경 구성
FROM node:18-alpine AS production
ENV NODE_ENV=production

WORKDIR /app

# 빌드된 파일과 필요한 파일만 복사
COPY --from=builder /app/apps/frontend/next.config.js .
COPY --from=builder /app/apps/frontend/package.json .
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

# 사용자 변경 (보안 강화)
USER node

# 서버 시작
CMD ["node", "apps/frontend/server.js"]

EXPOSE 3000 