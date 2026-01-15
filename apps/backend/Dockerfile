# 기본 이미지
FROM node:18-slim AS base
WORKDIR /app
ENV SHELL=/bin/bash

# Install dependencies only when needed
FROM base AS deps
# Install necessary packages
RUN apt-get update && apt-get install -y git && \
    corepack enable && corepack prepare pnpm@latest --activate

# rimraf와 typescript를 프로젝트 의존성으로 설치
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN mkdir -p /app/packages/schemas /app/apps/backend
COPY packages/schemas/package.json ./packages/schemas/
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install
RUN pnpm add rimraf typescript @types/jest zod -w --save-dev

# Copy schemas files
COPY packages/schemas/tsconfig.json ./packages/schemas/
COPY packages/schemas/jest.config.js ./packages/schemas/
COPY packages/schemas/src ./packages/schemas/src

# Debug: List files in schemas directory
RUN echo "Schemas directory contents:" && ls -la /app/packages/schemas/src

# Development image, copy all the files and run nest
FROM base AS development
WORKDIR /app

# Install development tools and pnpm
RUN apt-get update && apt-get install -y git && \
    corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency files and install
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/schemas/node_modules ./packages/schemas/node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules

# Copy source code
COPY . .

# Debug: List files in schemas directory after copying source code
RUN echo "Schemas directory contents after copying source code:" && ls -la /app/packages/schemas/src

# Build schemas package
WORKDIR /app/packages/schemas
RUN echo "Building schemas package in:" && pwd && \
    echo "Directory contents:" && ls -la && \
    echo "tsconfig.json contents:" && cat tsconfig.json && \
    npx rimraf dist && npx tsc -p tsconfig.json --skipLibCheck

# Set up backend
WORKDIR /app/apps/backend

# Environment variables
ENV NODE_ENV development
ENV PORT 3001

# Expose ports
EXPOSE 3001
EXPOSE 9229

# Start the server in development mode
CMD ["sh", "-c", "cd /app/apps/backend && pnpm install && npm run start:dev"]

# 빌드 환경
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/schemas/dist ./packages/schemas/dist
COPY . .

# 스키마 빌드 후 백엔드 빌드
RUN cd packages/schemas && npx rimraf dist && npx tsc -p tsconfig.json --skipLibCheck
RUN cd apps/backend && pnpm run build

# 프로덕션 환경
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# 필요한 파일만 복사
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./package.json
COPY --from=builder /app/packages/schemas/dist ./packages/schemas/dist
COPY --from=builder /app/packages/schemas/package.json ./packages/schemas/package.json

# 프로덕션 의존성만 설치
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
RUN corepack enable && corepack prepare pnpm@10.7.0 --activate
RUN pnpm install --prod --no-frozen-lockfile

# 보안을 위해 루트가 아닌 사용자로 전환
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3001

CMD ["node", "dist/main"] 