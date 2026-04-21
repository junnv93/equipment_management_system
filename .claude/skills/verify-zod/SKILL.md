---
name: verify-zod
description: Verifies Zod validation pattern compliance — ZodValidationPipe usage (no class-validator), versionedSchema inclusion in state-change DTOs, controller pipe application, query DTO consistency, ZodResponse ↔ ZodSerializerInterceptor pairing, 2xx-only ZodResponse scope. Run after adding/modifying DTOs or controller endpoints.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 모듈명]'
---

# Zod 검증 패턴 검증

## Purpose

백엔드 DTO와 컨트롤러가 Zod 기반 검증 패턴을 올바르게 준수하는지 검증합니다:

1. **ZodValidationPipe 사용** — 모든 DTO에 ZodValidationPipe 내보내기
2. **class-validator 금지** — class-validator 데코레이터(@IsString 등) 사용 금지
3. **Query DTO targets 설정** — Query DTO는 `targets: ['query']` 명시
4. **DTO 구조 패턴** — Zod schema → Type inference → Pipe → Swagger class 순서
5. **Controller Pipe 적용** — DTO에 정의된 Pipe가 컨트롤러에서 실제 사용되는지
6. **Query DTO z.coerce/z.preprocess 일관성** — 동일 파일 내 혼용 탐지
7. **Response DTO 불필요한 Pipe** — 응답 DTO에 ValidationPipe가 있으면 안 됨
8. **z.infer 타입 export 누락** — schema 정의 파일에 타입 추출 누락 탐지
9. **type-only DTO runtime 위치 사용** — `@Api{Body,Response,Property}({ type })` 런타임 위치에 `z.infer` type alias 사용 금지 (TS2693)
10. **ZodResponse ↔ ZodSerializerInterceptor pairing + 2xx 전용 스코프** — `@ZodResponse` 사용 메서드는 같은 메서드에 `@UseInterceptors(ZodSerializerInterceptor)` 명시, 4xx 응답은 `@ApiResponse` 유지

## When to Run

- 새로운 DTO를 추가한 후
- 기존 DTO의 검증 로직을 수정한 후
- 새로운 모듈을 생성한 후
- ZodValidationPipe 관련 변경 후

## Related Files

| File                                                                | Purpose                                         |
| ------------------------------------------------------------------- | ----------------------------------------------- |
| `apps/backend/src/common/pipes/zod-validation.pipe.ts`              | ZodValidationPipe 구현 (ValidationTarget 포함)  |
| `apps/backend/src/common/dto/base-versioned.dto.ts`                 | versionedSchema 베이스 DTO                      |
| `apps/backend/src/modules/equipment/dto/equipment-query.dto.ts`     | Query DTO 참조 구현 (z.preprocess 패턴)         |
| `apps/backend/src/modules/checkouts/dto/approve-checkout.dto.ts`    | Body DTO 참조 구현 (versionedSchema 포함)       |
| `apps/backend/src/modules/calibration/dto/calibration-query.dto.ts` | Query DTO 참조 구현 (z.coerce.date 패턴)        |
| `apps/backend/src/modules/audit/dto/audit-log-query.dto.ts`         | Query DTO 참조 구현 (targets: ['query'] 포함)   |
| `apps/backend/src/modules/checkouts/checkouts.controller.ts`        | Controller Pipe 적용 참조 (@UsePipes 패턴)      |
| `apps/backend/src/modules/equipment/equipment.controller.ts`        | Controller Pipe 적용 참조 (파라미터 Pipe 패턴)  |
| `apps/backend/src/modules/checkouts/dto/handover-token.dto.ts`      | createZodDto 기반 class DTO 참조 구현 (신규 권장) |
| `packages/schemas/src/fsm/checkout-fsm.ts`                          | FSM SSOT — `NextStepDescriptorSchema` (`z.ZodType<NextStepDescriptor>`) 포함 |

## Workflow

### Step 1: class-validator 사용 탐지

class-validator 데코레이터가 사용되고 있지 않은지 확인합니다.

```bash
# class-validator 데코레이터 사용 탐지 (주석 제외)
grep -rn "@IsString\|@IsNumber\|@IsOptional\|@IsEmail\|@IsBoolean\|@IsEnum\|@IsArray\|@IsUUID\|@IsDate\|@IsNotEmpty\|@MinLength\|@MaxLength\|@Min\|@Max\|@ValidateNested" apps/backend/src/modules --include="*.dto.ts"
```

**PASS 기준:** 0개 결과.

**FAIL 기준:** 하나라도 발견되면 Zod schema로 마이그레이션 필요.

```bash
# class-validator import 탐지 (주석이 아닌 실제 import)
grep -rn "^import.*class-validator" apps/backend/src/modules --include="*.ts"
```

**PASS 기준:** 0개 결과.

### Step 2: ZodValidationPipe 내보내기 확인

모든 DTO 파일이 ZodValidationPipe 인스턴스를 내보내는지 확인합니다.

```bash
# DTO 파일 중 ZodValidationPipe를 내보내지 않는 파일 탐지
for f in $(find apps/backend/src/modules/*/dto -name "*.dto.ts" ! -name "index.ts" ! -name "base-*.dto.ts"); do
  grep -L "ZodValidationPipe\|ValidationPipe" "$f" 2>/dev/null
done
```

**PASS 기준:** 모든 DTO 파일(index.ts, base-\* 제외)에 ZodValidationPipe가 있어야 함.

**FAIL 기준:** DTO에 Zod schema는 있지만 ValidationPipe 내보내기가 없으면 위반.

### Step 3: Query DTO targets 설정 확인

Query DTO가 `targets: ['query']`를 명시하는지 확인합니다.

```bash
# *-query.dto.ts 파일에서 targets: ['query'] 확인
for f in $(find apps/backend/src/modules/*/dto -name "*-query.dto.ts"); do
  if ! grep -q "targets.*query" "$f"; then
    echo "MISSING targets: $f"
  fi
done
```

**PASS 기준:** 모든 `*-query.dto.ts` 파일에 `targets: ['query']`가 설정되어 있어야 함.

**FAIL 기준:** Query DTO에 targets 설정이 없으면 `@Param` 오검증 버그 발생 가능.

### Step 4: DTO 구조 패턴 확인

DTO 파일이 표준 구조(Zod schema → Type inference → Pipe)를 따르는지 확인합니다.

```bash
# Zod schema 정의 확인
grep -rn "z\.object\|z\.string\|z\.number" apps/backend/src/modules/*/dto --include="*.dto.ts" -l
```

```bash
# Type inference 패턴 확인 (z.infer)
grep -rn "z\.infer<typeof" apps/backend/src/modules/*/dto --include="*.dto.ts" -l
```

**PASS 기준:** Zod schema를 정의하는 모든 파일에 `z.infer<typeof>` 타입 추출이 있어야 함.

### Step 5: Controller에서 Pipe 적용 확인

DTO에 정의된 ZodValidationPipe가 컨트롤러에서 실제로 사용되는지 확인합니다. Pipe가 정의만 되고 적용되지 않으면 검증이 완전히 무시됩니다.

```bash
# Pipe를 export하는 DTO 파일의 Pipe 이름 추출
grep -rn "export const.*Pipe\s*=" apps/backend/src/modules/*/dto --include="*.dto.ts" | grep "ZodValidationPipe" | sed 's/.*export const \([^ ]*\).*/\1/' | sort > /tmp/dto_pipes.txt
```

```bash
# 컨트롤러에서 @UsePipes 또는 파라미터 데코레이터로 Pipe 사용 확인
grep -rn "@UsePipes\|@Body.*Pipe\|@Query.*Pipe" apps/backend/src/modules --include="*.controller.ts" | grep -oP '\w+Pipe' | sort | uniq > /tmp/used_pipes.txt
```

```bash
# DTO에 정의되었지만 컨트롤러에서 사용되지 않는 Pipe 탐지
comm -23 /tmp/dto_pipes.txt /tmp/used_pipes.txt
```

**PASS 기준:** 모든 DTO Pipe가 컨트롤러에서 사용됨.

**FAIL 기준:** Pipe가 정의만 되고 컨트롤러에서 적용되지 않으면 검증 누락 — 클라이언트 잘못된 입력이 서비스까지 도달.

```typescript
// ❌ WRONG — Pipe 정의했지만 controller에서 미사용 (검증 무시)
// dto:  export const UpdateEquipmentPipe = new ZodValidationPipe(updateEquipmentSchema);
// controller:
@Patch(':uuid')
update(@Body() dto: UpdateEquipmentDto) { ... } // ← Pipe 미적용!

// ✅ CORRECT — @UsePipes로 적용
@Patch(':uuid')
@UsePipes(UpdateEquipmentPipe)
update(@Body() dto: UpdateEquipmentDto) { ... }

// ✅ CORRECT — 파라미터 데코레이터로 적용
@Patch(':uuid')
update(@Body(UpdateEquipmentPipe) dto: UpdateEquipmentDto) { ... }
```

### Step 6: Query DTO z.coerce/z.preprocess 혼용 탐지

동일 Query DTO 파일 내에서 `z.coerce`와 `z.preprocess`를 혼용하면 타입 변환 일관성이 깨집니다. 파일 단위로 하나의 패턴을 유지해야 합니다.

```bash
# 동일 파일 내 z.coerce + z.preprocess 혼용 탐지
for f in $(find apps/backend/src/modules/*/dto -name "*-query.dto.ts"); do
  has_coerce=$(grep -c "z\.coerce\." "$f" 2>/dev/null || echo 0)
  has_preprocess=$(grep -c "z\.preprocess" "$f" 2>/dev/null || echo 0)
  if [ "$has_coerce" -gt 0 ] && [ "$has_preprocess" -gt 0 ]; then
    echo "MIXED: $f (coerce=$has_coerce, preprocess=$has_preprocess)"
  fi
done
```

**PASS 기준:** 각 Query DTO 파일이 `z.coerce` 또는 `z.preprocess` 중 하나만 사용.

**FAIL 기준:** 동일 파일 내 혼용 → null/undefined 처리 방식이 필드마다 달라져 예측 불가능한 동작.

```typescript
// ❌ WRONG — 같은 파일에서 혼용
export const querySchema = z.object({
  page: z.coerce.number().default(1),                                    // z.coerce
  status: z.preprocess((v) => v || undefined, z.string().optional()),    // z.preprocess
});

// ✅ CORRECT — 파일 내 일관된 패턴
export const querySchema = z.object({
  page: z.preprocess((v) => (v ? Number(v) : 1), z.number().int().min(1).default(1)),
  status: z.preprocess((v) => v || undefined, z.string().optional()),
});
```

### Step 7: Response DTO 불필요한 ValidationPipe 탐지

응답 DTO(`*-response.dto.ts`)에 ValidationPipe가 있으면 불필요한 검증 오버헤드이며, 실수로 request 검증에 사용될 수 있습니다.

```bash
# Response DTO에 ZodValidationPipe가 있는지 탐지
for f in $(find apps/backend/src/modules/*/dto -name "*-response.dto.ts"); do
  if grep -q "ZodValidationPipe\|ValidationPipe" "$f"; then
    echo "UNNECESSARY PIPE: $f"
  fi
done
```

**PASS 기준:** Response DTO에 ValidationPipe가 없어야 함.

**FAIL 기준:** Response DTO에 Pipe가 있으면 제거 필요 — 응답은 서버가 생성하므로 검증 불필요.

### Step 8: z.infer 타입 export 누락 탐지

Zod schema를 export하지만 `z.infer<typeof>` 타입을 export하지 않으면, 소비자가 loose 타입을 사용하게 됩니다.

```bash
# schema는 export하지만 z.infer type을 export하지 않는 DTO 탐지
for f in $(find apps/backend/src/modules/*/dto -name "*.dto.ts" ! -name "index.ts" ! -name "*-response.dto.ts"); do
  has_schema=$(grep -c "export const.*Schema\s*=" "$f" 2>/dev/null || echo 0)
  has_infer=$(grep -c "z\.infer<typeof" "$f" 2>/dev/null || echo 0)
  if [ "$has_schema" -gt 0 ] && [ "$has_infer" -eq 0 ]; then
    echo "MISSING TYPE EXPORT: $f"
  fi
done
```

**PASS 기준:** Zod schema를 export하는 모든 DTO에 `z.infer<typeof>` 타입 export가 있어야 함.

**FAIL 기준:** schema만 있고 타입 추출이 없으면 → 서비스/컨트롤러에서 수동 타입 정의 필요 (SSOT 위반).

```typescript
// ❌ WRONG — schema만 export, 타입 누락
export const createEquipmentSchema = z.object({ name: z.string(), ... });
export const CreateEquipmentPipe = new ZodValidationPipe(createEquipmentSchema);
// 소비자가 직접 타입을 만들어야 함

// ✅ CORRECT — schema + 타입 + Pipe 모두 export
export const createEquipmentSchema = z.object({ name: z.string(), ... });
export type CreateEquipmentDto = z.infer<typeof createEquipmentSchema>;
export const CreateEquipmentPipe = new ZodValidationPipe(createEquipmentSchema);
```

### Step 9: type-only DTO 의 runtime value 위치 사용 탐지

`z.infer<typeof Schema>` 로 만든 type alias 는 **런타임 값이 아니다**. 이것을 Swagger `@ApiBody({ type: Dto })` / `@ApiResponse({ type: Dto })` / `@ApiProperty({ type: Dto })` 등 런타임 value 위치에 쓰면 TypeScript `TS2693` (`only refers to a type, but is being used as a value`) 로 **Nest 부팅이 차단**된다. 실측 발생 버그 (2026-04-17, checkouts.controller.ts `verifyHandoverToken`).

해결책 두 가지:
1. **신규 DTO (권장)**: `nestjs-zod` 의 `createZodDto(Schema)` 로 class 생성 — 런타임 값 + TS 타입 + Swagger 메타를 한 SSOT 에서 파생.
2. **기존 수동 class DTO**: 유지 (점진 마이그레이션 대상).

```bash
# type 으로만 선언된 DTO 를 @ApiBody/@ApiResponse/@ApiProperty 의 type 필드에 사용하는 패턴 탐지
# 1) type-only DTO 이름 수집
grep -rnE "^export type ([A-Z][A-Za-z0-9]*Dto) = z\.infer" apps/backend/src/modules --include="*.dto.ts" \
  | sed -E 's/.*export type ([A-Z][A-Za-z0-9]*Dto) = .*/\1/' | sort -u > /tmp/type_only_dtos.txt

# 2) 컨트롤러에서 @ApiBody({ type: Dto }) / @ApiResponse({ type: Dto }) / @ApiProperty({ type: Dto }) 에 쓰인 Dto 수집
grep -rnE "@Api(Body|Response|Property)\(\{[^)]*type:\s*([A-Z][A-Za-z0-9]*Dto)" apps/backend/src/modules --include="*.controller.ts" \
  | grep -oE "type:\s*[A-Z][A-Za-z0-9]*Dto" | sed -E 's/type:\s*//' | sort -u > /tmp/api_runtime_dtos.txt

# 3) 교집합 = TS2693 위험
comm -12 /tmp/type_only_dtos.txt /tmp/api_runtime_dtos.txt
```

**PASS 기준:** 교집합 0건.

**FAIL 기준:** 하나라도 나오면 해당 DTO 를 `export class X extends createZodDto(Schema) {}` 로 전환.

```typescript
// ❌ WRONG — type-only + runtime value 혼용 → TS2693
export const VerifyHandoverTokenSchema = z.object({ token: z.string().min(1) });
export type VerifyHandoverTokenDto = z.infer<typeof VerifyHandoverTokenSchema>;

@ApiBody({ type: VerifyHandoverTokenDto }) // ← only refers to a type, but is being used as a value
verifyHandoverToken(@Body() dto: VerifyHandoverTokenDto) { ... }

// ✅ CORRECT — createZodDto class 패턴 (신규 DTO 권장)
import { createZodDto } from 'nestjs-zod';
export const VerifyHandoverTokenSchema = z.object({ token: z.string().min(1) });
export class VerifyHandoverTokenDto extends createZodDto(VerifyHandoverTokenSchema) {}

@ApiBody({ type: VerifyHandoverTokenDto }) // ← class 이므로 runtime value OK
verifyHandoverToken(@Body() dto: VerifyHandoverTokenDto) { ... }
```

Swagger OpenAPI 메타의 nullable/$ref/enum 정합성은 `apps/backend/src/main.ts` 의 `cleanupOpenApiDoc()` 후처리로 보정된다.

**참고:** `docs/references/backend-patterns.md` "DTO 작성 결정 트리" 섹션.

### Step 10: ZodResponse ↔ ZodSerializerInterceptor pairing + 2xx 전용 스코프

`@ZodResponse` 는 Swagger 메타만 제공하고, 실제 응답 직렬화는 **반드시 `ZodSerializerInterceptor`** 가 담당한다. 따라서 `@ZodResponse` 가 붙은 메서드에 `@UseInterceptors(ZodSerializerInterceptor)` 가 없으면 Swagger 만 바뀌고 payload 는 pass-through 되어 SSOT 주장이 무효가 된다.

또한 `@ZodResponse` 는 **2xx 응답 전용**이다. 4xx 에러 응답은 `GlobalExceptionFilter` 가 shape 을 관리하므로 기존 `@ApiResponse` 로 유지해야 한다.

```bash
# 10.a — @ZodResponse 가 붙은 메서드에 @UseInterceptors(ZodSerializerInterceptor) 가 메서드 단위 또는 클래스 단위로 있는지
# (현재는 "파일럿 격리 원칙"으로 메서드 단위 권장 — backend-patterns.md 참조)
# 각 controller 에서 @ZodResponse 사용 위치 ↔ ZodSerializerInterceptor 동반 여부 대조
grep -rnE "@ZodResponse\(" apps/backend/src/modules --include="*.controller.ts" | awk -F: '{print $1}' | sort -u > /tmp/zodresponse_files.txt
for f in $(cat /tmp/zodresponse_files.txt); do
  if ! grep -q "ZodSerializerInterceptor" "$f"; then
    echo "MISSING INTERCEPTOR: $f"
  fi
done
```

**PASS 기준:** `@ZodResponse` 를 사용하는 모든 컨트롤러 파일에 `ZodSerializerInterceptor` import + 적용이 존재.

```bash
# 10.b — @ZodResponse 가 4xx status 를 커버하고 있지 않은지 (잘못된 스코프)
grep -rn -A3 "@ZodResponse(" apps/backend/src/modules --include="*.controller.ts" \
  | grep -E "status:\s*(HttpStatus\.(BAD_REQUEST|UNAUTHORIZED|FORBIDDEN|NOT_FOUND|CONFLICT|GONE|UNPROCESSABLE_ENTITY|TOO_MANY_REQUESTS|INTERNAL_SERVER_ERROR)|[45][0-9][0-9])"
```

**PASS 기준:** 0건 (4xx 응답은 `@ApiResponse` 로만 선언).

**FAIL 기준:** `@ZodResponse` 에 4xx 가 사용되면 즉시 수정 — `GlobalExceptionFilter` 가 관리하는 에러 shape 과 충돌.

```typescript
// ❌ WRONG — @ZodResponse 만 있고 interceptor 누락 → Swagger 만 바뀌고 직렬화 안 됨
@Post('handover/verify')
@ZodResponse({ status: HttpStatus.OK, type: VerifyHandoverTokenResponse })
verifyHandoverToken(...) { ... }

// ❌ WRONG — @ZodResponse 가 4xx 커버 (GlobalExceptionFilter 충돌)
@Post()
@UseInterceptors(ZodSerializerInterceptor)
@ZodResponse({ status: HttpStatus.BAD_REQUEST, type: ErrorDto })  // ← 4xx 는 @ApiResponse 로
create(...) { ... }

// ✅ CORRECT — 메서드 단위 interceptor + 2xx only
@Post('handover/verify')
@UseInterceptors(ZodSerializerInterceptor)
@ZodResponse({ status: HttpStatus.OK, description: '...', type: VerifyHandoverTokenResponse })
@ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '무효 토큰' })
verifyHandoverToken(...) { ... }
```

**파일럿 단계 추가 규율 (2026-04-17):** `ZodSerializerInterceptor` 는 **메서드 단위** `@UseInterceptors` 로만 허용. 클래스 단위/글로벌 적용은 금지 — 다른 메서드에 `@ZodResponse` 가 실수로 추가될 때 자동으로 작동하여 반환 객체 불일치 시 500 발생 위험.

**참고:** `docs/references/backend-patterns.md` "ZodResponse 적용 조건" 섹션.

### Step 11: 배열 `.max()` 매직 넘버 탐지 (2026-04-20 추가)

레이아웃/템플릿 제약에서 파생된 배열 크기 상한이 매직 넘버로 DTO에 하드코딩되어 있으면,
레이아웃 파일(예: `software-validation.layout.ts`)과 DTO가 불일치할 때 런타임 에러로만 발견됨.

**규칙:**
- 도메인 레이아웃 상수(`CONTROL_MAX_ROWS`, `MAX_ROWS` 등)에서 파생된 배열 상한 → 레이아웃 상수로 import 필수
- 도메인적으로 "1개만" 허용되는 단순 제약(`.max(1)`) — 레이아웃 구조가 아닌 비즈니스 규칙 — 은 매직 넘버 허용 (예: 단일 책임자, 단일 타입)
- 레이아웃 행 수에서 파생된 `.max(N>1)` 은 반드시 명명된 상수 경유

```bash
# 배열 .max()에 1 초과 숫자 리터럴 직접 사용 탐지 (레이아웃 상수 경유 여부 확인)
grep -rn "\.max([2-9][0-9]*)" \
  apps/backend/src/modules/*/dto --include="*.dto.ts" \
  | grep -v "string.*max\|number.*max\|VM\.\|//\|import"
```

**PASS:** 0건 (모두 명명된 상수 경유). **FAIL:** `.max(3)`, `.max(5)` 등 레이아웃에서 파생된 숫자 리터럴 직접 사용.

**정상 패턴 (SW validation 기준):**
```typescript
import { CONTROL_MAX_ROWS } from '../services/software-validation.layout';
// ✅ 레이아웃 상수 경유
controlFunctions: controlItemArraySchema.max(CONTROL_MAX_ROWS).optional(),
// ✅ 비즈니스 규칙 "단일" 제약 — 예외 허용
acquisitionFunctions: acquisitionOrProcessingArraySchema.max(1).optional(),
```

**예외:** `.max(1)` (단일 레코드 제약)은 레이아웃 행 구조와 무관한 비즈니스 규칙이므로 매직 넘버 허용.

## Output Format

```markdown
| #   | 검사                           | 상태      | 상세                       |
| --- | ------------------------------ | --------- | -------------------------- |
| 1   | class-validator 미사용         | PASS/FAIL | 사용 위치 목록             |
| 2   | ZodValidationPipe 내보내기     | PASS/FAIL | 누락 DTO 목록              |
| 3   | Query DTO targets 설정         | PASS/FAIL | 누락 파일 목록             |
| 4   | DTO 구조 패턴                  | PASS/FAIL | 비정상 구조 목록           |
| 5   | Controller Pipe 적용           | PASS/FAIL | 미적용 Pipe 목록           |
| 6   | Query DTO 패턴 일관성          | PASS/INFO | z.coerce/preprocess 혼용   |
| 7   | Response DTO 불필요 Pipe       | PASS/FAIL | 불필요 Pipe 위치           |
| 8   | z.infer 타입 export            | PASS/FAIL | 타입 누락 DTO 목록         |
| 9   | type-only DTO runtime 위치 사용 | PASS/FAIL | TS2693 위험 DTO 목록       |
| 10  | ZodResponse pairing + 2xx only | PASS/FAIL | interceptor 누락 / 4xx 사용 |
| 11  | 배열 .max() 매직 넘버          | PASS/FAIL | 레이아웃 상수 미경유 숫자 리터럴 위치 |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **DTO의 주석 내 class-validator 언급** — 문서화 목적 (e.g., "class-validator 대신 Zod 사용")
2. **index.ts 파일** — 재 export만 하므로 ZodValidationPipe 불필요
3. **base-versioned.dto.ts** — 베이스 스키마 정의용으로 독립 Pipe 불필요
4. **response DTO** — 응답용 타입 정의는 검증이 불필요하므로 Pipe와 z.infer 모두 없어도 됨 (e.g., `*-response.dto.ts`, `dashboard-response.dto.ts`)
5. **dto/index.ts에서의 re-export** — Barrel file은 Pipe 정의 불필요
6. **Controller 메서드 레벨 Pipe 적용** — `@UsePipes()`와 `@Body(Pipe)` 파라미터 데코레이터 모두 유효한 적용 방식. 둘 중 하나면 충분
7. **프로젝트 전체 z.coerce vs z.preprocess 차이** — 파일 간 패턴 차이는 허용 (기존 코드 존중). 동일 파일 내 혼용만 위반
8. **login.dto.ts, user.dto.ts (auth 모듈)** — 인증 DTO는 NestJS Passport 연동으로 별도 패턴 가능
9. **multipart/form-data 엔드포인트 (파일 업로드)** — `@UseInterceptors(FileInterceptor)` + `@UploadedFile()` 패턴은 DTO 디렉토리 대신 Swagger `@ApiBody({ schema })` 인라인 스키마 허용. documents.controller.ts 등 파일 업로드 전용 엔드포인트가 이에 해당
10. **`createZodDto(Schema)` 기반 class DTO** — class 자체가 schema 를 캡슐화하므로 별도 `z.infer<typeof>` export 가 없어도 Step 8 위반 아님. `z.infer` 가 필요한 곳에서는 `InstanceType<typeof Dto>` 또는 `z.infer<typeof Schema>` 둘 다 허용
11. **`ZodSerializerInterceptor` 클래스 단위/글로벌 등록** — 파일럿 단계(2026-04-17~)에서는 금지. 메서드 단위 `@UseInterceptors` 만 허용. 승격 조건은 `docs/references/backend-patterns.md` "ZodResponse 적용 조건" 의 글로벌 승격 조건 3건 충족 후. Step 10 검증 시 클래스 단위 등록이 발견되면 승격 조건 통과 여부 확인
