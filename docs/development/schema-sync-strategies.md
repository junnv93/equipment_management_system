# Drizzle-Zod 스키마 동기화 전략

## 문제 상황

현재 프로젝트에서는 Drizzle 스키마(`apps/backend/src/database/drizzle/schema/`)와 Zod 스키마(`packages/schemas/src/`)를 수동으로 동기화하고 있습니다. 이는 다음과 같은 문제를 야기합니다:

1. **동기화 누락**: Drizzle 스키마 변경 시 Zod 스키마를 수동으로 업데이트해야 함
2. **타입 불일치**: 두 스키마 간 불일치로 인한 런타임 에러 가능성
3. **유지보수 부담**: 스키마 변경 시 두 곳을 모두 수정해야 함

## 일반적인 해결 방법

### 1. drizzle-zod를 사용한 자동 생성 (권장)

**장점:**

- Drizzle 스키마가 단일 소스
- 자동 동기화로 실수 방지
- 타입 안전성 보장

**단점:**

- Zod v4에서 타입 인스턴스화 깊이 문제 발생 (현재 프로젝트 상황)
- 모노레포 구조상 경로 해결 복잡

**구현 방법:**

```typescript
// packages/schemas/src/equipment.ts
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { equipment } from '../../../apps/backend/src/database/drizzle/schema/equipment';

export const equipmentSchema = createSelectSchema(equipment);
export const createEquipmentSchema = createInsertSchema(equipment);
export const updateEquipmentSchema = createInsertSchema(equipment).partial();
```

**현재 상태:** Zod v4와의 호환성 문제로 사용 불가

---

### 2. 빌드 스크립트를 통한 자동 생성

**장점:**

- 스키마 변경 시 자동으로 Zod 스키마 재생성
- CI/CD 파이프라인에 통합 가능
- 커스텀 변환 로직 적용 가능

**단점:**

- 스크립트 작성 및 유지보수 필요
- 복잡한 스키마 변환 시 로직 복잡도 증가

**구현 방법:**

```bash
# package.json
{
  "scripts": {
    "generate:schemas": "tsx scripts/generate-from-drizzle.ts",
    "postdb:migrate": "pnpm generate:schemas"
  }
}
```

**현재 상태:** 템플릿 스크립트 생성됨 (`packages/schemas/scripts/generate-from-drizzle.ts`)

---

### 3. 공유 패키지로 스키마 이동

**장점:**

- 단일 소스 위치
- 직접 import 가능
- 모노레포 구조와 잘 맞음

**단점:**

- 기존 구조 변경 필요
- 마이그레이션 작업 필요

**구현 방법:**

```
packages/
├── schemas/
│   ├── src/
│   │   ├── drizzle/          # Drizzle 스키마 이동
│   │   │   └── equipment.ts
│   │   └── zod/              # Zod 스키마
│   │       └── equipment.ts
│   └── package.json
```

**현재 상태:** 미구현 (구조 변경 필요)

---

### 4. 수동 동기화 + 검증 스크립트 (현재 방식)

**장점:**

- 구현 간단
- 즉시 사용 가능
- 커스텀 검증 로직 추가 가능

**단점:**

- 수동 작업 필요
- 동기화 누락 가능성

**구현 방법:**

```typescript
// packages/schemas/src/equipment.ts
/**
 * 주의: 이 파일은 Drizzle 스키마와 동기화되어야 합니다.
 * Drizzle 스키마가 변경되면 이 파일도 함께 업데이트해야 합니다.
 *
 * 검증: pnpm --filter @equipment-management/schemas validate:sync
 */
```

**검증 스크립트 예시:**

```typescript
// scripts/validate-schema-sync.ts
// Drizzle 스키마와 Zod 스키마의 필드 일치 여부 확인
```

---

## 권장 접근 방법

### 단기 (현재)

1. **수동 동기화 유지** + **검증 스크립트 추가**

   - 스키마 변경 시 검증 스크립트 실행
   - CI/CD에서 자동 검증

2. **문서화 강화**
   - 스키마 변경 시 체크리스트 제공
   - 주석에 동기화 필요성 명시

### 중기 (Zod v4 호환성 해결 후)

1. **drizzle-zod 자동 생성 활성화**

   - Zod v4 호환성 문제 해결 시 즉시 적용
   - 가장 안전하고 효율적인 방법

2. **빌드 스크립트 개선**
   - 자동 생성 스크립트 완성
   - 마이그레이션 후 자동 검증

### 장기 (구조 개선)

1. **스키마 공유 패키지로 통합**
   - Drizzle 스키마를 공유 패키지로 이동
   - 단일 소스 위치 확보

---

## 다른 프로젝트 사례

### Case 1: tRPC + Drizzle + Zod

```typescript
// 스키마를 공유 패키지에 배치
packages/db/
├── schema.ts        // Drizzle 스키마
└── validators.ts    // Zod 스키마 (drizzle-zod 사용)
```

### Case 2: Next.js + Drizzle

```typescript
// 빌드 타임에 자동 생성
// scripts/generate-validators.ts
import { generateValidators } from 'drizzle-zod-generator';
generateValidators({
  schema: './src/db/schema.ts',
  output: './src/validators.ts',
});
```

### Case 3: NestJS + Drizzle

```typescript
// 수동 동기화 + 타입 가드
// DTO에서 Zod 스키마 사용
// 서비스에서 Drizzle 타입 사용
// 런타임 검증으로 일관성 확보
```

---

## 현재 프로젝트 권장 사항

1. **즉시 적용 가능:**

   - 검증 스크립트 추가 (`scripts/validate-schema-sync.ts`)
   - 스키마 변경 체크리스트 문서화
   - CI/CD에서 자동 검증

2. **Zod v4 호환성 해결 후:**

   - `drizzle-zod` 자동 생성 활성화
   - 기존 수동 스키마를 자동 생성으로 마이그레이션

3. **장기적 개선:**
   - 스키마 구조 재검토
   - 공유 패키지로 통합 고려

---

## 참고 자료

- [drizzle-zod 공식 문서](https://orm.drizzle.team/docs/zod)
- [Zod v4 마이그레이션 가이드](https://zod.dev/)
- [모노레포 스키마 관리 패턴](https://github.com/t3-oss/create-t3-app)
