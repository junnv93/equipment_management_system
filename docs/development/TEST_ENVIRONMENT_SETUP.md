# E2E 테스트 환경 설정 가이드

## 개요

E2E 테스트는 실제 데이터베이스 연결이 필요합니다. 본 프로젝트는 **단일 DB 정책**을 사용하여 개발/테스트 DB를 분리하지 않습니다.

> **정책**: 1인 개발 환경에서 개발 DB와 테스트 DB는 동일합니다. 별도의 테스트 DB를 생성하지 마세요.

## 사전 요구사항

### 1. PostgreSQL & Redis 실행

```bash
# Docker Compose로 DB/Redis 시작
docker compose up -d
```

### 2. 데이터베이스 연결 확인

```bash
# 컨테이너 내부에서 확인
docker compose exec postgres psql -U postgres -d equipment_management -c "SELECT 1;"

# 호스트에서 직접 연결 확인
psql -h localhost -p 5432 -U postgres -d equipment_management
```

## 환경 변수 설정

E2E 테스트는 다음 환경 변수를 사용합니다 (`.env` 파일 참조):

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/equipment_management
REDIS_URL=redis://localhost:6379
NODE_ENV=test
JWT_SECRET=your_jwt_secret_key
NEXTAUTH_SECRET=your_nextauth_secret_key
```

## 테스트 실행

### 전체 E2E 테스트 실행

```bash
pnpm --filter backend run test:e2e
```

### 특정 테스트 파일 실행

```bash
pnpm --filter backend run test:e2e -- equipment.e2e-spec.ts
```

## 문제 해결

### 데이터베이스 연결 실패

**증상:**

```
PostgreSQL connection test failed: password authentication failed for user "postgres"
```

**해결 방법:**

1. PostgreSQL 컨테이너가 실행 중인지 확인:

   ```bash
   docker compose ps
   ```

2. 연결 정보 확인:
   - 호스트: `localhost`
   - 포트: `5432`
   - 사용자: `postgres`
   - 비밀번호: `postgres`
   - 데이터베이스: `equipment_management`

3. 컨테이너 재시작:
   ```bash
   docker compose restart postgres
   ```

### 테스트 환경에서 데이터베이스 연결 유연성

테스트 환경(`NODE_ENV=test`)에서는 데이터베이스 연결 실패 시:

- 경고 메시지만 출력하고 계속 진행
- 실제 테스트 실행 시 데이터베이스가 필요하면 테스트가 실패함

## 검증 아키텍처

E2E 테스트는 다음 검증 전략을 사용합니다:

1. **Zod 기반 검증**: 모든 검증은 `@equipment-management/schemas` 패키지의 Zod 스키마 사용
2. **전역 ValidationPipe 제거**: 충돌 방지를 위해 제거됨
3. **명시적 검증**: 각 컨트롤러에서 `@UsePipes(ZodValidationPipe)` 사용

자세한 내용은 [VALIDATION_ARCHITECTURE.md](./VALIDATION_ARCHITECTURE.md)를 참조하세요.

## 참고

- [DEV_SETUP.md](./DEV_SETUP.md) - 개발 환경 설정
- [VALIDATION_ARCHITECTURE.md](./VALIDATION_ARCHITECTURE.md)
- [API_STANDARDS.md](./API_STANDARDS.md)
