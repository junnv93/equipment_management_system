# ==========================
# Development Stage
# ==========================
FROM node:20-bullseye AS development

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.7.1 --activate

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY .npmrc ./

# Copy ALL workspace package.json files
COPY apps/backend/package.json ./apps/backend/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/db/package.json ./packages/db/
COPY packages/shared-constants/package.json ./packages/shared-constants/

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Build shared packages
RUN pnpm --filter schemas build || echo "schemas build failed, continuing..."
RUN pnpm --filter db build || echo "db build failed, continuing..."

# Expose ports
EXPOSE 3001 9229

# Set working directory to root for pnpm workspace commands
WORKDIR /app

# Run backend development server
CMD ["pnpm", "--filter", "backend", "run", "start:dev"]

# ==========================
# Production Builder
# ==========================
FROM node:20-bullseye AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.7.1 --activate

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy ALL workspace package.json files
COPY apps/backend/package.json ./apps/backend/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/db/package.json ./packages/db/
COPY packages/shared-constants/package.json ./packages/shared-constants/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build packages in correct order
RUN pnpm --filter schemas build
RUN pnpm --filter shared-constants build
RUN pnpm --filter db build || echo "db build skipped"
RUN pnpm --filter backend build

# ==========================
# Production Dependencies
# ==========================
FROM node:20-alpine AS prod-deps

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.7.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/db/package.json ./packages/db/
COPY packages/shared-constants/package.json ./packages/shared-constants/

RUN pnpm install --frozen-lockfile --prod

# ==========================
# Production Stage
# ==========================
FROM node:20-alpine AS production

WORKDIR /app

# Copy production-only dependencies (devDependencies excluded)
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/packages/schemas/dist ./packages/schemas/dist
COPY --from=builder /app/packages/schemas/package.json ./packages/schemas/
COPY --from=builder /app/packages/shared-constants/dist ./packages/shared-constants/dist
COPY --from=builder /app/packages/shared-constants/package.json ./packages/shared-constants/
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/

# Environment
ENV NODE_ENV=production

# 보안을 위해 루트가 아닌 사용자로 전환
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 3001

# Run production server
CMD ["node", "apps/backend/dist/main.js"]
