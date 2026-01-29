# 워크스페이스 관리 가이드

## 개요

장비 관리 시스템은 pnpm 워크스페이스와 Turborepo를 사용하는 모노레포 구조입니다. 이 문서에서는 프로젝트의 워크스페이스 구조와 효과적인 관리 방법을 설명합니다.

## 워크스페이스 구조

```
/
├── apps/                    # 애플리케이션
│   ├── backend/             # NestJS 백엔드 앱
│   └── frontend/            # Next.js 프론트엔드 앱
├── packages/                # 공유 패키지
│   ├── schemas/             # 공유 스키마 및 타입 (Zod)
│   └── db/                  # Drizzle ORM 스키마
```

## 각 워크스페이스 역할

### 애플리케이션(apps)

1. **frontend**

   - Next.js 기반 웹 애플리케이션
   - 사용자 인터페이스 및 클라이언트 로직 구현
   - `@equipment-management/schemas` 패키지 활용

2. **backend**
   - NestJS 기반 API 서버
   - 데이터베이스 접근 및 비즈니스 로직 구현
   - `@equipment-management/schemas` 패키지 활용

### 공유 패키지(packages)

1. **schemas**

   - TypeScript 타입 및 Zod 스키마 정의
   - 프론트엔드와 백엔드 간 데이터 계약 역할
   - API 요청/응답 타입, DB 엔티티 타입 등 정의

2. **db**

   - Drizzle ORM 스키마 정의
   - 데이터베이스 마이그레이션 관리
   - 백엔드에서 활용

> **Note**: API 클라이언트는 `apps/frontend/lib/api/`에서 직접 구현됩니다.
> NextAuth 세션 기반 인증을 사용하므로 별도 패키지로 분리하지 않습니다.

## 워크스페이스 간 의존성 관리

1. **올바른 의존성 방향**

   ```
   frontend → schemas
        ↓
   backend → db → schemas
   ```

2. **잘못된 의존성 방향(금지)**

   ```
   schemas → db/frontend/backend
   backend → frontend
   db → frontend
   ```

3. **의존성 선언 방법**

   패키지 간 의존성은 `package.json`에 다음과 같이 선언합니다:

   ```json
   {
     "dependencies": {
       "@equipment-management/schemas": "workspace:*",
       "@equipment-management/db": "workspace:*"
     }
   }
   ```

## 공유 패키지 개발 및 빌드

1. **패키지 구조**

   각 공유 패키지는 다음 구조를 따릅니다:

   ```
   packages/패키지명/
   ├── package.json
   ├── tsconfig.json
   ├── src/
   │   ├── index.ts        # 메인 엔트리 포인트
   │   └── components/     # 실제 구현
   └── dist/               # 빌드 결과물
   ```

2. **패키지 빌드**

   ```bash
   # 모든 패키지 빌드
   pnpm build

   # 특정 패키지만 빌드
   pnpm schemas build
   ```

3. **로컬 개발 중 패키지 변경 사항 반영**

   ```bash
   # packages/schemas/ 변경 시
   pnpm schemas build

   # 또는 watch 모드로 실행
   pnpm schemas dev
   ```

## 새 워크스페이스 추가하기

1. **공유 패키지 추가**

   ```bash
   # 새 패키지 디렉토리 생성
   mkdir -p packages/new-package

   # package.json 생성
   cat > packages/new-package/package.json << EOF
   {
     "name": "@equipment-management/new-package",
     "version": "0.0.1",
     "private": true,
     "main": "./dist/index.js",
     "module": "./dist/index.mjs",
     "types": "./dist/index.d.ts",
     "scripts": {
       "dev": "tsup --watch",
       "build": "tsup",
       "clean": "rimraf dist"
     },
     "devDependencies": {
       "tsup": "^8.0.0",
       "typescript": "^5.0.0",
       "rimraf": "^5.0.0"
     }
   }
   EOF

   # tsconfig.json 생성
   cat > packages/new-package/tsconfig.json << EOF
   {
     "extends": "../../tsconfig.json",
     "compilerOptions": {
       "outDir": "./dist"
     },
     "include": ["src"]
   }
   EOF

   # 기본 소스 파일 생성
   mkdir -p packages/new-package/src
   echo "export const hello = 'world';" > packages/new-package/src/index.ts
   ```

2. **앱 추가**

   앱을 추가하는 과정은 기존 프레임워크의 CLI 도구를 활용합니다.

   ```bash
   # NestJS 앱 추가 예시
   cd apps
   nest new my-service --skip-git --package-manager pnpm

   # Next.js 앱 추가 예시
   cd apps
   pnpm create next-app my-app --ts --tailwind --eslint --app --src-dir
   ```

## 워크스페이스 패키지 버전 관리

1. **버전 관리 전략**

   - 각 패키지는 독립적인 버전을 가질 수 있습니다.
   - 공유 패키지는 변경 사항이 생길 때마다 버전을 올립니다.
   - 앱은 일반적으로 버전을 자주 올리지 않습니다.

2. **버전 업데이트 프로세스**

   ```bash
   # 특정 패키지 버전 업데이트
   cd packages/schemas
   npm version patch  # patch, minor, major 중 선택

   # 의존하는 모든 패키지 업데이트
   pnpm install
   ```

## 환경 변수 관리

1. **공통 환경 변수**

   루트 `.env` 파일에 공통 환경 변수를 정의합니다.

2. **앱별 환경 변수**

   각 앱 디렉토리에 `.env.local`, `.env.development`, `.env.production` 파일을 생성합니다.

3. **빌드 시 환경 변수**

   Turborepo `turbo.json`에 환경 변수 참조 설정:

   ```json
   {
     "globalDependencies": [".env"],
     "pipeline": {
       "build": {
         "dependsOn": ["^build"],
         "env": ["NODE_ENV", "API_URL"]
       }
     }
   }
   ```

## 워크스페이스 관리 문제 해결

1. **의존성 해결 문제**

   ```bash
   # 모든 node_modules 제거 후 재설치
   pnpm clean
   pnpm install
   ```

2. **패키지 export 문제**

   패키지의 `package.json` exports 필드 확인:

   ```json
   {
     "exports": {
       ".": {
         "import": "./dist/index.mjs",
         "require": "./dist/index.js",
         "types": "./dist/index.d.ts"
       }
     }
   }
   ```

3. **빌드 순서 문제**

   Turborepo 의존성 그래프 확인:

   ```bash
   pnpm turbo build --graph
   ```
