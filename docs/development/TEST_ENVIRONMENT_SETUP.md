# E2E 테스트 환경 설정 가이드

## 개요

E2E 테스트는 실제 데이터베이스 연결이 필요합니다. 이 문서는 E2E 테스트 환경을 설정하는 방법을 설명합니다.

## 사전 요구사항

### 1. PostgreSQL 데이터베이스 실행

Docker Compose를 사용하여 PostgreSQL을 실행합니다:

```bash
# 프로젝트 루트에서
docker-compose up -d postgres
```

또는 수동으로 PostgreSQL 컨테이너를 실행:

```bash
docker run -d \
  --name postgres_equipment \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=equipment_management \
  -p 5433:5432 \
  postgres:15
```

### 2. 데이터베이스 연결 확인

```bash
# 컨테이너 내부에서 확인
docker exec postgres_equipment psql -U postgres -d equipment_management -c "SELECT 1;"

# 호스트에서 직접 연결 확인
psql -h localhost -p 5433 -U postgres -d equipment_management
```

## 환경 변수 설정

E2E 테스트는 다음 환경 변수를 사용합니다:

```bash
# 기본값 (테스트 파일에서 자동 설정)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/equipment_management
REDIS_URL=redis://localhost:6380
NODE_ENV=test
JWT_SECRET=test-jwt-secret-key-for-e2e-tests-minimum-32-characters-long
NEXTAUTH_SECRET=test-nextauth-secret-key-for-e2e-tests-minimum-32-characters-long
```

## 테스트 실행

### 전체 E2E 테스트 실행

```bash
cd apps/backend
pnpm test:e2e
```

### 특정 테스트 파일 실행

```bash
cd apps/backend
pnpm test:e2e -- equipment.e2e-spec.ts
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
   docker ps | grep postgres
   ```

2. 연결 정보 확인:

   - 호스트: `localhost`
   - 포트: `5433` (docker-compose.yml에서 설정)
   - 사용자: `postgres`
   - 비밀번호: `postgres`
   - 데이터베이스: `equipment_management`

3. 컨테이너 재시작:
   ```bash
   docker-compose restart postgres
   ```

### 테스트 환경에서 데이터베이스 연결 유연성

테스트 환경(`NODE_ENV=test`)에서는 데이터베이스 연결 실패 시:

- 경고 메시지만 출력하고 계속 진행
- 실제 테스트 실행 시 데이터베이스가 필요하면 테스트가 실패함
- 프로덕션/개발 환경에서는 연결 실패 시 예외 발생

이렇게 하면:

- 데이터베이스가 없는 환경에서도 코드 검증 가능
- 실제 E2E 테스트는 데이터베이스가 필요함을 명확히 함

## 검증 아키텍처

E2E 테스트는 다음 검증 전략을 사용합니다:

1. **Zod 기반 검증**: 모든 검증은 `@equipment-management/schemas` 패키지의 Zod 스키마 사용
2. **전역 ValidationPipe 제거**: 충돌 방지를 위해 제거됨
3. **명시적 검증**: 각 컨트롤러에서 `@UsePipes(ZodValidationPipe)` 사용

자세한 내용은 [VALIDATION_ARCHITECTURE.md](./VALIDATION_ARCHITECTURE.md)를 참조하세요.

## 참고

- [VALIDATION_ARCHITECTURE.md](./VALIDATION_ARCHITECTURE.md)
- [API_STANDARDS.md](./API_STANDARDS.md)
- [docker-compose.yml](../../docker-compose.yml)
