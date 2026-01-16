# 스키마 아키텍처 결정 문서 (ADR)

## 문제 상황

현재 프로젝트에서 Drizzle 스키마(`apps/backend/src/database/drizzle/schema/`)와 Zod 스키마(`packages/schemas/src/`)를 수동으로 동기화하고 있습니다. 이는 다음과 같은 문제를 야기합니다:

1. **동기화 누락**: Drizzle 스키마 변경 시 Zod 스키마를 수동으로 업데이트해야 함
2. **타입 불일치**: 두 스키마 간 불일치로 인한 런타임 에러 가능성
3. **유지보수 부담**: 스키마 변경 시 두 곳을 모두 수정해야 함
4. **Zod v4 호환성**: `drizzle-zod`의 `createInsertSchema` 사용 시 타입 인스턴스화 깊이 문제

---

## 실제 프로젝트 사례 분석

### Case 1: T3 Stack (create-t3-app) - 가장 일반적인 패턴

**구조:**

```
packages/
├── db/
│   ├── schema.ts          # Drizzle 스키마
│   └── index.ts           # Drizzle 클라이언트
└── api/
    └── routers/           # tRPC 라우터 (Zod 스키마 사용)
```

**특징:**

- ✅ Drizzle 스키마를 공유 패키지(`packages/db`)에 배치
- ✅ tRPC를 사용하여 Zod 스키마를 API 레이어에서 정의
- ✅ Drizzle 스키마는 DB 접근용, Zod 스키마는 API 검증용으로 분리
- ✅ `drizzle-zod`를 사용하지 않고, API 레이어에서 필요한 Zod 스키마만 정의

**장점:**

- 단일 소스(Drizzle) 위치
- API 레이어에서 필요한 검증만 추가
- 모노레포 구조와 잘 맞음

**단점:**

- API 레이어에서 Zod 스키마를 별도로 정의해야 함
- Drizzle 스키마와 Zod 스키마가 완전히 분리됨

**적용 가능성:** ⭐⭐⭐⭐⭐ (현재 프로젝트에 가장 적합)

---

### Case 2: Next.js + Drizzle + Zod (일부 프로젝트)

**구조:**

```
apps/
└── backend/
    ├── src/
    │   ├── db/
    │   │   └── schema.ts      # Drizzle 스키마
    │   └── lib/
    │       └── validators.ts  # Zod 스키마 (drizzle-zod 사용)
packages/
└── shared/
    └── types.ts               # 공유 타입만
```

**특징:**

- ✅ Drizzle 스키마를 백엔드에 유지
- ✅ `drizzle-zod`로 Zod 스키마 자동 생성
- ✅ 공유 패키지는 타입만 제공

**장점:**

- 자동 동기화
- 백엔드 중심 구조

**단점:**

- 프론트엔드에서 Zod 스키마를 직접 사용하기 어려움
- 모노레포의 공유 패키지 활용도가 낮음

**적용 가능성:** ⭐⭐⭐ (현재 프로젝트 구조와 맞지 않음)

---

### Case 3: 완전 분리 패턴 (일부 엔터프라이즈 프로젝트)

**구조:**

```
packages/
├── db/
│   └── schema.ts          # Drizzle 스키마만
└── validators/
    └── schemas.ts         # Zod 스키마만 (수동 정의)
```

**특징:**

- ✅ 완전히 분리된 스키마
- ✅ 각각의 목적에 맞게 최적화
- ✅ 빌드 스크립트로 동기화 검증

**장점:**

- 각 스키마를 목적에 맞게 최적화 가능
- Drizzle과 Zod의 제약에서 자유로움

**단점:**

- 수동 동기화 필요
- 검증 스크립트 작성 필요

**적용 가능성:** ⭐⭐⭐⭐ (현재 방식과 유사, 개선 가능)

---

## 현재 프로젝트 분석

### 현재 구조

```
apps/
└── backend/
    └── src/database/drizzle/schema/
        └── equipment.ts        # Drizzle 스키마

packages/
└── schemas/
    └── src/
        └── equipment.ts        # Zod 스키마 (수동 동기화)
```

### 문제점

1. Drizzle 스키마가 `apps/backend`에 있어서 `packages/schemas`에서 직접 import 불가
2. 모노레포 구조상 상대 경로 import는 복잡하고 취약함
3. `drizzle-zod` 사용 시 Zod v4 호환성 문제

### AGENTS.md 원칙

- **Schema Source of Truth**: 모든 데이터 타입은 `@equipment-management/schemas`에서 파생
- **모노레포 효율성**: 코드 공유와 재사용을 통해 중복 최소화

---

## 권장 솔루션: T3 Stack 패턴 적용

### 구조 개선안

```
packages/
├── db/                      # 새로 생성
│   ├── src/
│   │   ├── schema/         # Drizzle 스키마 이동
│   │   │   └── equipment.ts
│   │   ├── index.ts         # Drizzle 클라이언트
│   │   └── migrations/      # 마이그레이션 파일
│   └── package.json
│
└── schemas/                 # 기존 유지
    └── src/
        ├── equipment.ts     # Zod 스키마 (API 검증용)
        └── ...
```

### 장점

1. **단일 소스 위치**

   - Drizzle 스키마가 공유 패키지에 있어 모든 앱에서 접근 가능
   - `packages/schemas`에서 직접 import 가능

2. **명확한 책임 분리**

   - `packages/db`: 데이터베이스 스키마 및 접근
   - `packages/schemas`: API 검증 및 타입 정의

3. **모노레포 원칙 준수**

   - 공유 패키지로 코드 재사용
   - 의존성 방향 명확화

4. **향후 확장성**
   - Zod v4 호환성 해결 후 `drizzle-zod` 사용 가능
   - 또는 API 레이어에서 필요한 검증만 추가

### 마이그레이션 계획

#### Phase 1: 패키지 생성 및 이동 (1-2시간)

```bash
# 1. packages/db 패키지 생성
mkdir -p packages/db/src/schema
mkdir -p packages/db/src/migrations

# 2. Drizzle 스키마 이동
mv apps/backend/src/database/drizzle/schema/* packages/db/src/schema/

# 3. Drizzle 클라이언트 이동
mv apps/backend/src/database/drizzle/index.ts packages/db/src/index.ts
```

#### Phase 2: 의존성 업데이트 (1시간)

```bash
# packages/db/package.json 생성
# apps/backend에서 packages/db 의존성 추가
# packages/schemas에서 packages/db 의존성 추가
```

#### Phase 3: Zod 스키마 개선 (2-3시간)

```typescript
// packages/schemas/src/equipment.ts
import { equipment } from '@equipment-management/db/schema/equipment';
import { createSelectSchema } from 'drizzle-zod';

// Zod v4 호환성 해결 후 활성화
// export const equipmentSchema = createSelectSchema(equipment);
```

#### Phase 4: 테스트 및 검증 (1시간)

- 모든 테스트 통과 확인
- 빌드 확인
- 타입 체크

---

## 대안 솔루션 비교

### 대안 1: 현재 구조 유지 + 검증 스크립트

**장점:**

- ✅ 즉시 적용 가능
- ✅ 구조 변경 없음

**단점:**

- ❌ 근본적 해결책 아님
- ❌ 수동 동기화 필요
- ❌ 장기적 유지보수 부담

**추천도:** ⭐⭐ (단기 해결책)

---

### 대안 2: 빌드 스크립트 자동 생성

**장점:**

- ✅ 자동 동기화
- ✅ 구조 변경 최소화

**단점:**

- ❌ 스크립트 작성 및 유지보수 필요
- ❌ 복잡한 변환 로직 필요
- ❌ 여전히 두 소스 존재

**추천도:** ⭐⭐⭐ (중기 해결책)

---

### 대안 3: 구조 개선 (T3 Stack 패턴)

**장점:**

- ✅ 근본적 해결
- ✅ 단일 소스 위치
- ✅ 모노레포 원칙 준수
- ✅ 장기적 유지보수 용이
- ✅ 다른 프로젝트들의 검증된 패턴

**단점:**

- ❌ 초기 마이그레이션 작업 필요 (4-6시간)
- ❌ 구조 변경으로 인한 일시적 불편

**추천도:** ⭐⭐⭐⭐⭐ (장기 해결책)

---

## 최종 권장사항

### 즉시 적용 (오늘)

1. ✅ 현재 구조 유지
2. ✅ 검증 스크립트 추가 (이미 완료)
3. ✅ 문서화 강화 (이미 완료)

### 단기 (1-2주 내)

1. **구조 개선 계획 수립**

   - 마이그레이션 체크리스트 작성
   - 팀 리뷰 및 승인

2. **작은 규모로 시작**
   - `equipment` 스키마만 먼저 마이그레이션
   - 패턴 검증 후 나머지 적용

### 중기 (1개월 내)

1. **전체 마이그레이션 완료**

   - 모든 스키마를 `packages/db`로 이동
   - 의존성 정리

2. **Zod 스키마 개선**
   - Zod v4 호환성 해결 후 `drizzle-zod` 활성화 검토
   - 또는 API 레이어에서 필요한 검증만 추가

---

## 결론

**구조 개선이 가장 근본적이고 효과적인 해결책입니다.**

이유:

1. **검증된 패턴**: T3 Stack 등 많은 프로젝트에서 사용
2. **단일 소스**: Drizzle 스키마가 공유 패키지에 있어 모든 곳에서 접근 가능
3. **모노레포 원칙**: AGENTS.md의 원칙과 일치
4. **장기적 이점**: 유지보수 비용 감소, 확장성 향상

**하지만 즉시 적용할 필요는 없습니다.**

현재는:

- 검증 스크립트로 동기화 누락 방지
- 문서화로 개발자 인지도 향상
- 점진적 마이그레이션 계획 수립

**권장 일정:**

- 이번 주: 검증 스크립트 및 문서화 (완료)
- 다음 주: 구조 개선 계획 수립 및 리뷰
- 2주 후: 작은 규모 마이그레이션 시작
- 1개월 내: 전체 마이그레이션 완료

---

## 참고 자료

- [T3 Stack 공식 문서](https://create.t3.gg/)
- [Drizzle ORM 모노레포 가이드](https://orm.drizzle.team/docs/overview)
- [모노레포 모범 사례](https://monorepo.tools/)
