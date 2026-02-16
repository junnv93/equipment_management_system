# 아키텍처 리팩토링 계획: Classification/TeamType 통합

## 📋 Executive Summary

**목적**: SSOT 원칙 준수 + API 일관성 확보 + Cross-site workflow 지원
**범위**: 3중 SSOT 위반 해결, 케이싱 통일, 매핑 상수 단일화
**영향도**: Backend (2개 모듈), Frontend (6개 파일), DB Schema (1개 테이블)

---

## 🎯 Phase 1: SSOT 통합 (schemas 패키지)

### 1.1 새로운 SSOT 정의

**파일**: `packages/schemas/src/enums.ts`

```typescript
// ============================================================================
// Classification (팀과 1:1 매핑) - SSOT
// ============================================================================

/**
 * 장비 분류 / 팀 유형 통합 Enum
 *
 * ✅ SINGLE SOURCE OF TRUTH
 * - 팀의 타입을 나타냄 (Team.classification)
 * - 장비의 분류를 나타냄 (Equipment.classification)
 * - 관리번호의 분류코드와 매핑됨 (E, R, W, S, A, P)
 *
 * ⚠️ 케이싱: 소문자 + 언더스코어 (snake_case)
 * - API 요청/응답: 소문자
 * - DB 저장: 소문자
 * - Frontend: 소문자
 */
export const ClassificationEnum = z.enum([
  'fcc_emc_rf', // FCC EMC/RF → E
  'general_emc', // General EMC → R
  'general_rf', // General RF → W (의왕)
  'sar', // SAR → S
  'automotive_emc', // Automotive EMC → A
  'software', // Software Program → P
]);

export type Classification = z.infer<typeof ClassificationEnum>;

/**
 * 분류 → 분류코드(1자리) 매핑 - SSOT
 * ⚠️ 이 상수가 시스템 전체의 유일한 매핑입니다
 */
export const CLASSIFICATION_TO_CODE: Record<Classification, string> = {
  fcc_emc_rf: 'E',
  general_emc: 'R',
  general_rf: 'W',
  sar: 'S',
  automotive_emc: 'A',
  software: 'P',
};

/**
 * 분류코드 → 분류 역매핑
 */
export const CODE_TO_CLASSIFICATION: Record<string, Classification> = {
  E: 'fcc_emc_rf',
  R: 'general_emc',
  W: 'general_rf',
  S: 'sar',
  A: 'automotive_emc',
  P: 'software',
};

/**
 * 분류 표시 라벨
 */
export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  fcc_emc_rf: 'FCC EMC/RF',
  general_emc: 'General EMC',
  general_rf: 'General RF',
  sar: 'SAR',
  automotive_emc: 'Automotive EMC',
  software: 'Software Program',
};
```

### 1.2 team.ts 수정

```typescript
// packages/schemas/src/team.ts

import { z } from 'zod';
import { SiteEnum, ClassificationEnum } from './enums'; // ← ClassificationEnum 재사용
import { BaseEntity, SoftDeleteEntity, PaginatedResponse } from './common/base';

// ❌ TeamTypeEnum 제거 (ClassificationEnum 사용)
// ❌ ClassificationCodeEnum 제거 (CLASSIFICATION_TO_CODE 사용)

export const baseTeamSchema = z.object({
  name: z.string().min(1).max(100),
  classification: ClassificationEnum, // ← type → classification으로 리네이밍
  site: SiteEnum,
  description: z.string().max(500).optional(),
  leaderId: z.string().uuid().optional(),
});

// ...
```

---

## 🗄️ Phase 2: 데이터베이스 마이그레이션

### 2.1 마이그레이션 스크립트

**파일**: `apps/backend/drizzle/manual/YYYYMMDD_unify_classification.sql`

```sql
-- Step 1: team.type을 소문자로 변환
UPDATE teams SET type = LOWER(type);

-- 레거시 값 정규화
UPDATE teams SET type = 'fcc_emc_rf' WHERE type = 'rf';
UPDATE teams SET type = 'general_emc' WHERE type = 'emc';
UPDATE teams SET type = 'automotive_emc' WHERE type = 'auto';

-- Step 2: team.type 컬럼명을 classification으로 변경
ALTER TABLE teams RENAME COLUMN type TO classification;

-- Step 3: classification_code는 유지 (1자리 코드)
-- (이미 'E', 'R' 등으로 저장되어 있으므로 변경 불필요)

-- 검증
SELECT
  classification,
  classification_code,
  COUNT(*) as count
FROM teams
GROUP BY classification, classification_code
ORDER BY classification;
```

### 2.2 Drizzle Schema 수정

**파일**: `packages/db/src/schema/teams.ts`

```typescript
import { pgTable, varchar, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';
import { users } from './users';

// ❌ teamTypes 배열 제거 (schemas/enums.ts 사용)
// ❌ TEAM_TYPE_TO_CLASSIFICATION 제거 (schemas/enums.ts 사용)

export const teams = pgTable(
  'teams',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    classification: varchar('classification', { length: 50 }).notNull(), // ← type → classification
    site: varchar('site', { length: 20 }).notNull(),
    classificationCode: varchar('classification_code', { length: 1 }),
    description: varchar('description', { length: 255 }),
    leaderId: uuid('leader_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    siteIdx: index('teams_site_idx').on(table.site),
    classificationIdx: index('teams_classification_idx').on(table.classification), // ← 새 인덱스
  })
);

// ...
```

### 2.3 시드 데이터 수정

**파일**: `apps/backend/src/database/seed-data/core/teams.seed.ts`

```typescript
import { teams } from '@equipment-management/db/schema';
import { CLASSIFICATION_TO_CODE } from '@equipment-management/schemas'; // ← SSOT import
import {} from /* team IDs */ '../../utils/uuid-constants';

export const TEAMS_SEED_DATA: (typeof teams.$inferInsert)[] = [
  {
    id: TEAM_FCC_EMC_RF_SUWON_ID,
    name: 'FCC EMC/RF',
    classification: 'fcc_emc_rf', // ← 소문자 통일
    site: 'suwon',
    classificationCode: CLASSIFICATION_TO_CODE['fcc_emc_rf'], // ← SSOT 사용
    description: 'FCC EMC/RF Team - Suwon',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // ...
];
```

---

## 🔧 Phase 3: 백엔드/프론트엔드 수정

### 3.1 Backend DTO 수정

**파일**: `apps/backend/src/modules/teams/dto/create-team.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  ClassificationEnum, // ← TeamTypeEnum 대신
  ClassificationCodeEnum,
  SiteEnum,
  CLASSIFICATION_LABELS, // ← SSOT import
  type Classification,
  type ClassificationCode,
  type Site,
} from '@equipment-management/schemas';

export const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  classification: ClassificationEnum, // ← type → classification
  site: SiteEnum,
  classificationCode: ClassificationCodeEnum.optional(),
  description: z.string().max(500).optional(),
  leaderId: z.string().uuid().optional(),
});

export class CreateTeamDto {
  @ApiProperty({ description: '팀 이름', example: 'FCC EMC/RF 테스트팀' })
  name: string;

  @ApiProperty({
    description: '팀 분류 (장비 분류와 동일)',
    enum: ['fcc_emc_rf', 'general_emc', 'general_rf', 'sar', 'automotive_emc', 'software'], // ← 소문자 통일
    example: 'fcc_emc_rf',
  })
  classification: Classification; // ← type → classification

  // ...
}
```

### 3.2 Frontend 중복 상수 제거

**제거 대상**:

1. `apps/frontend/lib/api/teams-api.ts`의 `TEAM_TYPE_TO_CLASSIFICATION` → SSOT import
2. `apps/frontend/components/equipment/BasicInfoSection.tsx`의 `TEAM_TYPE_TO_CLASSIFICATION` → SSOT import

**수정 후**:

```typescript
// apps/frontend/lib/api/teams-api.ts

import {
  CLASSIFICATION_TO_CODE,
  CLASSIFICATION_LABELS,
  type Classification,
} from '@equipment-management/schemas'; // ← SSOT import

// ❌ 제거
// export const TEAM_TYPE_TO_CLASSIFICATION = { ... };

export const TEAM_CONFIG: Record<
  Classification, // ← string → Classification
  {
    color: string;
    bgColor: string;
    label: string;
    classificationCode: string;
  }
> = {
  fcc_emc_rf: {
    // ← 소문자 키
    color: '#122C49',
    label: CLASSIFICATION_LABELS.fcc_emc_rf, // ← SSOT 사용
    classificationCode: CLASSIFICATION_TO_CODE.fcc_emc_rf, // ← SSOT 사용
    // ...
  },
  // ...
};
```

---

## 📊 변경 영향 분석

| 구분           | 변경 파일 수 | 변경 라인 수 | Breaking Change     |
| -------------- | ------------ | ------------ | ------------------- |
| schemas 패키지 | 2            | ~50          | Yes (team.ts)       |
| db 패키지      | 1            | ~20          | Yes (teams.ts)      |
| Backend        | 4            | ~80          | Yes (API 응답 형식) |
| Frontend       | 6            | ~150         | Yes (API 요청 형식) |
| DB Migration   | 1            | ~30          | Yes (컬럼명 변경)   |
| **합계**       | **14**       | **~330**     | **Yes**             |

---

## ✅ Breaking Changes 대응

### API 응답 형식 변경

**Before**:

```json
{
  "id": "...",
  "name": "FCC EMC/RF",
  "type": "FCC_EMC_RF", // ← 대문자
  "site": "suwon"
}
```

**After**:

```json
{
  "id": "...",
  "name": "FCC EMC/RF",
  "classification": "fcc_emc_rf", // ← 소문자, 필드명 변경
  "site": "suwon"
}
```

### 마이그레이션 가이드 (Frontend 개발자용)

```typescript
// Before
const team = await teamsApi.getTeam(id);
console.log(team.type); // 'FCC_EMC_RF'

// After
const team = await teamsApi.getTeam(id);
console.log(team.classification); // 'fcc_emc_rf'

// 표시 라벨 가져오기
import { CLASSIFICATION_LABELS } from '@equipment-management/schemas';
console.log(CLASSIFICATION_LABELS[team.classification]); // 'FCC EMC/RF'
```

---

## 🧪 검증 계획

### Phase 1 검증

- [ ] `pnpm --filter @equipment-management/schemas run build` 성공
- [ ] TypeScript 타입 체크 통과
- [ ] 모든 import 에러 없음

### Phase 2 검증

- [ ] 마이그레이션 스크립트 dry-run 성공
- [ ] 데이터 무결성 확인 (모든 team.classification이 유효한 값)
- [ ] 인덱스 생성 확인

### Phase 3 검증

- [ ] Backend 빌드 성공
- [ ] Frontend 빌드 성공
- [ ] E2E 테스트 통과 (12개 테스트 케이스)
- [ ] API 문서 (Swagger) 업데이트 확인

---

## 📅 실행 타임라인

| Phase    | 작업                  | 예상 시간   | 의존성  |
| -------- | --------------------- | ----------- | ------- |
| 1        | SSOT 통합             | 30분        | -       |
| 2        | DB 마이그레이션       | 1시간       | Phase 1 |
| 3        | Backend/Frontend 수정 | 2시간       | Phase 2 |
| 검증     | 전체 테스트           | 1시간       | Phase 3 |
| **합계** |                       | **4.5시간** |         |

---

## 🚀 실행 여부 결정

**진행 시 이점**:
✅ SSOT 원칙 완전 준수
✅ API 일관성 확보 (대소문자 통일)
✅ 유지보수성 향상 (매핑 상수 1곳만 관리)
✅ Cross-site workflow 지원 개선

**진행 시 리스크**:
⚠️ Breaking Change (API 클라이언트 모두 업데이트 필요)
⚠️ 데이터베이스 마이그레이션 필요
⚠️ 4.5시간 개발 시간 소요

---

## 💡 권장 사항

**시니어 개발자 관점 권장**: **즉시 진행**

**이유**:

1. 현재 시스템이 작동 중이지만 SSOT 위반으로 인한 **기술 부채 누적 중**
2. 시간이 지날수록 영향 범위 확대 (신규 기능 추가 시 혼란 증가)
3. 4.5시간 투자로 **장기 유지보수 비용 50% 절감** 예상
4. Breaking Change이지만 **내부 API**이므로 통제 가능
5. E2E 테스트 커버리지 충분 (안전한 리팩토링 가능)

**대안 (보수적)**: Phase별 점진 진행

- Week 1: Phase 1 (SSOT 정의)
- Week 2: Phase 2 (DB 마이그레이션)
- Week 3: Phase 3 (Application 수정)
