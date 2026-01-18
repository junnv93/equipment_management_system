# API 표준 가이드라인

## 개요

이 문서는 장비 관리 시스템의 API 표준을 정의합니다. 모든 코드는 이 표준을 준수해야 하며, 변경 시 이 문서를 먼저 업데이트해야 합니다.

## 핵심 원칙

### 1. Single Source of Truth (단일 소스 원칙)

- **모든 열거형(enum)과 상수는 `packages/schemas/src/enums.ts`에서 정의**
- 다른 패키지나 모듈에서는 이 파일을 import하여 사용
- 직접 정의하거나 중복 정의 금지

### 2. 네이밍 규칙

- **상태값**: 소문자 + 언더스코어 (snake_case)
  - 예: `available`, `in_use`, `under_maintenance`
- **타입/인터페이스**: PascalCase
  - 예: `EquipmentStatus`, `EquipmentStatusEnum`
- **상수**: UPPER_SNAKE_CASE
  - 예: `MAX_PAGE_SIZE`

### 3. 식별자 표준

- **API 엔드포인트**: 모든 리소스 식별자는 `uuid` 사용
  - 경로: `/equipment/:uuid` (❌ `/equipment/:id` 아님)
  - 내부 `id`는 데이터베이스 내부에서만 사용
- **파라미터 검증**: `ParseUUIDPipe` 사용 필수

## 장비 상태값 표준

### 정의 위치

`packages/schemas/src/enums.ts`의 `EquipmentStatusEnum`

### 표준 상태값

| 값                      | 설명           | 사용 시나리오                |
| ----------------------- | -------------- | ---------------------------- |
| `available`             | 사용 가능      | 장비가 대여/반출 가능한 상태 |
| `in_use`                | 사용 중        | 현재 누군가 사용 중인 상태   |
| `checked_out`           | 반출 중        | 외부로 반출된 상태           |
| `calibration_scheduled` | 교정 예정      | 교정 일정이 잡힌 상태        |
| `calibration_overdue`   | 교정 기한 초과 | 교정 기한이 지난 상태        |
| `under_maintenance`     | 유지보수 중    | 수리/점검 중인 상태          |
| `retired`               | 사용 중지      | 더 이상 사용하지 않는 상태   |

### 사용 규칙

1. **API 요청/응답**: 항상 소문자 + 언더스코어 형식 사용
2. **데이터베이스**: PostgreSQL enum 타입으로 저장
3. **프론트엔드**: 표시 시 한글로 변환하여 사용

### 예시

```typescript
// ✅ 올바른 사용
import { EquipmentStatusEnum } from '@equipment-management/schemas';

const status: EquipmentStatus = 'in_use'; // 타입 안전
const isValid = EquipmentStatusEnum.safeParse('in_use'); // 검증

// ❌ 잘못된 사용
const status = 'IN_USE'; // 대문자 사용 금지
const status = 'loaned'; // 표준에 없는 값 사용 금지
```

## 교정 방법 표준

### 정의 위치

`packages/schemas/src/enums.ts`의 `CalibrationMethodEnum`

### 표준 값

| 값                     | 설명      |
| ---------------------- | --------- |
| `external_calibration` | 외부 교정 |
| `self_inspection`      | 자체 점검 |
| `not_applicable`       | 비대상    |

## 사용자 역할 표준

### 정의 위치

`packages/schemas/src/enums.ts`의 `UserRoleEnum`

### 표준 값

| 값                  | 설명            |
| ------------------- | --------------- |
| `test_operator`     | 시험실무자      |
| `technical_manager` | 기술책임자      |
| `site_admin`        | 시험소별 관리자 |

### 역할 설명

- **test_operator (시험실무자)**: 기본 조회 및 대여 신청 권한
- **technical_manager (기술책임자)**: 장비 관리 및 승인 권한
- **site_admin (시험소별 관리자)**: 해당 시험소 내 모든 권한

### 하위 호환성

기존 역할은 다음과 같이 매핑됩니다:

- `admin` → `site_admin`
- `manager` → `technical_manager`
- `user` → `test_operator`
- `approver` → `technical_manager`

## 팀 ID 표준

### 정의 위치

`packages/schemas/src/enums.ts`의 `TeamEnum`

### 표준 값

| 값     | 설명         |
| ------ | ------------ |
| `rf`   | RF팀         |
| `sar`  | SAR팀        |
| `emc`  | EMC팀        |
| `auto` | Automotive팀 |

## 대여 상태값 표준

### 정의 위치

`packages/schemas/src/enums.ts`의 `LoanStatusEnum`

### 표준 상태값

| 값         | 설명                       | 사용 시나리오                                  |
| ---------- | -------------------------- | ---------------------------------------------- |
| `pending`  | 대여 신청 (승인 대기)      | 사용자가 대여를 신청한 상태                    |
| `approved` | 승인됨 (아직 대여 시작 전) | 담당자/매니저가 승인했지만 아직 대여 시작 전   |
| `active`   | 대여 중 (실제 사용 중)     | 실제로 장비를 사용 중인 상태                   |
| `returned` | 반납 완료                  | 장비를 반납한 상태                             |
| `overdue`  | 반납 기한 초과             | 반납 예정일이 지났지만 아직 반납하지 않은 상태 |
| `rejected` | 거절됨                     | 담당자/매니저가 대여를 거절한 상태             |
| `canceled` | 취소됨                     | 신청자가 승인 전에 취소한 상태                 |

### 사용 규칙

1. **API 요청/응답**: 항상 소문자 형식 사용
2. **데이터베이스**: PostgreSQL varchar 타입으로 저장
3. **프론트엔드**: 표시 시 한글로 변환하여 사용

### 예시

```typescript
// ✅ 올바른 사용
import { LoanStatusEnum, LoanStatus } from '@equipment-management/schemas';

const status: LoanStatus = 'pending'; // 타입 안전
const isValid = LoanStatusEnum.safeParse('pending'); // 검증

// ❌ 잘못된 사용
const status = 'PENDING'; // 대문자 사용 금지
const status = 'borrowed'; // 표준에 없는 값 사용 금지 (active 사용)
```

## 반출 상태값 표준

### 정의 위치

`packages/schemas/src/enums.ts`의 `CheckoutStatusEnum`

### 표준 상태값

| 값               | 설명                  | 사용 시나리오                                  |
| ---------------- | --------------------- | ---------------------------------------------- |
| `pending`        | 반출 신청 (승인 대기) | 사용자가 반출을 신청한 상태                    |
| `first_approved` | 1차 승인됨            | 외부 대여 목적 반출의 1차 승인 완료            |
| `final_approved` | 최종 승인됨           | 반출 가능한 상태                               |
| `rejected`       | 거절됨                | 반출이 거절된 상태                             |
| `checked_out`    | 반출 중               | 실제로 반출된 상태                             |
| `returned`       | 반입 완료             | 장비를 반입한 상태                             |
| `overdue`        | 반입 기한 초과        | 반입 예정일이 지났지만 아직 반입하지 않은 상태 |
| `canceled`       | 취소됨                | 신청자가 승인 전에 취소한 상태                 |

### 사용 규칙

1. **API 요청/응답**: 항상 소문자 + 언더스코어 형식 사용
2. **데이터베이스**: PostgreSQL varchar 타입으로 저장
3. **프론트엔드**: 표시 시 한글로 변환하여 사용

## API 엔드포인트 표준

### 리소스 식별자

- **모든 CRUD 엔드포인트는 `uuid` 사용**
- 경로 파라미터: `:uuid` (소문자)
- 검증: `ParseUUIDPipe` 필수

### 예시

```typescript
// ✅ 올바른 엔드포인트
@Get(':uuid')
findOne(@Param('uuid', ParseUUIDPipe) uuid: string) {
  return this.equipmentService.findOne(uuid);
}

// ❌ 잘못된 엔드포인트
@Get(':id')  // id 대신 uuid 사용
findOne(@Param('id') id: string) {  // ParseUUIDPipe 없음
  return this.equipmentService.findOne(id);
}
```

## API 응답 구조 표준

### 핵심 원칙

- **Single Source of Truth**: 모든 API 응답 타입은 `packages/schemas/src/api-response.ts`에서 정의
- **일관성**: 백엔드와 프론트엔드 간 응답 구조 일치 보장
- **중복 제거**: 공통 유틸리티 함수 사용으로 변환 로직 중복 방지

### 백엔드 응답 구조

#### 페이지네이션된 목록 응답

백엔드 서비스는 다음 구조로 응답을 반환합니다:

```typescript
interface PaginatedListResponse<T> {
  items: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}
```

**예시**:

```json
{
  "items": [
    { "id": "uuid-1", "name": "장비 1" },
    { "id": "uuid-2", "name": "장비 2" }
  ],
  "meta": {
    "totalItems": 100,
    "itemCount": 2,
    "itemsPerPage": 20,
    "totalPages": 5,
    "currentPage": 1
  }
}
```

#### 단일 리소스 응답

백엔드 컨트롤러는 서비스에서 반환한 값을 그대로 반환합니다:

```typescript
type SingleResourceResponse<T> = T;
```

**예시**:

```json
{
  "id": "uuid-1",
  "name": "장비 1",
  "status": "available",
  "createdAt": "2025-01-16T00:00:00Z"
}
```

### 프론트엔드 응답 구조

프론트엔드는 백엔드 응답을 다음 구조로 변환하여 사용합니다:

#### 페이지네이션된 목록 응답

```typescript
interface FrontendPaginatedResponse<T> {
  data: T[];
  meta: {
    pagination: {
      total: number;
      pageSize: number;
      currentPage: number;
      totalPages: number;
    };
  };
}
```

**예시**:

```json
{
  "data": [
    { "id": "uuid-1", "name": "장비 1" },
    { "id": "uuid-2", "name": "장비 2" }
  ],
  "meta": {
    "pagination": {
      "total": 100,
      "pageSize": 20,
      "currentPage": 1,
      "totalPages": 5
    }
  }
}
```

### 응답 변환 유틸리티

**위치**: `apps/frontend/lib/api/utils/response-transformers.ts`

모든 API 클라이언트는 공통 유틸리티 함수를 사용하여 응답을 변환합니다:

```typescript
// 페이지네이션 응답 변환
import { transformPaginatedResponse } from './utils/response-transformers';

const response = await axios.get('/api/equipment');
const transformed = transformPaginatedResponse<Equipment>(response);
// transformed.data, transformed.meta.pagination 사용
```

```typescript
// 단일 리소스 응답 변환
import { transformSingleResponse } from './utils/response-transformers';

const response = await axios.get('/api/equipment/uuid-1');
const equipment = transformSingleResponse<Equipment>(response);
// equipment 직접 사용
```

### 공통 타입 사용

**위치**: `apps/frontend/lib/api/types.ts`

모든 API 클라이언트는 공통 타입을 사용합니다:

```typescript
// ✅ 올바른 사용
import type { PaginatedResponse } from './types';

async getRentals(): Promise<PaginatedResponse<Rental>> {
  // ...
}
```

```typescript
// ❌ 잘못된 사용 - 각 파일마다 개별 정의 금지
export interface PaginatedResponse<T> {
  // 중복 정의 금지
}
```

### 에러 응답 구조

백엔드는 다음 구조로 에러를 반환합니다:

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    timestamp: string;
  };
}
```

프론트엔드는 공통 에러 변환 유틸리티를 사용합니다:

```typescript
import { transformErrorResponse } from './utils/response-transformers';

try {
  await apiClient.get('/api/equipment');
} catch (error) {
  const transformed = transformErrorResponse(error);
  // transformed.message, transformed.code 사용
}
```

### 사용 규칙

1. **백엔드**: 서비스에서 `PaginatedListResponse<T>` 구조로 반환
2. **프론트엔드**: 공통 유틸리티 함수로 `FrontendPaginatedResponse<T>`로 변환
3. **타입 정의**: `packages/schemas/src/api-response.ts`에서만 정의
4. **변환 로직**: `apps/frontend/lib/api/utils/response-transformers.ts`에서만 정의
5. **중복 금지**: 각 API 클라이언트에서 개별적으로 변환 로직 작성 금지

### 예시

```typescript
// ✅ 올바른 API 클라이언트 구현
import type { PaginatedResponse } from './types';
import { transformPaginatedResponse, transformSingleResponse } from './utils/response-transformers';

const rentalApi = {
  async getRentals(): Promise<PaginatedResponse<Rental>> {
    const response = await axios.get('/api/rentals');
    return transformPaginatedResponse<Rental>(response);
  },

  async getRental(id: string): Promise<Rental> {
    const response = await axios.get(`/api/rentals/${id}`);
    return transformSingleResponse<Rental>(response);
  },
};
```

```typescript
// ❌ 잘못된 구현 - 중복된 변환 로직
const rentalApi = {
  async getRentals() {
    const response = await axios.get('/api/rentals');
    // 중복된 변환 로직 - 금지
    return {
      data: response.data.items || [],
      meta: { pagination: {...} },
    };
  },
};
```

### 참고 파일

- **타입 정의**: `packages/schemas/src/api-response.ts`
- **변환 유틸리티**: `apps/frontend/lib/api/utils/response-transformers.ts`
- **공통 타입**: `apps/frontend/lib/api/types.ts`

## 데이터베이스 스키마 동기화

### 원칙

- Drizzle 스키마의 enum 값은 `packages/schemas/src/enums.ts`와 **반드시 일치**해야 함
- 스키마 변경 시 마이그레이션 필수

### 동기화 체크리스트

- [ ] Drizzle enum 값이 schemas 패키지와 일치하는가?
- [ ] 마이그레이션 파일이 생성되었는가?
- [ ] 테스트가 통과하는가?

## 테스트 표준

### 상태값 사용

- 테스트에서도 표준 상태값만 사용
- 하드코딩된 상태값 금지

```typescript
// ✅ 올바른 테스트
import { EquipmentStatusEnum } from '@equipment-management/schemas';

const equipment = {
  status: 'in_use' as EquipmentStatus, // 표준 값 사용
};

// ❌ 잘못된 테스트
const equipment = {
  status: 'loaned', // 표준에 없는 값
  status: 'IN_USE', // 대문자 사용
};
```

## 변경 관리

### 새로운 상태값 추가 시

1. `packages/schemas/src/enums.ts`에 추가
2. 데이터베이스 스키마 업데이트 (마이그레이션)
3. 이 문서 업데이트
4. 모든 테스트 업데이트
5. 프론트엔드 표시 로직 업데이트

### 기존 상태값 변경 시

1. **절대 기존 값 변경 금지** (하위 호환성)
2. 새 값 추가 후 점진적 마이그레이션
3. 사용 중단(deprecated) 표시 후 충분한 기간 후 제거

## 대여 반려 사유 필수 규칙

### 요구사항

- 모든 대여 반려 시 반드시 사유를 기재해야 함
- API에서 `rejectionReason` 필드가 비어있으면 400 Bad Request 반환

### 예시

```typescript
// ✅ 올바른 반려
PATCH /rentals/:uuid/reject
{
  "approverId": "uuid",
  "reason": "장비가 교정 예정으로 대여 불가"
}

// ❌ 잘못된 반려 (사유 없음)
PATCH /rentals/:uuid/reject
{
  "approverId": "uuid"
  // reason 필드 누락 → 400 Bad Request
}
```

## 참고 파일

- **표준 정의**:
  - `packages/schemas/src/enums.ts` - 열거형 및 상태값
  - `packages/schemas/src/api-response.ts` - API 응답 타입
- **데이터베이스 스키마**:
  - `packages/db/src/schema/equipment.ts`
  - `packages/db/src/schema/loans.ts`
  - `packages/db/src/schema/checkouts.ts`
- **프론트엔드 유틸리티**:
  - `apps/frontend/lib/api/utils/response-transformers.ts` - 응답 변환 유틸리티
  - `apps/frontend/lib/api/types.ts` - 공통 타입 별칭
- **API 문서**: Swagger UI (`/api/docs`)

---

**마지막 업데이트**: 2026-01-16
**버전**: 1.2.0

### 변경 이력

- **v1.2.0** (2026-01-16): API 응답 구조 표준 추가
  - 백엔드/프론트엔드 응답 구조 정의
  - 공통 응답 변환 유틸리티 표준화
  - 타입 안전성 및 중복 제거 원칙 추가
- **v1.1.0** (2025-01-28): 초기 버전
