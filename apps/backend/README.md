# 백엔드 API 서버

## 데이터베이스 스키마 관리

**중요**: 이 프로젝트는 단일 스키마 정의를 사용합니다.

### 스키마 위치
- **정의**: `src/database/drizzle/schema/*.ts`
- **마이그레이션 생성**: `pnpm db:generate`
- **마이그레이션 적용**: `pnpm db:migrate`

### 환경 변수

데이터베이스 연결을 위한 표준화된 환경 변수:

```env
# 우선순위 1: 연결 문자열
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/equipment_management

# 우선순위 2: 개별 설정
DB_HOST=localhost
DB_PORT=5432
DB_NAME=equipment_management
DB_USER=postgres
DB_PASSWORD=postgres
DB_POOL_MAX=50
DB_IDLE_TIMEOUT=60000
DB_CONNECTION_TIMEOUT=5000
```

### 스키마 변경 프로세스

1. `src/database/drizzle/schema/*.ts` 파일 수정
2. `pnpm db:generate` 실행하여 마이그레이션 파일 생성
3. `pnpm db:migrate` 실행하여 데이터베이스에 적용
4. 필요한 경우 DTO 및 타입 정의 업데이트

### 데이터베이스 연결 사용

```typescript
// 올바른 방법
import { db } from '@/database/drizzle';
import * as schema from '@/database/drizzle/schema';

// 쿼리 실행
const users = await db.select().from(schema.users);

// 트랜잭션
await db.transaction(async (tx) => {
  await tx.insert(schema.users).values({ name: 'John' });
});
```

### 주의사항

- ❌ `src/database/connection.ts` 사용 금지 (deprecated)
- ❌ `src/database/schema` 디렉토리 사용 금지 (제거됨)
- ✅ `src/database/drizzle/index.ts`의 `db` 인스턴스 사용
- ✅ `src/database/drizzle/schema`의 스키마 정의 사용

## 개발 서버 실행

```bash
# 개발 모드
pnpm start:dev

# 프로덕션 빌드
pnpm build

# 프로덕션 실행
pnpm start:prod
```

## 테스트

```bash
# 단위 테스트
pnpm test

# E2E 테스트
pnpm test:e2e

# 테스트 커버리지
pnpm test:cov
```
