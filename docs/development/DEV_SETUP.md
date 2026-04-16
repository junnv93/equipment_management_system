# 개발 환경 설정 가이드

## 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    로컬 개발 환경                         │
├─────────────────────────────────────────────────────────┤
│  [프론트엔드]         [백엔드]                            │
│  localhost:3000      localhost:3001                     │
│  (pnpm dev)          (pnpm dev)                         │
├─────────────────────────────────────────────────────────┤
│                    Docker                               │
│  [PostgreSQL]        [Redis]                            │
│  localhost:5432      localhost:6379                     │
└─────────────────────────────────────────────────────────┘
```

---

## 빠른 시작

### 1. 필수 소프트웨어 설치

| 소프트웨어 | 버전 | 설치 방법                           |
| ---------- | ---- | ----------------------------------- |
| Node.js    | 20+  | `nvm install --lts`                 |
| pnpm       | 10+  | `npm install -g pnpm@latest`        |
| Docker     | 최신 | https://docs.docker.com/get-docker/ |

> **참고**: Node.js 18도 동작하지만, 20+ 버전을 권장합니다.

### 2. 개발 환경 시작

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경변수 설정 (최초 1회)
cp .env.example .env
# .env 파일을 열어 JWT_SECRET 등 필요한 값을 수정하세요

# 3. DB/Redis 시작 (Docker)
docker compose up -d

# 4. 데이터베이스 마이그레이션 (최초 1회)
pnpm --filter backend db:migrate

# 5. 개발 서버 시작
pnpm dev
```

### 3. 접속 확인

| 서비스         | URL                            | 설명            |
| -------------- | ------------------------------ | --------------- |
| 프론트엔드     | http://localhost:3000          | Next.js 웹 앱   |
| 백엔드 API     | http://localhost:3001/api      | NestJS REST API |
| API 문서       | http://localhost:3001/api/docs | Swagger UI      |
| Drizzle Studio | http://localhost:4983          | DB 관리 도구    |

---

## 주요 명령어

### 개발

```bash
pnpm dev                        # 모든 패키지 개발 모드 (Turborepo)
pnpm --filter backend dev       # 백엔드만
pnpm --filter frontend dev      # 프론트엔드만
```

### 빌드

```bash
pnpm build                      # 모든 패키지 빌드
pnpm --filter backend build     # 백엔드만
```

### 테스트

```bash
pnpm test                       # 모든 테스트
pnpm --filter backend test      # 백엔드 테스트만
```

### 데이터베이스

```bash
pnpm --filter backend db:migrate    # 마이그레이션 실행
pnpm --filter backend db:studio     # Drizzle Studio 실행 (포트 4983)
pnpm --filter backend db:generate   # 스키마 변경 시 마이그레이션 생성
```

### Docker

```bash
docker compose up -d              # DB/Redis 시작
docker compose down               # DB/Redis 종료
docker compose logs -f postgres   # PostgreSQL 로그
docker compose logs -f redis      # Redis 로그
```

---

## 환경변수 (.env)

### 필수 설정

```bash
# 애플리케이션
NODE_ENV=development
PORT=3001

# PostgreSQL (Docker)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=equipment_management

# Redis (Docker)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT (⚠️ 프로덕션에서는 반드시 변경!)
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRATION=1d
```

### 선택적 설정

```bash
# Azure AD 인증 (SSO 사용 시)
AZURE_AD_CLIENT_ID=your_client_id
AZURE_AD_CLIENT_SECRET=your_client_secret
AZURE_AD_TENANT_ID=your_tenant_id
AZURE_AD_REDIRECT_URI=http://localhost:3000/api/auth/callback/azure-ad

# 로깅
LOG_LEVEL=info

# 이메일 알림 (선택)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_email_password
SMTP_FROM=noreply@example.com
```

> **참고**: `.env.example` 파일에서 전체 설정을 확인할 수 있습니다.

---

## 트러블슈팅

### 🔴 포트 충돌 (pnpm dev 실행 안 될 때)

**증상**: `Port 3000 is in use` 또는 `EADDRINUSE: address already in use :::3001`

**원인**:

- 이전 개발 서버가 완전히 종료되지 않음
- 포트 3000이나 3001이 다른 프로세스에서 사용 중
- Next.js lock 파일 남아있음

**해결**:

```bash
# 방법 1: 포트 3000, 3001, 3002 모두 정리 (권장)
fuser -k 3000/tcp 3001/tcp 3002/tcp 2>/dev/null && echo "포트 정리 완료" || echo "포트 사용 중인 프로세스 없음"

# 방법 2: 특정 포트만 정리
lsof -ti:3000 | xargs kill -9 2>/dev/null  # 프론트엔드
lsof -ti:3001 | xargs kill -9 2>/dev/null  # 백엔드

# 방법 3: Next.js lock 파일 삭제 (3번 방법 필수)
rm -rf apps/frontend/.next/dev/lock

# 이후 재시작
pnpm dev
```

---

### 🔴 DB 연결 풀 오류

**증상**: API 호출 시 `Cannot use a pool after calling end on the pool` 에러

**원인**:

- 백엔드 서버가 오래 실행되면서 DB 연결이 끊어짐
- Docker PostgreSQL이 재시작되었는데 백엔드가 연결 풀을 갱신 못함
- 핫 리로드 중 DB 풀이 제대로 정리되지 않음

**해결**:

```bash
# 백엔드 서버 재시작
lsof -ti:3001 | xargs kill -9
pnpm --filter backend dev
```

---

### 🔴 500 에러 (Server Error)

**증상**: 프론트엔드에서 `HTTP 상태: 500` 에러

**체크리스트**:

```bash
# 1. 백엔드 서버 실행 확인
lsof -ti:3001  # 프로세스 ID가 출력되면 실행 중

# 2. DB 컨테이너 상태 확인
docker compose ps  # postgres 서비스가 healthy인지 확인

# 3. 백엔드 로그 확인 (터미널에서)
# 에러 메시지를 보고 원인 파악
```

**해결 (순서대로 시도)**:

```bash
# 1단계: 백엔드만 재시작
lsof -ti:3001 | xargs kill -9
pnpm --filter backend dev

# 2단계: DB 컨테이너도 재시작
docker compose restart postgres
pnpm --filter backend dev

# 3단계: 전체 재시작
docker compose down && docker compose up -d
pnpm dev
```

---

### 🟡 Docker 문제

**증상**: DB 연결 실패, 컨테이너가 시작되지 않음

**진단**:

```bash
# 컨테이너 상태 확인
docker compose ps

# 로그 확인
docker compose logs postgres
docker compose logs redis
```

**해결**:

```bash
# 컨테이너 재시작
docker compose down && docker compose up -d

# 볼륨 포함 삭제 (⚠️ 데이터 초기화됨)
docker compose down -v && docker compose up -d
pnpm --filter backend db:migrate  # 스키마 재적용
```

---

### 🟡 데이터베이스 연결 실패

**증상**: `connection refused`, `ECONNREFUSED`

**체크리스트**:

```bash
# 1. Docker 컨테이너 실행 확인
docker compose ps  # STATUS가 "Up" + "(healthy)"인지 확인

# 2. 포트 확인
lsof -i:5432  # PostgreSQL
lsof -i:6379  # Redis

# 3. 환경변수 확인 (.env)
cat apps/backend/.env | grep DB_
```

**해결**:

```bash
# Docker가 꺼져있다면
docker compose up -d

# 컨테이너가 unhealthy라면
docker compose restart postgres
```

---

### 🟡 Next.js lock 파일 오류

**증상**: `Unable to acquire lock at /apps/frontend/.next/dev/lock` 에러

**원인**:

- 이전 Next.js 서버가 비정상 종료됨
- lock 파일이 남아있어서 새 서버가 시작 불가
- `pnpm dev` 실행 중 Ctrl+C로 종료했을 때 발생 가능

**해결**:

```bash
# Next.js lock 파일 삭제
rm -rf apps/frontend/.next/dev/lock

# 포트도 정리 (권장)
fuser -k 3000/tcp 3001/tcp 2>/dev/null

# 개발 서버 재시작
pnpm dev
```

> **팁**: 여러 프로세스가 동시에 Next.js를 실행하지 않도록 주의하세요!

---

### 🟡 핫 리로드 후 이상 동작

**증상**: 코드 변경 후 예상치 못한 동작, 캐시 문제

**해결**:

```bash
# Next.js 캐시 삭제
rm -rf apps/frontend/.next

# NestJS dist 삭제
rm -rf apps/backend/dist

# 개발 서버 재시작
pnpm dev
```

---

### 🟢 node_modules 문제

**증상**: 모듈을 찾을 수 없음, 타입 에러

**해결**:

```bash
# 전체 재설치
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

---

### 🟢 마이그레이션 오류

**증상**: 테이블이 없음, 스키마 불일치

**해결**:

```bash
# 마이그레이션 실행
pnpm --filter backend db:migrate

# 스키마 변경 시 마이그레이션 파일 생성
pnpm --filter backend db:generate
```

---

### 🟢 pnpm 설치 오류

**해결**:

```bash
# pnpm 캐시 정리
pnpm store prune

# 전체 재설치
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

### 📋 빠른 복구 체크리스트

문제 발생 시 아래 순서대로 시도:

| 순서 | 명령어                                                                                   | 설명                                    |
| ---- | ---------------------------------------------------------------------------------------- | --------------------------------------- |
| 0    | `fuser -k 3000/tcp 3001/tcp 3002/tcp 2>/dev/null && rm -rf apps/frontend/.next/dev/lock` | **포트 및 lock 파일 정리 (가장 먼저!)** |
| 1    | `pnpm dev`                                                                               | 전체 개발 서버 재시작                   |
| 2    | `docker compose restart postgres`                                                        | DB 재시작                               |
| 3    | `docker compose down && docker compose up -d && pnpm dev`                                | DB/Redis 전체 재시작                    |
| 4    | `rm -rf apps/frontend/.next apps/backend/dist && pnpm dev`                               | 빌드 캐시 삭제 후 재시작                |
| 5    | `rm -rf node_modules pnpm-lock.yaml && pnpm install && pnpm dev`                         | 의존성 전체 재설치                      |

---

## 프로젝트 구조

```
equipment_management_system/
├── apps/
│   ├── backend/          # NestJS 백엔드
│   └── frontend/         # Next.js 프론트엔드
├── packages/
│   ├── schemas/          # 공유 타입 정의
│   ├── db/               # Drizzle ORM 스키마
│   └── api-client/       # API 클라이언트
├── docs/                 # 문서
├── scripts/              # 자동화 스크립트
└── docker-compose.yml    # Docker (DB/Redis만)
```

---

## 개발 팁

1. **포트 설정**:
   - 프론트엔드는 기본 포트 **3000**
   - 백엔드는 기본 포트 **3001**
   - `.env`에서 `PORT` 환경변수로 백엔드 포트 변경 가능

2. **핫 리로드**: 코드 변경 시 자동으로 새로고침됩니다

3. **타입 안전성**: 백엔드-프론트엔드 간 타입이 `packages/schemas`에서 공유됩니다

4. **API 클라이언트**: `packages/api-client`로 타입 안전한 API 호출이 가능합니다

5. **Drizzle Studio**: `pnpm --filter backend db:studio`로 DB를 시각적으로 관리할 수 있습니다 (포트: 4983)

6. **Turborepo 캐싱**: 빌드가 캐싱되어 재빌드 시 빠릅니다

7. **타입 검사**: `pnpm type-check`로 전체 타입 커버리지를 확인할 수 있습니다

8. **포트 정리**: `pnpm dev` 실행이 안 될 때는 먼저 포트를 정리해주세요
   ```bash
   fuser -k 3000/tcp 3001/tcp 3002/tcp 2>/dev/null
   rm -rf apps/frontend/.next/dev/lock
   pnpm dev
   ```

---

## 추가 문서

- [테스트 가이드](./testing-guide.md)
- [워크스페이스 관리](./workspace-management.md)
- [온보딩](./onboarding.txt)
