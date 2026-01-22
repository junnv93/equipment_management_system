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
| Node.js    | 18+  | `nvm install --lts`                 |
| pnpm       | 8+   | `npm install -g pnpm`               |
| Docker     | 최신 | https://docs.docker.com/get-docker/ |

### 2. 개발 환경 시작

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경변수 설정 (최초 1회)
cp .env.example .env

# 3. DB/Redis 시작 (Docker)
docker compose up -d

# 4. 개발 서버 시작
pnpm dev
```

### 3. 접속 확인

| 서비스         | URL                       | 설명            |
| -------------- | ------------------------- | --------------- |
| 프론트엔드     | http://localhost:3000     | Next.js 웹 앱   |
| 백엔드 API     | http://localhost:3001     | NestJS REST API |
| API 문서       | http://localhost:3001/api | Swagger UI      |
| Drizzle Studio | http://localhost:4983     | DB 관리 도구    |

---

## 주요 명령어

### 개발

```bash
pnpm dev                          # 모든 패키지 개발 모드
pnpm --filter backend run dev     # 백엔드만
pnpm --filter frontend run dev    # 프론트엔드만
```

### 빌드

```bash
pnpm build                        # 모든 패키지 빌드
pnpm --filter backend run build   # 백엔드만
```

### 테스트

```bash
pnpm test                         # 모든 테스트
pnpm --filter backend run test    # 백엔드 테스트만
```

### 데이터베이스

```bash
pnpm --filter backend run db:migrate     # 마이그레이션 실행
pnpm --filter backend run db:studio      # Drizzle Studio 실행
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

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=1d
```

---

## 트러블슈팅

### 포트 충돌

```bash
# 3000/3001 포트가 사용 중일 때
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Docker 문제

```bash
# 컨테이너 재시작
docker compose down && docker compose up -d

# 볼륨 포함 삭제 (데이터 초기화)
docker compose down -v
```

### node_modules 문제

```bash
rm -rf node_modules
pnpm install
```

### 데이터베이스 연결 실패

```bash
# PostgreSQL 상태 확인
docker compose ps postgres
docker compose logs postgres
```

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

1. **핫 리로드**: 코드 변경 시 자동으로 새로고침됩니다
2. **타입 안전성**: 백엔드-프론트엔드 간 타입이 `packages/schemas`에서 공유됩니다
3. **API 클라이언트**: `packages/api-client`로 타입 안전한 API 호출이 가능합니다
4. **Drizzle Studio**: `pnpm --filter backend run db:studio`로 DB를 시각적으로 관리할 수 있습니다
