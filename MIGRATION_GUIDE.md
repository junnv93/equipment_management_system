# 마이그레이션 가이드

이 문서는 프로젝트 리팩토링 과정에서 변경된 사항과 마이그레이션 방법을 설명합니다.

## 주요 변경 사항

### 1. 데이터베이스 스키마 통합

**이전:**
- `apps/backend/src/database/schema/` (사용됨)
- `apps/backend/src/database/drizzle/schema/` (마이그레이션용)
- 중복된 스키마 정의

**이후:**
- `apps/backend/src/database/drizzle/schema/` (단일 소스)
- 모든 스키마는 이 디렉토리에서만 정의

**마이그레이션 방법:**
```typescript
// ❌ 이전 방식
import { equipment } from '@/database/schema/equipment';

// ✅ 새로운 방식
import { equipment } from '@/database/drizzle/schema/equipment';
// 또는
import * as schema from '@/database/drizzle/schema';
const { equipment } = schema;
```

### 2. 데이터베이스 연결 관리 통합

**이전:**
- `DatabaseConnection` 클래스 (connection.ts)
- Drizzle 기본 풀 (drizzle/index.ts)
- 2개의 독립적인 연결 관리 시스템

**이후:**
- 단일 Drizzle ORM 인스턴스
- 개선된 재연결 로직
- 헬스 체크 및 메트릭 추적

**마이그레이션 방법:**
```typescript
// ❌ 이전 방식
import { DatabaseConnection } from '@/database/connection';
const db = DatabaseConnection.getInstance();
await db.executeQuery('SELECT * FROM equipment');

// ✅ 새로운 방식
import { db } from '@/database/drizzle';
import * as schema from '@/database/drizzle/schema';
const results = await db.select().from(schema.equipment);
```

### 3. 환경 변수 표준화

**이전:**
```env
# 혼재된 환경 변수
POSTGRES_HOST=localhost
DB_HOST=localhost
```

**이후:**
```env
# 통합된 환경 변수
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DB_HOST=localhost
DB_PORT=5432
DB_NAME=equipment_management
DB_USER=postgres
DB_PASSWORD=postgres
DB_POOL_MAX=50
DB_IDLE_TIMEOUT=60000
DB_CONNECTION_TIMEOUT=5000
```

**마이그레이션 방법:**
1. `.env.example`을 참조하여 `.env` 파일 업데이트
2. `POSTGRES_*` 환경 변수를 `DB_*`로 변경
3. `DATABASE_URL` 추가 (우선순위가 더 높음)

### 4. 타입 시스템 개선

**이전:**
```typescript
// 타입 불일치
teamId: z.string().uuid().optional()  // Zod 스키마
teamId: integer('team_id')  // Drizzle 스키마

// 런타임 변환 필요
const teamId = parseInt(createEquipmentDto.teamId.toString());
```

**이후:**
```typescript
// 통합된 타입 정의
teamId: integer('team_id')  // Drizzle 스키마가 단일 진실의 원천

// Drizzle에서 자동 생성된 타입 사용
export type Equipment = typeof equipment.$inferSelect;
export type NewEquipment = typeof equipment.$inferInsert;
```

## 삭제된 파일 및 디렉토리

다음 파일과 디렉토리는 더 이상 사용되지 않습니다:

- ❌ `apps/backend/src/database/schema/` (전체 디렉토리)
- ❌ `apps/backend/src/database/connection.ts`
- ❌ `old_project/` (전체 디렉토리)
- ❌ `screenshot/` (전체 디렉토리)
- ❌ `login.json`
- ❌ `database/drizzle/schema/equipment.ts` (루트 레벨)

## 코드 검토 체크리스트

마이그레이션 후 다음 사항을 확인하세요:

- [ ] 모든 `import` 문이 올바른 경로를 가리키는지 확인
- [ ] 환경 변수가 새로운 명명 규칙을 따르는지 확인
- [ ] `DatabaseConnection` 클래스를 사용하는 코드가 없는지 확인
- [ ] `database/schema` 경로를 참조하는 코드가 없는지 확인
- [ ] 데이터베이스 연결이 정상적으로 작동하는지 테스트
- [ ] 마이그레이션이 올바르게 실행되는지 확인

## 문제 해결

### 연결 오류

```
Error: Failed to connect to database
```

**해결 방법:**
1. `.env` 파일에 올바른 데이터베이스 정보가 있는지 확인
2. PostgreSQL 서버가 실행 중인지 확인
3. 방화벽 또는 네트워크 설정 확인

### 타입 오류

```
Type 'string' is not assignable to type 'number'
```

**해결 방법:**
1. Drizzle 스키마의 타입 정의 확인
2. DTO와 스키마의 타입 일치 확인
3. 필요한 경우 타입 변환 로직 추가

### 스키마 찾을 수 없음

```
Cannot find module '@/database/schema/equipment'
```

**해결 방법:**
```typescript
// ❌ 이전 경로
import { equipment } from '@/database/schema/equipment';

// ✅ 새로운 경로
import { equipment } from '@/database/drizzle/schema/equipment';
```

## 추가 리소스

- [Drizzle ORM 공식 문서](https://orm.drizzle.team/docs/overview)
- [프로젝트 구조 가이드](./docs/structure/README.md)
- [개발 환경 설정 가이드](./docs/development/environment-setup.md)

## 지원

문제가 발생하면 다음 방법으로 도움을 받을 수 있습니다:

1. GitHub 이슈 생성
2. 팀 채널에서 질문
3. README.md의 개발 가이드 참조
