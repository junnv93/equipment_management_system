# 개발 환경 설정 가이드

## 🚀 빠른 시작 (5분)

```bash
# 1. 저장소 클론 (이미 완료)
cd equipment_management_system-1

# 2. 자동 설정 스크립트 실행
./scripts/setup-dev.sh

# 3. 개발 서버 시작
pnpm dev
```

접속: http://localhost:3000

---

## 📋 필수 소프트웨어

| 소프트웨어 | 버전 | 설치 링크 |
|-----------|------|----------|
| Node.js | 18+ | https://nodejs.org |
| pnpm | 8+ | `npm install -g pnpm` |
| Docker | 최신 | https://docs.docker.com/get-docker/ |
| Docker Compose | 최신 | Docker Desktop에 포함 |

---

## 🛠️ 수동 설정 (자동 스크립트 실패 시)

### 1. pnpm 설치
```bash
npm install -g pnpm
```

### 2. 의존성 설치
```bash
pnpm install
```

### 3. 환경변수 설정
```bash
cp .env.example .env

# .env 파일을 수정하세요:
# - DATABASE_URL
# - REDIS_URL
# - NEXTAUTH_SECRET (프로덕션에서는 반드시 변경)
```

### 4. Docker 인프라 시작
```bash
# PostgreSQL과 Redis만 Docker로 실행
docker-compose up -d postgres redis

# 상태 확인
docker-compose ps
```

### 5. 개발 서버 시작

**옵션 A: 모든 서비스 한 번에**
```bash
pnpm dev
```

**옵션 B: 개별 실행 (디버깅용)**
```bash
# 터미널 1: 백엔드
pnpm --filter backend run dev

# 터미널 2: 프론트엔드
pnpm --filter frontend run dev
```

---

## 🔧 주요 명령어

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
pnpm test:e2e                     # E2E 테스트
```

### 데이터베이스
```bash
pnpm --filter backend run db:migrate     # 마이그레이션 실행
pnpm --filter backend run db:studio      # Drizzle Studio 실행
```

### Docker
```bash
docker-compose up -d              # 모든 서비스 시작
docker-compose up -d postgres redis  # DB와 Redis만
docker-compose down               # 모든 서비스 종료
docker-compose logs -f backend    # 백엔드 로그 확인
```

---

## 🌐 서비스 접속 정보

| 서비스 | URL | 설명 |
|--------|-----|------|
| 프론트엔드 | http://localhost:3000 | Next.js 웹 애플리케이션 |
| 백엔드 API | http://localhost:3001 | NestJS REST API |
| API 문서 | http://localhost:3001/api | Swagger UI |
| PostgreSQL | localhost:5433 | DB (외부 포트) |
| Redis | localhost:6380 | 캐시 서버 |
| Drizzle Studio | http://localhost:4983 | DB 관리 도구 |

---

## 🐛 트러블슈팅

### 1. 포트 충돌
```bash
# 3000 포트가 사용 중일 때
lsof -ti:3000 | xargs kill -9

# 3001 포트가 사용 중일 때
lsof -ti:3001 | xargs kill -9
```

### 2. Docker 컨테이너 문제
```bash
# 모든 컨테이너 중지 및 삭제
docker-compose down -v

# 다시 시작
docker-compose up -d postgres redis
```

### 3. node_modules 문제
```bash
# 의존성 재설치
rm -rf node_modules
pnpm install
```

### 4. 데이터베이스 연결 실패
```bash
# PostgreSQL 컨테이너 상태 확인
docker-compose ps postgres

# 로그 확인
docker-compose logs postgres

# 재시작
docker-compose restart postgres
```

### 5. "Cannot find module" 에러
```bash
# 특정 패키지만 재설치
pnpm --filter backend install

# 또는 전체 재설치
pnpm install
```

---

## 📁 프로젝트 구조

```
equipment_management_system-1/
├── apps/
│   ├── backend/          # NestJS 백엔드
│   └── frontend/         # Next.js 프론트엔드
├── packages/
│   ├── schemas/          # 공유 타입 정의
│   ├── db/               # Drizzle ORM 스키마
│   ├── api-client/       # API 클라이언트
│   └── ui/               # 공유 UI 컴포넌트
├── docs/                 # 문서
├── scripts/              # 자동화 스크립트
└── docker-compose.yml    # Docker 설정
```

---

## 🔐 보안 주의사항

1. **절대 커밋하지 말 것:**
   - `.env` (환경변수)
   - `node_modules/`
   - `.pnpm-store/`
   - 업로드된 파일 (`uploads/`)

2. **프로덕션 배포 전 확인:**
   - `NEXTAUTH_SECRET` 변경
   - 데이터베이스 비밀번호 변경
   - Azure AD 설정 (실제 값)

---

## 🆘 도움이 필요할 때

1. 이 문서의 트러블슈팅 섹션 확인
2. `docs/` 폴더의 다른 문서 참고
3. GitHub Issues 검색
4. 팀 채널에 질문

---

## 📝 다음 단계

- [ ] 첫 번째 기능 개발
- [ ] 테스트 작성 방법 익히기
- [ ] API 문서 확인 (http://localhost:3001/api)
- [ ] 코드 컨벤션 숙지 (docs/CONTRIBUTING.md)
