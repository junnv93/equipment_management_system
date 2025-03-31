# 개발 및 프로덕션 모두에서 사용할 베이스 이미지
FROM node:18-alpine AS base

# 작업 디렉토리 설정
WORKDIR /app

# pnpm과 필요한 글로벌 패키지 설치
RUN npm install -g pnpm turbo @nestjs/cli

# 개발 환경 구성
FROM base AS development
ENV NODE_ENV=development

# 패키지 파일 복사
COPY package.json pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/schemas/package.json ./packages/schemas/

# 전체 모노레포 의존성 설치
RUN pnpm install --no-frozen-lockfile

# 각 패키지 내 의존성 설치
RUN cd apps/backend && pnpm install --no-frozen-lockfile
RUN cd packages/schemas && pnpm install --no-frozen-lockfile

# 소스 코드 복사 (전체 프로젝트 복사)
COPY --chown=node:node . .

# 개발 서버 시작
CMD ["pnpm", "--filter", "backend", "start:dev"]

# 빌드 환경 구성
FROM base AS builder
ENV NODE_ENV=production

# 패키지 파일 복사
COPY package.json pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/schemas/package.json ./packages/schemas/

# 전체 모노레포 의존성 설치
RUN pnpm install --no-frozen-lockfile

# 각 패키지 내 의존성 설치
RUN cd apps/backend && pnpm install --no-frozen-lockfile
RUN cd packages/schemas && pnpm install --no-frozen-lockfile

# 소스 코드 복사 (node_modules 제외)
COPY --chown=node:node apps/backend/src ./apps/backend/src
COPY --chown=node:node apps/backend/drizzle ./apps/backend/drizzle
COPY --chown=node:node apps/backend/tsconfig.json ./apps/backend/
COPY --chown=node:node apps/backend/nest-cli.json ./apps/backend/
COPY --chown=node:node packages/schemas/src ./packages/schemas/src
COPY --chown=node:node packages/schemas/tsconfig.json ./packages/schemas/
COPY --chown=node:node tsconfig.json .

# 빌드
RUN pnpm turbo run build --filter=backend...

# 프로덕션 환경 구성
FROM node:18-alpine AS production
ENV NODE_ENV=production

WORKDIR /app

# 프로덕션 의존성만 설치
COPY package.json pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/schemas/package.json ./packages/schemas/

# 전체 모노레포 의존성 설치 (프로덕션 의존성만)
RUN pnpm install --prod --no-frozen-lockfile

# 각 패키지 내 프로덕션 의존성 설치
RUN cd apps/backend && pnpm install --prod --no-frozen-lockfile
RUN cd packages/schemas && pnpm install --prod --no-frozen-lockfile

# 빌드된 파일과 필요한 파일만 복사
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages/schemas/dist ./packages/schemas/dist

# 사용자 변경 (보안 강화)
USER node

# 서버 시작
CMD ["node", "apps/backend/dist/main.js"]

EXPOSE 3001 