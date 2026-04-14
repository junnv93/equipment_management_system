# 스키마 중복 정의 정리 계획

## 현재 상태

현재 프로젝트에서 동일한 데이터 구조가 3곳에서 정의되어 있습니다:

1. **Drizzle 스키마** (`packages/db/src/schema/`)
   - 데이터베이스 테이블 정의
   - 마이그레이션 생성의 기준

2. **Zod 스키마** (`packages/schemas/src/`)
   - 런타임 검증
   - TypeScript 타입 추론

3. **DTO 클래스** (`apps/backend/src/modules/*/dto/`)
   - class-validator 데코레이터
   - Swagger 문서화

## 문제점

- **유지보수 부담**: 필드 추가/수정 시 3곳을 모두 변경해야 함
- **불일치 위험**: 수동 동기화로 인한 오류 가능성
- **코드 중복**: 동일한 검증 로직이 여러 곳에 분산

## 목표 아키텍처 (Single Source of Truth)

```
Drizzle 스키마 (packages/db)
        ↓
   drizzle-zod
        ↓
Zod 스키마 (packages/schemas) ← 자동 생성 + 확장
        ↓
    z.infer<>
        ↓
TypeScript 타입 (자동 추론)
```

## 마이그레이션 단계

### Phase 1: 기반 구축 (완료)

- [x] 에러 처리 유틸리티 추가
- [x] 환경 변수 Zod 검증 추가
- [x] TypeScript 설정 부분 개선

### Phase 2: Zod 마이그레이션 (진행 중)

현재 class-validator를 사용하는 모듈들을 Zod로 마이그레이션:

| 모듈          | 상태    | 비고                    |
| ------------- | ------- | ----------------------- |
| Equipment     | ✅ 완료 | ZodValidationPipe 사용  |
| Rentals       | ✅ 완료 | ZodValidationPipe 사용  |
| Checkouts     | ✅ 완료 | ZodValidationPipe 사용  |
| Auth          | ⏳ 대기 | class-validator 사용 중 |
| Users         | ⏳ 대기 | class-validator 사용 중 |
| Calibration   | ⏳ 대기 | class-validator 사용 중 |
| Teams         | ⏳ 대기 | class-validator 사용 중 |
| Notifications | ⏳ 대기 | class-validator 사용 중 |

### Phase 3: drizzle-zod 통합

1. `packages/db`에 drizzle-zod 의존성 추가
2. Drizzle 스키마에서 Zod 스키마 자동 생성
3. `packages/schemas`에서 자동 생성된 스키마 re-export
4. 기존 수동 정의 스키마를 자동 생성으로 대체

### Phase 4: DTO 클래스 제거

1. class-validator 의존성 제거
2. DTO 클래스를 Zod 스키마 기반 타입으로 대체
3. Swagger 문서화를 위한 별도 설정 (nestjs-zod 활용)

## 마이그레이션 가이드

### 모듈별 Zod 마이그레이션 방법

```typescript
// 1. packages/schemas에 스키마 정의 (또는 drizzle-zod에서 생성)
export const createEquipmentSchema = z.object({
  name: z.string().min(1),
  status: equipmentStatusSchema,
  // ...
});

export type CreateEquipmentDto = z.infer<typeof createEquipmentSchema>;

// 2. 컨트롤러에서 ZodValidationPipe 사용
@UsePipes(new ZodValidationPipe(createEquipmentSchema))
@Post()
async create(@Body() dto: CreateEquipmentDto) {
  // ...
}
```

### Swagger 문서화

```typescript
// nestjs-zod 패키지를 사용한 Swagger 통합
import { createZodDto } from 'nestjs-zod';

export class CreateEquipmentSwaggerDto extends createZodDto(createEquipmentSchema) {}

@ApiBody({ type: CreateEquipmentSwaggerDto })
@Post()
async create(@Body() dto: CreateEquipmentDto) {
  // ...
}
```

## 타임라인 (권장)

| 단계         | 예상 기간 | 우선순위 |
| ------------ | --------- | -------- |
| Phase 2 완료 | 2-3주     | 높음     |
| Phase 3      | 1주       | 중간     |
| Phase 4      | 2주       | 낮음     |

## 참고 자료

- [drizzle-zod 문서](https://orm.drizzle.team/docs/zod)
- [nestjs-zod 문서](https://github.com/risen228/nestjs-zod)
- [Zod 공식 문서](https://zod.dev/)
