# API 응답 구조 가이드

## 개요

프로젝트의 API 응답 일관성을 위한 가이드입니다.

## 응답 타입

### 성공 응답 구조

```typescript
interface ApiResponse<T> {
  success: boolean;      // 항상 true
  message?: string;      // 선택적 메시지
  data: T;               // 응답 데이터
  timestamp: string;     // ISO 8601 형식
}
```

### 페이지네이션 응답 구조

```typescript
interface PaginatedResponse<T> {
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

### 에러 응답 구조

```typescript
interface ErrorResponse {
  code: string;          // 에러 코드 (예: 'NOT_FOUND')
  message: string;       // 사용자 친화적 메시지
  timestamp: string;     // ISO 8601 형식
  details?: unknown;     // 추가 상세 정보 (개발 환경)
}
```

## 사용 방법

### 1. 응답 헬퍼 함수 사용 (권장)

```typescript
import {
  createSuccessResponse,
  createCreatedResponse,
  createPaginatedResponse,
} from '../../common/types/api-response';

@Controller('equipment')
export class EquipmentController {
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const equipment = await this.service.findOne(id);
    return createSuccessResponse(equipment, '장비 조회 성공');
  }

  @Post()
  async create(@Body() dto: CreateEquipmentDto) {
    const equipment = await this.service.create(dto);
    return createCreatedResponse(equipment, '장비가 등록되었습니다.');
  }

  @Get()
  async findAll(@Query() query: QueryDto) {
    const { items, meta } = await this.service.findAll(query);
    return createPaginatedResponse(items, meta, '장비 목록 조회 성공');
  }
}
```

### 2. Response Transform 인터셉터 사용

```typescript
import {
  ResponseTransformInterceptor,
  ResponseMessage,
  SkipResponseTransform,
} from '../../common/interceptors/response-transform.interceptor';

@Controller('equipment')
@UseInterceptors(ResponseTransformInterceptor)
export class EquipmentController {
  // 자동으로 ApiResponse 형식으로 래핑됨
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // 커스텀 메시지 지정
  @Post()
  @ResponseMessage('장비가 성공적으로 등록되었습니다.')
  async create(@Body() dto: CreateEquipmentDto) {
    return this.service.create(dto);
  }

  // 변환 건너뛰기 (raw 응답 필요 시)
  @Get('raw/:id')
  @SkipResponseTransform()
  async getRaw(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
```

## 마이그레이션 계획

### Phase 1 (현재)
- 새로운 엔드포인트에 헬퍼 함수 적용
- 기존 응답 구조 유지 (호환성)

### Phase 2
- 프론트엔드 응답 처리 로직 업데이트
- 점진적으로 기존 엔드포인트 마이그레이션

### Phase 3
- 전역 ResponseTransformInterceptor 적용
- 모든 응답 일관성 확보

## 파일 위치

- 타입 정의: `src/common/types/api-response.ts`
- 인터셉터: `src/common/interceptors/response-transform.interceptor.ts`
- 에러 필터: `src/common/filters/error.filter.ts`

## 프론트엔드 연동

프론트엔드에서 응답 처리:

```typescript
// lib/api/types.ts
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

// 응답 처리
async function fetchEquipment(id: string): Promise<Equipment> {
  const response = await api.get<ApiResponse<Equipment>>(`/equipment/${id}`);
  if (!response.data.success) {
    throw new Error(response.data.message);
  }
  return response.data.data;
}
```
