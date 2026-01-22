# 개발 환경 설정 가이드

## 필수 요구사항

장비 관리 시스템 개발을 위해 다음 소프트웨어가 필요합니다:

- **Node.js 18+** (권장: 18.19.0)
- **pnpm 10+** (권장: 10.7.0)
- **Docker** 및 **Docker Compose**
- **Git**

## 시스템 설정

### 1. Node.js 설치

**Windows (권장)**:

- Node.js 공식 사이트에서 LTS 버전 다운로드: https://nodejs.org/

**Node Version Manager 사용(Linux/macOS)**:

```bash
# nvm 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# nvm 활성화
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Node.js 설치
nvm install 18.19.0
nvm use 18.19.0
```

### 2. pnpm 설치

**전역 설치**:

```bash
# npm을 사용하여 pnpm 전역 설치
npm install -g pnpm@10.7.0

# Corepack 사용 (Node.js 16.17+ / 18.6+)
corepack enable
corepack prepare pnpm@10.7.0 --activate
```

### 3. Docker 설치

**Windows**:

- Docker Desktop 다운로드 및 설치: https://www.docker.com/products/docker-desktop/

**Linux**:

```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose 설치
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

**macOS**:

- Docker Desktop 다운로드 및 설치: https://www.docker.com/products/docker-desktop/

## 프로젝트 설정

### 1. 저장소 복제

```bash
# GitHub에서 프로젝트 복제
git clone https://github.com/your-username/equipment-management-system.git
cd equipment-management-system
```

### 2. 의존성 설치

```bash
# 모든 패키지에 대한 의존성 설치
pnpm install
```

### 3. 환경 변수 설정

```bash
# 예시 환경 변수 파일을 복사하여 사용
cp .env.example .env

# 편집기로 .env 파일 열기
# DB 연결 정보, API 키 등 필요한 환경 변수 설정
```

### 4. 개발 환경 실행

**하이브리드 방식 (권장)**:

본 프로젝트는 Docker로 DB/Redis만 실행하고, 애플리케이션은 로컬에서 실행하는 하이브리드 방식을 권장합니다.

```bash
# 1. PostgreSQL과 Redis 시작 (Docker)
docker compose up -d

# 2. 개발 서버 실행 (로컬)
pnpm dev
```

> **참고**: 전체 Docker 컨테이너화는 지원하지 않습니다. 개발 시에는 항상 하이브리드 방식을 사용하세요.

## 개발 환경 구성

### VS Code 설정 (권장)

다음 VS Code 확장 프로그램을 설치하여 개발 경험을 향상시키세요:

1. **ESLint**: 코드 품질 및 스타일 검사
2. **Prettier**: 코드 포맷팅
3. **TypeScript Error Translator**: TypeScript 오류 설명
4. **Docker**: Docker 컨테이너 관리
5. **DotENV**: .env 파일 구문 강조
6. **Tailwind CSS IntelliSense**: Tailwind CSS 자동 완성

**workspace 설정 (`.vscode/settings.json`)**:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## 디버깅 설정

### VS Code 디버깅 구성

`.vscode/launch.json` 파일에 다음 구성을 추가하세요:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Frontend",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/apps/frontend"
    },
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true,
      "sourceMaps": true
    }
  ],
  "compounds": [
    {
      "name": "Debug Full Stack",
      "configurations": ["Debug Frontend", "Debug Backend"]
    }
  ]
}
```

### 백엔드 디버깅

1. 디버그 모드로 백엔드 실행:

   ```bash
   pnpm backend dev:debug
   ```

2. VS Code에서 "Debug Backend" 구성 실행

### 프론트엔드 디버깅

1. 프론트엔드 개발 서버 실행:

   ```bash
   pnpm frontend dev
   ```

2. VS Code에서 "Debug Frontend" 구성 실행

## 테스트 환경 설정

### 테스트 실행

```bash
# 모든 패키지 테스트 실행
pnpm test

# 특정 패키지 테스트
pnpm frontend test

# 감시 모드로 테스트
pnpm test:watch
```

### 코드 커버리지 확인

```bash
pnpm test --coverage
```

## 코드 품질 도구

### 린팅 및 포맷팅

```bash
# 전체 프로젝트 린트
pnpm lint

# 자동 수정 가능한 문제 해결
pnpm lint:fix

# 코드 포맷팅
pnpm format

# 포맷팅 검사
pnpm format:check
```

## 문제 해결

### 일반적인 문제

1. **포트 충돌**

   이미 사용 중인 포트로 인한 충돌 시:

   ```bash
   # 사용 중인 포트 확인 (Windows)
   netstat -ano | findstr :3000

   # 사용 중인 포트 확인 (Linux/macOS)
   lsof -i :3000

   # 프로세스 종료 (Windows)
   taskkill /PID <pid> /F

   # 프로세스 종료 (Linux/macOS)
   kill -9 <pid>
   ```

2. **Docker 문제**

   Docker 컨테이너 문제 해결:

   ```bash
   # 컨테이너 재시작
   docker compose down && docker compose up -d

   # 볼륨 포함 삭제 (데이터 초기화)
   docker compose down -v
   ```

3. **의존성 문제**

   의존성 관련 문제 해결:

   ```bash
   # node_modules 및 캐시 삭제
   pnpm clean

   # 의존성 재설치
   pnpm install
   ```

4. **TypeScript 타입 오류**

   타입 문제 해결:

   ```bash
   # 프로젝트 전체 빌드
   pnpm build

   # 특정 패키지의 타입 체크
   pnpm frontend tsc --noEmit
   ```

## 성능 최적화 팁

1. **Turborepo 캐시 활용**

   Turborepo는 빌드 캐시를 사용하여 빌드 시간을 단축합니다:

   ```bash
   # 원격 캐시 활성화 (선택 사항)
   npx turbo login
   npx turbo link
   ```

2. **Docker 볼륨 최적화**

   Docker 개발 환경에서 성능 향상을 위해 볼륨 마운트를 최적화하세요.

3. **pnpm 스토어 캐싱**

   pnpm 스토어는 패키지를 효율적으로 캐싱합니다. CI/CD 환경에서도 이 캐시를 활용하면 빌드 속도가 향상됩니다.

## 개발 워크플로우

1. 기능 브랜치 생성
2. 코드 작성 및 테스트
3. 커밋 및 푸시
4. CI/CD 검증 (GitHub Actions)
5. 코드 리뷰 및 PR 병합
6. 배포

세부적인 개발 워크플로우는 프로젝트의 Git 워크플로우 문서를 참조하세요.
