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

### Step 12: required string 필드 `.trim()` whitespace bypass 방지 (2026-04-26 추가)

`z.string().min(1)` 만으로는 공백 문자만 있는 문자열(`'   '`)을 통과시킨다.
사용자가 공백만 입력해도 Zod 검증을 통과하여 빈 값이 DB에 저장되는 버그가 발생한다.
(실측: NC R5 — `rejectionReason` 공백 우회 버그, 2026-04-26)

**규칙:** 필수 문자열 필드(`min(1)` 또는 `min(N)` 사용)에는 반드시 `.trim()` 선행 적용.

```bash
# required string 필드에 .trim() 없이 .min(1)만 사용하는 패턴 탐지
grep -rn "z\.string()\." \
  apps/backend/src/modules/*/dto --include="*.dto.ts" \
  | grep "\.min([1-9]" \
  | grep -v "\.trim()" \
  | grep -v "//\|email()\|url()\|uuid()"
```

**PASS 기준:** 0건 (모든 `min(N≥1)` 필드에 `.trim()` 선행).

**FAIL 기준:** `.trim()` 없는 `.min(1)` 발견 시 → `.string().trim().min(1, VM....)` 으로 수정.

```typescript
// ❌ WRONG — 공백만 입력해도 통과 ('   '.length === 3 > 1)
rejectionReason: z.string().min(1, VM.approval.rejectReason.required)

// ✅ CORRECT — trim 후 length 검사 ('   '.trim() === '' → min(1) 실패)
rejectionReason: z.string().trim().min(1, VM.approval.rejectReason.required)
```

**예외:**
- `.email()`, `.url()`, `.uuid()` — 포맷 검증기 자체가 공백 처리
- 선택 필드 (`.optional()`) — min(1)이 없으므로 해당 없음
- `z.string().min(0)` — 빈 문자열을 허용하는 의도적 선택

### Step 13: Zod `.default(N)` 보장 필드는 DTO 클래스에서 non-optional (2026-04-26 추가)

Zod `.default(N)`이 있는 필드는 검증 후 반드시 값이 있다. 하지만 DTO 클래스에서 `?: number` 또는
`number | undefined`로 선언하면, 서비스/컨트롤러가 `!` assertion 없이는 `undefined` 분기를 처리해야 하고
타입 오류를 유발한다. Zod `.default()`가 보장하는 필드는 DTO 클래스에서 반드시 non-optional로 선언한다.

**탐지 — `.default()` 스키마가 있지만 DTO 클래스에서 optional 선언한 패턴:**
```bash
# Query DTO에서 .default()를 사용하는 필드의 DTO 클래스 선언 확인
for f in $(find apps/backend/src/modules/*/dto -name "*.dto.ts"); do
  # .default(로 끝나는 Zod 필드 이름 추출
  defaults=$(grep -oP "\w+(?=:\s*z\..+\.default\()" "$f" 2>/dev/null)
  for field in $defaults; do
    # 해당 DTO 클래스에서 optional로 선언된 경우 탐지
    if grep -q "${field}?\s*:" "$f" 2>/dev/null; then
      echo "OPTIONAL_BUT_DEFAULT: $f → field '$field' has .default() but declared optional"
    fi
  done
done
```

**PASS 기준:** `.default(N)` 필드가 DTO 클래스에서 non-optional로 선언됨.
**FAIL 기준:** `.default(N)` 있는 Zod 필드가 DTO 클래스에서 `?: T` — 타입 시스템이 `.default()`의 보장을 무시.

```typescript
// ❌ WRONG — .default(10) 이 있지만 클래스 타입은 optional
export const InboundOverviewQuerySchema = z.object({
  limitPerSection: z.coerce.number().int().positive().max(50).default(10),
});
export class InboundOverviewQueryDto {
  limitPerSection?: number; // ← .default(10) 이 있는데 optional?
}

// ✅ CORRECT — .default()가 보장하므로 non-optional
export class InboundOverviewQueryDto {
  limitPerSection: number; // ← 항상 숫자 (검증 통과 후 Zod가 채워줌)
  statusFilter?: string;   // ← .optional()은 그대로 optional
}
```

**근거:** `InboundOverviewQueryDto.limitPerSection?: number`으로 선언했다가
`checkoutsService.getInboundOverview()`에서 `query.limitPerSection`이 `number | undefined`가 되어
서비스 파라미터 타입 불일치 발생 (Sprint 3.1, 2026-04-26).

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
| 12  | required string .trim() 여부   | PASS/FAIL | .min(1) 앞 .trim() 누락 DTO 위치 |
| 13  | .default() 필드 non-optional   | PASS/FAIL | .default() 있는데 DTO 클래스 optional 선언 위치 |
| 14  | Pipe DTO 통과 필드 ↔ service 호출 인자 (silent loss 차단) | PASS/FAIL | underscore prefix 의심 위치 + DTO 필드 미전달 호출 |
| 20  | Query DTO trim/max + sort enum SSOT | PASS/FAIL | optionalTrimmedString 미경유 / `sort: z.string()` / mapper satisfies 누락 위치 |
```

### Step 14: Pipe DTO 통과 필드 ↔ service 호출 인자 매핑 정합 — silent loss 차단 (2026-04-28 추가)

**탐지 대상**: controller에서 `@UsePipes(SomePipe)` 적용 후 `service.method(...)` 호출 시 DTO에 정의된 도메인 필드가 service 시그니처에서 누락되어 silent loss(사용자 입력이 어디에도 저장되지 않음)가 발생하는 케이스. ESLint `no-unused-vars` 의 `argsIgnorePattern: '^_'` 가 underscore prefix를 통과시키는 갭을 정적으로 차단.

**원인 패턴**:
- service 메서드 작성 시 DTO 필드 무시 → ESLint underscore prefix(`_paramName`) 우회로 lint 통과
- DTO에 새 필드 추가했지만 service 시그니처 미동기화
- DTO 재사용(예: `ApproveValidationPipe`를 `qualityApprove`에서도 사용)했지만 service 시그니처는 단순한 형태로 남음

**검증 명령**:
```bash
# 1. service 메서드 파라미터에 underscore prefix가 있는 곳 탐지 (silent loss 의심)
#    test/spec/__tests__/ 디렉토리 제외
grep -rnE "async\s+\w+\([^)]*_[a-zA-Z]\w*\s*[?:]" \
  apps/backend/src/modules/*/services apps/backend/src/modules/*/*.service.ts \
  2>/dev/null | grep -v "\.spec\.ts" | grep -v "__tests__"
# expected: 0 hits — 신규 도메인 silent loss 의심 위치 0건

# 2. DTO 정의 필드 ↔ service 호출 인자 비교 (도메인별 수동 검증)
#    예: ApproveValidationPipe DTO에 approvalComment 있고 controller가 service.method(... dto.approvalComment) 전달하는지
grep -A20 "ApproveValidationPipe\|QualityApproveValidationPipe" \
  apps/backend/src/modules/software-validations/software-validations.controller.ts \
  | grep -E "dto\.[a-zA-Z]+|service\..*\(" | head -10
```

**예외**:
- spec/test 파일 내 mock 메서드 — `spec.ts`/`__tests__/` 경로
- VersionedBaseService 같은 base class의 `_unused?` 호환 파라미터 — 별도 정당화 주석(`// allowed: <reason>`) 추가
- 데코레이터 메타데이터 전용 파라미터 — `@Body() _body: never` 처럼 의도된 unused

**관련 사고**:
- `software-validation-approve-comment-silent-loss` (2026-04-28): `_approvalComment` underscore prefix가 lint를 통과시켰지만 도메인 가치 0. 1주일간 silent loss.
- `qualityApprove-comment-silent-loss` (2026-04-28): controller가 `ApproveValidationPipe` 재사용으로 `approvalComment` 통과 → service `qualityApprove(id, version, approverId)` 폐기 → DTO 분리 + `qualityApprovalComment` 컬럼 신설로 closure.

**PASS 기준**:
- service 디렉토리에서 underscore prefix 파라미터 0건 (또는 모두 `// allowed:` 주석 보유)
- 도메인 검수: DTO 필드가 controller→service 전달 누락 0건

**FAIL 기준**:
- 정당화 없는 underscore prefix 파라미터 1건 이상
- DTO 필드가 service 시그니처에 누락되어 사용자 입력 silent loss

### Step 15: Frontend `< N` 하드코딩 ↔ Backend Zod `.min(N)`/`.max(N)` SSOT 동기화 강제 (REJECTION_REASON_MIN_LENGTH + REVOCATION_REASON_MIN_LENGTH + EXTENDED_TEXT_MAX_LENGTH 동기화) (2026-05-01 추가, 2026-05-03 보강)

**탐지 대상**: `rejectionReason`, `opinion`, `comment`, `reason`, `cause` 등 사용자 자유 텍스트 필드의 frontend ↔ backend 검증 강도 불일치 — `VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH` SSOT 미경유. frontend에 `< 10` 같은 매직 넘버 하드코딩이 박혀있고 backend Zod는 `.min(1)` 만 적용된 케이스(=defense-in-depth gap, frontend 우회 시 1자도 통과).

**원인 패턴**:
- frontend dialog가 `value.length < 10` 매직 넘버 하드코딩 (VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH 미사용)
- backend Zod가 `min(1)` 만 사용 (frontend가 강제하므로 약하게 둠 — frontend bypass 시 무방비)
- `.trim()` 누락 (whitespace bypass — Step 12와 시너지)
- `.max()` 누락 (DoS — unbounded TEXT 입력)

**검증 명령**:
```bash
# 1. frontend rejectionReason/opinion/comment 하드코딩 < 10 / >= 10 탐지 (VALIDATION_RULES 미사용)
grep -rnE "(rejectionReason|opinion|comment|reason)\.(trim\(\)\.)?length\s*[<>=]+\s*10" \
  apps/frontend/components apps/frontend/app --include="*.tsx" --include="*.ts" \
  2>/dev/null | grep -v "VALIDATION_RULES" | grep -v "\.next" | grep -v "tests/"
# expected: 0 hits — 모든 자유텍스트 length 비교는 VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH 경유

# 2. backend Zod 자유텍스트 필드에 REJECTION_REASON_MIN_LENGTH 미사용 + min(1) 적용 탐지
#    (도메인별 수동 검증 — frontend가 ≥10 강제 중인 도메인이라면 backend도 .min(REJECTION_REASON_MIN_LENGTH) 필요)
grep -rnE "(rejectionReason|opinion):\s*z\.string\(\)" \
  apps/backend/src/modules/*/dto --include="*.dto.ts" \
  | grep "\.min(1[,)]" | grep -v "REJECTION_REASON_MIN_LENGTH"
# expected: Tier 2 후속 sprint 후 0건. 발견 시 frontend ≥10 룰 추가 + backend 격상 페어링 필요

# 3. backend Zod 자유텍스트 필드에 .max() 누락 탐지 (DoS 방어)
grep -rnE "(rejectionReason|reasonDetail|opinion|comment):\s*z\.string\(\)" \
  apps/backend/src/modules/*/dto --include="*.dto.ts" \
  | grep -v "\.max(" | grep -v "//\|email()\|url()\|uuid()"
# expected: 모든 자유텍스트 필드에 .max(LONG_TEXT_MAX_LENGTH) 또는 .max(N) 적용
```

**PASS 기준**:
- 명령 1: 0건 (frontend 하드코딩 zero)
- 명령 2: Tier 2 후속 sprint 진행에 따라 점진적으로 0건. 발견 시 tech-debt-tracker 등록 필수
- 명령 3: 0건 또는 도메인 정책에 따른 의도적 제외 (`// allowed: text 무제한 — 첨부파일 path` 같은 정당화)

**FAIL 기준**:
- frontend `length < 10` / `>= 10` 하드코딩 1건 이상 → `VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH` SSOT 격상 + i18n `{min}` 파라미터화
- backend `.min(1)` 만 적용된 자유텍스트 + frontend가 ≥10 강제 → backend `.trim().min(REJECTION_REASON_MIN_LENGTH).max(LONG_TEXT_MAX_LENGTH)` 격상

```typescript
// ❌ WRONG — frontend 우회 시 1자만 입력 통과 + whitespace + DoS
rejectionReason: z.string().min(1, VM.approval.rejectReason.required)

// ✅ CORRECT — defense-in-depth (Step 12 + Step 15)
rejectionReason: z
  .string()
  .trim()
  .min(VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH, VM.string.min('반려 사유', VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH))
  .max(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH, VM.string.max('반려 사유', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH))
```

```tsx
// ❌ WRONG — VALIDATION_RULES 미사용
disabled={rejectionReason.trim().length < 10}

// ✅ CORRECT — SSOT 경유
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
disabled={rejectionReason.trim().length < VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH}
```

**예외**:
- 단순 placeholder 텍스트의 `(min. 10 characters)` 영문 라벨 — placeholder는 i18n에서 `{min}` 파라미터화 권장, 단 구현 부담 큰 경우 임시 허용
- 파일 업로드 사이즈 / 시간 단위 / 분/초 등 도메인 단위가 길이 검증과 무관한 경우
- 짧은 텍스트(예: 5자, 100자) — REJECTION_REASON_MIN_LENGTH(10) 외의 별도 규칙은 도메인 정의 필요

**관련 사고**:
- `disposal-zod-defense-in-depth` (2026-05-01): disposal `opinion` `min(1)` + frontend `>= 10` → frontend 우회로 1자만 입력 통과 → defense-in-depth 격상으로 closure
- `calibration-plan-rejectionReason-hardcoded-10` (2026-05-01): CalibrationPlanDetailClient 2곳에 `< 10` 하드코딩 + backend `min(1)` → SSOT 격상 + backend 격상으로 closure

### Step 16: ErrorCode SSOT 강제 + service fail-close 비대칭 차단 (2026-05-02 추가)

**탐지 대상**: `code: '[A-Z_]+'` 인라인 string literal 우회 (`packages/schemas/src/errors.ts` ErrorCode enum이 SSOT인데도 인라인 string으로 우회). 시니어 자기검토 갭 6 closure. 추가로 같은 도메인 의미의 service layer fail-close 강도 비대칭(`> 0` vs `>= MIN`) 회귀 차단.

**원인 패턴**:
- 새 도메인 에러 추가 시 ErrorCode enum 등록 누락 → 인라인 string으로 임시 처리 → 영구 답습
- frontend가 backend code 응답을 type-safe하게 매칭 못함 (string literal 오타 silent fail)
- 도메인 service layer fail-close 강도가 시스템 일관성 위반 (예: disposal `≥MIN` vs calibration-plan `> 0`)

**검증 명령**:
```bash
# 1. 격상 완료된 도메인 service 파일 인라인 error code 0건
# 격상 목록 (2026-05-02 기준): disposal / calibration-plan / equipment services
grep -rn "code: '[A-Z_]\+'" \
  apps/backend/src/modules/equipment/services/disposal.service.ts \
  apps/backend/src/modules/equipment/disposal.controller.ts \
  apps/backend/src/modules/calibration-plans/calibration-plans.service.ts \
  apps/backend/src/modules/calibration-plans/calibration-plans.controller.ts \
  apps/backend/src/modules/equipment/equipment.service.ts \
  apps/backend/src/modules/equipment/services/equipment-approval.service.ts \
  apps/backend/src/modules/equipment/services/equipment-attachment.service.ts \
  apps/backend/src/modules/equipment/services/equipment-history.service.ts \
  apps/backend/src/modules/equipment/services/repair-history.service.ts \
  apps/backend/src/modules/equipment/equipment.controller.ts \
  apps/backend/src/modules/equipment/interceptors/form-data-parser.interceptor.ts \
  apps/backend/src/modules/equipment/dto/management-number-param.pipe.ts \
  2>/dev/null | grep -v "//"
# expected: 0 hits — ErrorCode enum 격상 완료 (2026-05-02 equipment-domain-errorcode-closure)

# 2. ErrorCode enum 사용 카운트 (회귀 차단 — 격상 후 줄어들지 않아야)
grep -c "ErrorCode\." apps/backend/src/modules/equipment/services/disposal.service.ts
# expected: ≥ 8 (disposal 도메인 codes)
grep -c "ErrorCode\." apps/backend/src/modules/calibration-plans/calibration-plans.service.ts
# expected: ≥ 14 (calibration-plan 도메인 codes)
grep -c "ErrorCode\." apps/backend/src/modules/equipment/equipment.service.ts
# expected: ≥ 12 (equipment service codes, 2026-05-02 격상)
grep -c "ErrorCode\." apps/backend/src/modules/equipment/services/equipment-approval.service.ts
# expected: ≥ 28 (equipment-approval service codes, 2026-05-02 격상)

# 3. service layer fail-close 비대칭 — rejectionReason/revocationReason length 검증 강도 일관성
grep -rn "rejectionReason\?\?\?\.\?trim()\.\?\?length\|comment\.trim()\.\?length\|revocationReason\?\?\?\.\?trim()\.\?\?length\|dto\.reason\.trim()\.\?length" \
  apps/backend/src/modules --include="*.service.ts" 2>/dev/null \
  | grep -v ".spec.ts" | grep -v "__tests__"
# reject fail-close: REJECTION_REASON_MIN_LENGTH 비교 필수 (`> 0` 패턴 0건)
# revoke fail-close: REVOCATION_REASON_MIN_LENGTH 비교 필수 (revokeApproval, 2026-05-03)

# 3b. revoke-approval.dto.ts fail-close 특이사항 — reason 검증 순서
# scope → FSM(APPROVED 상태) → reason(REVOCATION_REASON_MIN_LENGTH) → time-window → domain 순서 필수
# (FSM 통과 후 reason 검증 — 미승인 상태에서는 reason 검증 불필요, fail-fast 원칙)
grep -n "REVOCATION_REASON_MIN_LENGTH\|RevocationReasonRequired" \
  apps/backend/src/modules/checkouts/checkouts.service.ts 2>/dev/null | head -5
# expected: 1+ 라인 — service fail-close 존재 확인

# 4. 다른 도메인 인라인 error code (점진적 마이그레이션 추적)
grep -rn "code: '[A-Z_]\+'" apps/backend/src/modules --include="*.ts" 2>/dev/null \
  | grep -v ".spec.ts" | grep -v "__tests__" | wc -l
# 2026-05-03 backend-errorcode-full-closure 전멸 완료: 0건.
# 이 수치는 회귀 탐지 metric — 0 유지 필수. 신규 code: 'X' 발견 시 즉시 FAIL.

# 4b. bare `throw new Error()` (HTTP 응답 경로) 회귀 탐지
# 2026-05-06 ssot-recovery-3finding sprint Phase 2B 후 baseline.
# NOTE/sentinel 주석은 throw 직전 라인이라 multi-line awk 패턴 사용 (grep -B1만으로는 부족).
grep -rn -B2 "throw new Error\b" apps/backend/src/modules --include="*.ts" 2>/dev/null \
  | grep -v ".spec.ts\|__tests__" \
  | awk 'BEGIN { RS="--\n"; }
         /\/\/ NOTE: TypeScript exhaustiveness|\/\/ NOTE: module-load|\/\/ local sentinel/ { next }
         /throw new Error/ { print; count++ }
         END { exit count > 0 ? 1 : 0 }'
# expected exit 0 (모든 throw 직전에 NOTE 또는 local sentinel 주석)
# 정당 예외 (코드 직전 라인 NOTE 주석 명시):
#   - notification-events.ts:123 (module-load startup invariant)
#   - calibration-certificate.controller.ts:67 (module-load startup invariant)
#   - equipment-import.types.ts:70/83/122 (TypeScript exhaustiveness check `never`)
#   - excel-parser.service.ts:245 (TypeScript exhaustiveness check `_exhaustive: never`)
#   - audit.service.ts:196 (local sentinel — try-catch fallback, SyntaxError)
#   - calibration.controller.ts:182 (local sentinel — JSON parse fallback, SyntaxError)
# 위 6+ 건 외 신규 발견 시 BadRequestException + ErrorCode SSOT 격상 필수 (FAIL).

# 5. Frontend mapper coverage — backend ErrorCode 추가 시 frontend mapper 누락 차단
# (격상 완료된 도메인: 전 도메인 — backend-errorcode-full-closure 2026-05-03)
# - `lib/errors/<domain>-errors.ts` 파일 존재 확인 + 매퍼 export 강제
test -f apps/frontend/lib/errors/disposal-errors.ts && grep -c "mapDisposalErrorToToast" apps/frontend/lib/errors/disposal-errors.ts
test -f apps/frontend/lib/errors/calibration-plan-errors.ts && grep -c "mapCalibrationPlanErrorToToast" apps/frontend/lib/errors/calibration-plan-errors.ts
test -f apps/frontend/lib/errors/equipment-errors.ts && grep -c "mapBackendErrorCode" apps/frontend/lib/errors/equipment-errors.ts
test -f apps/frontend/lib/errors/non-conformance-errors.ts && grep -c "mapNonConformanceErrorToToast" apps/frontend/lib/errors/non-conformance-errors.ts
test -f apps/frontend/lib/errors/cables-errors.ts && grep -c "mapCableErrorToToast" apps/frontend/lib/errors/cables-errors.ts
test -f apps/frontend/lib/errors/checkout-errors.ts && grep -c "mapCheckoutErrorToToast" apps/frontend/lib/errors/checkout-errors.ts
test -f apps/frontend/lib/errors/notification-errors.ts && grep -c "mapNotificationErrorToToast" apps/frontend/lib/errors/notification-errors.ts
test -f apps/frontend/lib/errors/team-errors.ts && grep -c "mapTeamErrorToToast" apps/frontend/lib/errors/team-errors.ts
test -f apps/frontend/lib/errors/user-errors.ts && grep -c "mapUserErrorToToast" apps/frontend/lib/errors/user-errors.ts
test -f apps/frontend/lib/errors/test-software-errors.ts && grep -c "mapTestSoftwareErrorToToast" apps/frontend/lib/errors/test-software-errors.ts
test -f apps/frontend/lib/errors/software-validation-errors.ts && grep -c "mapSoftwareValidationErrorToToast" apps/frontend/lib/errors/software-validation-errors.ts
test -f apps/frontend/lib/errors/self-inspection-errors.ts && grep -c "mapSelfInspectionErrorToToast" apps/frontend/lib/errors/self-inspection-errors.ts
test -f apps/frontend/lib/errors/intermediate-inspection-errors.ts && grep -c "mapIntermediateInspectionErrorToToast" apps/frontend/lib/errors/intermediate-inspection-errors.ts
test -f apps/frontend/lib/errors/approval-errors.ts && grep -c "mapApprovalErrorToToast" apps/frontend/lib/errors/approval-errors.ts
# expected: 각 1+
# 2026-05-06 ssot-recovery-3finding sprint 추가: approval-errors.ts (ApprovalDelegation*)

# 5b. Dead legacy local ErrorCode enum 탐지 (WARN 등급) — 2026-05-03 추가
# mapper 파일 내 `export enum *ErrorCode` 로컬 선언은 packages/schemas ErrorCode SSOT 우회.
# SoftwareValidationErrorCode + getSoftwareValidationErrorMessageKey() 패턴이 발생 사례.
grep -rn "^export enum.*ErrorCode\b" apps/frontend/lib/errors/ --include="*.ts" 2>/dev/null
# expected: 0건 — 레거시 로컬 enum 발견 시 WARN + tech-debt 등록 권고

# 5c. Mapper I18N_VARS SSOT 파라미터 주입 패턴 (2026-05-03 추가)
# ErrorCode별 i18n 파라미터({min}/{max} 등)를 VALIDATION_RULES.* 경유 주입해야 함
# 하드코딩 숫자 직접 주입 패턴: { min: 10 } → FAIL, { min: VALIDATION_RULES.REVOCATION_REASON_MIN_LENGTH } → PASS
# 참고: CHECKOUT_ERROR_I18N_VARS, NON_CONFORMANCE_ERROR_I18N_VARS 패턴 (checkout/non-conformance-errors.ts)
grep -rn "I18N_VARS\b" apps/frontend/lib/errors/ --include="*.ts" 2>/dev/null \
  | grep -v "VALIDATION_RULES"
# expected: 0건 — I18N_VARS 맵에 VALIDATION_RULES 미경유 숫자 리터럴 발견 시 FAIL

# 6. Mapper 호출처 적용 — onError에서 mapper 사용 강제 (도메인 dialog/client)
grep -c "mapDisposalErrorToToast\|disposal-errors" apps/frontend/components/equipment/disposal/DisposalApprovalDialog.tsx
grep -c "mapCalibrationPlanErrorToToast\|calibration-plan-errors" apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx
# expected: 각 ≥1 — onError에서 한국어 backend 메시지 노출 0

# 7. i18n errors namespace ↔ ErrorCode enum 매핑 정합성 (도메인별)
# disposal-errors.ts mapper의 i18n key가 ko/en disposal.json errors namespace에 모두 존재
# (verify-i18n parity로 자동 보장 — Step 16 보강 / 2026-05-02 equipment-domain-errorcode-closure로 equipment 완전 종결)
# manual: grep "errors\." apps/frontend/lib/errors/disposal-errors.ts | extract keys → check messages/{ko,en}/disposal.json existence

# 8. Mapper Partial Record completeness — ErrorCode가 errorCodeToStatusCode에 등록됐지만
#    어느 도메인 mapper의 Partial<Record<ErrorCode, string>>에도 등재되지 않으면 silent fallback
#    (generic error.message 노출) — sprint tier-2-rejectmodal-ssot iter 2 WARN-H5 closure 후 추가
# 도메인 prefix별 ErrorCode → mapper 등재 검증
# (각 도메인의 ErrorCode prefix와 mapper 파일 매핑 — 점검 대상 sample)
node -e "
const fs = require('fs');
const errorsTs = fs.readFileSync('packages/schemas/src/errors.ts', 'utf-8');
const codes = [...errorsTs.matchAll(/^\\s+(\\w+)\\s*=\\s*'[A-Z_]+'/gm)].map(m => m[1]);
// 긴 prefix 우선 정렬 (CalibrationPlan > Calibration prefix collision 회피)
const mappers = [
  ['IntermediateInspection', 'apps/frontend/lib/errors/intermediate-inspection-errors.ts'],
  ['SoftwareValidation', 'apps/frontend/lib/errors/software-validation-errors.ts'],
  ['CalibrationFactor', 'apps/frontend/lib/errors/calibration-factor-errors.ts'],
  ['CalibrationPlan', 'apps/frontend/lib/errors/calibration-plan-errors.ts'],
  ['EquipmentImport', 'apps/frontend/lib/errors/equipment-import-errors.ts'],
  ['NonConformance', 'apps/frontend/lib/errors/non-conformance-errors.ts'],
  ['SelfInspection', 'apps/frontend/lib/errors/self-inspection-errors.ts'],
  ['TestSoftware', 'apps/frontend/lib/errors/test-software-errors.ts'],
  ['Calibration', 'apps/frontend/lib/errors/calibration-errors.ts'],
  ['Disposal', 'apps/frontend/lib/errors/disposal-errors.ts'],
];
const gaps = [];
for (const code of codes) {
  for (const [prefix, file] of mappers) {
    if (code.startsWith(prefix) && fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf-8');
      // domain reject 흐름 ErrorCode는 mapper에 등재되어야 함
      const isRejectFlow = /Reject|InvalidStatus|InvalidTransition|OnlyPendingCanReject/.test(code);
      if (isRejectFlow && !content.includes('ErrorCode.' + code)) {
        gaps.push({ code, file, prefix });
      }
      break;
    }
  }
}
if (gaps.length > 0) {
  console.error('FAIL: mapper Partial Record completeness gap:');
  gaps.forEach(g => console.error('  ' + g.code + ' missing in ' + g.file));
  process.exit(1);
} else {
  console.log('PASS: all reject-flow ErrorCodes registered in domain mappers');
}
"
# expected: PASS — reject 흐름 ErrorCode (RejectionReasonRequired/InvalidStatusForReject 등)는
# 각 도메인 mapper의 I18N_KEYS Partial Record에 등재되어 generic fallback 회피
```

**PASS 기준**:
- 명령 1 (격상 완료된 도메인): 0 hits
- 명령 2: 격상된 ErrorCode 사용 카운트 회귀 0 (줄어들지 않음)
- 명령 3 (fail-close 비대칭): 0 hits 또는 모든 케이스가 REJECTION_REASON_MIN_LENGTH SSOT 사용
- 명령 4 (시스템 진행률): 0건 = 전멸 달성 (2026-05-03). 증가 시 즉시 FAIL — 회귀 탐지
- 명령 5 (mapper SSOT 존재): 각 도메인 ≥ 1 export
- 명령 5b (dead legacy enum): `export enum *ErrorCode` 0건. ≥1건 발견 시 WARN (FAIL 아님) + tech-debt 등록 권고
- 명령 6 (mapper 호출처 적용): 각 dialog/client ≥ 1 사용 — UX 갭 (한국어 backend 메시지 노출) 0건
- 명령 7 (i18n namespace 정합성): mapper i18n key가 ko/en parity 만족 (verify-i18n과 시너지)
- 명령 8 (mapper Partial Record completeness): reject 흐름 ErrorCode(`*RejectionReasonRequired`/`*InvalidStatusTransition`/`*OnlyPendingCanReject`/`*InvalidTransition`)가 각 도메인 mapper에 등재 — silent fallback (generic `error.message` 노출) 0건 강제. **2026-05-02 tier-2-rejectmodal-ssot iter 2 WARN-H5 closure**: ErrorCode enum + errorCodeToStatusCode 등록만 있고 mapper Partial Record 미등재 시 i18n 메시지 노출 안 됨 → 검증 자동화.

**FAIL 기준**:
- disposal/calibration-plan 도메인에서 인라인 `code: 'X'` 발견 → ErrorCode enum 등록 + ErrorCode.X 사용으로 격상
- service fail-close가 빈 문자열만 체크하고 `>= REJECTION_REASON_MIN_LENGTH` 미적용 → disposal 패턴 따라 강화
- ErrorCode enum 신규 추가 시 `errorCodeToStatusCode` 매핑 누락 → tsc Record 강제로 자동 차단(보조 검증)

```typescript
// ❌ WRONG — 인라인 string, frontend type-safe 매칭 불가
throw new BadRequestException({
  code: 'DISPOSAL_REJECT_COMMENT_REQUIRED',
  message: '...',
});

// ✅ CORRECT — ErrorCode enum SSOT
import { ErrorCode } from '@equipment-management/schemas';
throw new BadRequestException({
  code: ErrorCode.DisposalRejectCommentRequired,
  message: '...',
});
```

```typescript
// ❌ WRONG — 비대칭 fail-close (disposal은 >=10, 본 도메인은 >0)
if (!dto.rejectionReason || dto.rejectionReason.trim() === '') {
  throw new BadRequestException(...);
}

// ✅ CORRECT — 시스템 일관성 (모든 도메인 공통 강도)
const trimmed = dto.rejectionReason?.trim() ?? '';
if (trimmed.length < VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH) {
  throw new BadRequestException({
    code: ErrorCode.XxxRejectionReasonRequired,
    message: `반려 사유는 ${VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH}자 이상 입력해주세요.`,
  });
}
```

**예외**:
- 격상되지 않은 도메인의 인라인 코드 (점진적 마이그레이션 — 명령 4의 카운트로 추적)
- 외부 시스템 응답을 그대로 propagation하는 경우 (예: Azure AD 에러 코드)
- 단순 enum literal 비교가 아닌 dynamic code (예: `error.code as string`) — 별도 정당화 주석

**관련 사고**:
- `disposal-zod-defense-in-depth` (2026-05-01): backend Zod 격상은 했으나 인라인 string literal 그대로 유지
- `disposal-service-fail-close` (2026-05-02): service fail-close 추가했으나 calibration-plan 비대칭 미발견
- `error-codes-ssot-system-wide` (2026-05-02): 시니어 자기검토 갭 5/6/8 closure — 본 Step 16 신설
- `manage-skills audit` (2026-05-02): mapper coverage(명령 5/6/7) 보강 — frontend mapper SSOT 패턴 회귀 차단 + UX 갭(한국어 backend 메시지 노출) 강제

---

### Step 17: `.trim().min(N)` 경계 케이스 spec 대칭성 — reject + accept 양방향 필수 (2026-05-02 추가)

**배경**: `.trim().min(N)` 체인의 순서 정합성을 검증하려면 `trim→reject` 케이스 하나만으론 불충분. `.min()`이 trim 이전에 실행되는 버그는 `trim→reject` spec을 통과시킨다. `trim→accept` 케이스가 `.trim().min(N)` 순서를 동시에 증명한다.

**규칙**: `.trim().min(N)` 또는 `.trim().min(N)` 패턴을 테스트하는 spec은 다음 두 케이스를 **모두** 포함해야 한다.

| 케이스 | 입력 | trim 후 길이 | 기대 |
|--------|------|-------------|------|
| trim→reject | `` ` ${'a'.repeat(N - 1)} ` `` | N-1 (< N) | `success: false` |
| trim→accept | `` ` ${'a'.repeat(N)} ` `` | N (= MIN) | `success: true` |

**탐지 명령**:

```bash
# .trim().min(N) schema를 테스트하는 spec 파일 목록
SPEC_FILES=$(grep -rl "trim()\|\.trim()" \
  apps/backend/src --include="*.spec.ts" \
  apps/frontend --include="*.test.ts" \
  2>/dev/null)

# 각 spec 파일에서 trim→reject만 있고 trim→accept 없는 파일 탐지
for f in $SPEC_FILES; do
  REJECT=$(grep -c "trim.*reject\|rejects.*trim\|trim.*0\b\|trim → 0" "$f" 2>/dev/null || echo 0)
  ACCEPT=$(grep -c "trim.*accept\|accepts.*trim\|trim 후.*MIN자.*accept\|trim.*정확히.*MIN" "$f" 2>/dev/null || echo 0)
  if [ "$REJECT" -gt 0 ] && [ "$ACCEPT" -eq 0 ]; then
    echo "TRIM_ASYMMETRIC: $f — trim→reject 있음, trim→accept 없음"
  fi
done
```

**PASS 기준**: trim 관련 spec 파일마다 `trim→reject` + `trim→accept` 케이스 쌍 존재.

**FAIL 기준**: `trim→reject`만 있고 `trim→accept` 누락 → Evaluator iter 1에서 발견 시 M-FAIL 처리.

**올바른 패턴** (equipment-approval-reject.service.spec.ts, 2026-05-02):

```typescript
it('trims surrounding whitespace before length check — reject', () => {
  // 앞뒤 공백 포함 MIN+1자 → trim 후 MIN-1자 → reject
  const result = schema.safeParse({ rejectionReason: ` ${'a'.repeat(MIN - 1)} ` });
  expect(result.success).toBe(false);
});

it('trims surrounding whitespace before length check — accept (trim 후 정확히 MIN)', () => {
  // 앞뒤 공백 2자 포함 MIN+2자 → trim 후 MIN자 → accept (.trim().min(MIN) 순서 검증)
  const result = schema.safeParse({ rejectionReason: ` ${'a'.repeat(MIN)} ` });
  expect(result.success).toBe(true);
});
```

**관련 사고**:
- `inspection-undo-hook-extraction-reject-spec` (2026-05-02): Evaluator iter 1 M1 FAIL — trim→accept 케이스 누락. iter 2에서 추가 후 PASS.

---

### Step 18: `z.string().uuid()` 직접 사용 금지 — `uuidString()` SSOT 경유 필수 (2026-05-03 추가)

**배경**: Zod v4는 RFC 9562 UUID를 엄격히 검증하므로 시드 UUID(`00000000-0000-0000-0000-000000000001` 등)를 거부한다. 프로젝트 E2E 시드 데이터가 이 형식을 사용하므로 `z.string().uuid()` 직접 사용 시 테스트에서 422 오류가 발생한다. `packages/schemas/src/utils/fields.ts`의 `uuidString()` helper는 8-4-4-4-12 hex regex로 관대하게 검증하여 시드 UUID를 허용한다.

**규칙**: 백엔드 DTO UUID 필드는 `z.string().uuid()` 직접 사용 금지 — `uuidString(msg)` SSOT 경유 필수.

**탐지 명령**:

```bash
# DTO 파일에서 z.string().uuid() 직접 사용 탐지
grep -rn "z\.string()\.uuid(" apps/backend/src/modules --include="*.dto.ts"
# 기대: 0건 (uuidString() SSOT 경유 필수)
```

**PASS 기준**: `z.string().uuid(` 0건.

**FAIL 기준**: 1건 이상 → `uuidString(VM.uuid.invalid('필드명'))` 또는 `uuidString(VM.uuid.generic)`으로 교체.

**올바른 패턴** (`bulk-reject.dto.ts`, 2026-05-03):

```typescript
// ✅ CORRECT — uuidString SSOT (시드 UUID 허용)
import { VM, uuidString } from '@equipment-management/schemas';
ids: z.array(uuidString(VM.uuid.generic)).min(1, '...')

// ❌ WRONG — Zod v4 RFC 9562 strict → seed UUID 거부
ids: z.array(z.string().uuid(VM.uuid.generic)).min(1, '...')
```

**발생 이력**: `zod-trim-max-system-wide-residual` sprint (2026-05-03) — bulk-reject/approve DTO에서 발견. Evaluator grep으로 탐지 후 즉시 수정.

### Step 19: CAS DTO/서비스 검증 — VersionedBaseService + versionedSchema (2026-05-03 verify-cas 흡수)

상태 변경이 수반되는 백엔드 DTO/서비스가 CAS(Optimistic Locking) 패턴을 준수하는지 검증합니다.
2026-05-03 verify-cas 스킬을 verify-zod로 흡수: backend DTO/service 패턴은 본질적으로 Zod 스키마 검증의 연장.

**4가지 핵심 invariant** (모두 backend 도메인):

1. **VersionedBaseService 상속** — 상태 변경 서비스가 VersionedBaseService를 상속
2. **versionedSchema DTO** — 상태 변경 DTO에 `version` 필드 spread (approve/reject/update/close DTO 전수)
3. **updateWithVersion 사용** — `.update()` 대신 `updateWithVersion()` 호출
4. **`onVersionConflict` 훅 + 캐시 무효화** — ConflictException(409) 발생 시 detail 캐시를 단일 지점에서 삭제

**관련 파일**:
- `apps/backend/src/common/base/versioned-base.service.ts` — 베이스 클래스 + `onVersionConflict` 훅
- `apps/backend/src/common/dto/base-versioned.dto.ts` — versionedSchema 정의
- `apps/backend/src/common/cache/cache-invalidation.helper.ts` — 캐시 무효화 헬퍼

**탐지 명령어 요약**:

```bash
# (1) VersionedBaseService 상속 (기대 13개)
grep -rln "extends VersionedBaseService" apps/backend/src/modules --include="*.service.ts" | wc -l

# (2) 상태 변경 DTO 중 versionedSchema 누락 탐지
for f in $(find apps/backend/src/modules/*/dto -name "approve-*.dto.ts" -o -name "reject-*.dto.ts" -o -name "close-*.dto.ts" -o -name "update-status*.dto.ts" -o -name "cancel-*.dto.ts"); do
  grep -L "versionedSchema" "$f" 2>/dev/null
done
# 기대: 0건

# (3) 직접 .update() 호출 탐지 (CAS 적용 서비스)
grep -rn "\.update(" apps/backend/src/modules/checkouts/checkouts.service.ts apps/backend/src/modules/calibration/calibration.service.ts | grep -v "updateWithVersion\|// \|updateAt\|updatedAt\|cacheService"
# 기대: 0건 (CAS 서비스에서 직접 .update() 금지)

# (4) inline ConflictException catch 잔존 (onVersionConflict 훅 우회)
grep -rln "updateWithVersion" apps/backend/src/modules/ | xargs grep -l "instanceof ConflictException"
# 기대: raw tx.update 수동 CAS 경로(import-orphan-scheduler 등)만 남음
```

**상세 체크 + Step 5~11 (트랜잭션, equipment 직접 업데이트, 보상 트랜잭션, 승인 시 version 교체, version 인자 출처)**: [references/cas-checks.md](references/cas-checks.md)

**Frontend CAS 검증** (mutation에서 version 전달, useCasGuardedMutation, 2-step Dialog pre-confirm version 재조회): **verify-frontend-state Step 39·40** 참조 (2026-05-03 verify-cas Step 9·12·13 이전).

**예외**:
- TeamsService, UsersService — 관리자 전용 CRUD, 동시 수정 위험 낮음
- DashboardService, ReportsService — 읽기 전용
- NotificationsService — append-only
- CalibrationPlansService의 casVersion — 의도적 설계 (`updateWithVersion(..., casColumnKey: 'casVersion')`)
- raw `tx.update` 수동 CAS 경로(`equipment-imports.service.onReturnCompleted`, `import-orphan-scheduler.detectAndRecover`) — 인라인 catch 정당

---

### Step 20: Query DTO trim/max + sort enum SSOT 강제 (2026-05-05 추가)

**배경**: Backend Query DTO에서 `z.string().optional()`로 정의된 자유 텍스트 필드(search/manufacturer/destination 등)는 trim/max 미적용 시 두 가지 위험:
1. **DoS 표면**: 50KB+ 페이로드 파싱 (max 부재)
2. **whitespace bypass**: 공백만 입력해도 검증 통과 (trim 부재)

`sort` 필드의 `z.string()` 직접 사용은 추가 위험:
3. **SQL 의도치 않은 정렬 / injection 표면**: service-layer ORDER BY가 unknown field default fallback에 의존, allowlist enum 부재.

본 Step은 `query-dto-validation-ssot` sprint(2026-05-05)에서 도입된 3-layer SSOT 강제:
- **자유 텍스트**: `optionalTrimmedString(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH | LONG_CSV_MAX_LENGTH, '<라벨>')` (`packages/schemas/src/utils/fields.ts`)
- **sort 필드**: per-domain `XxxSortEnum.optional()` (`packages/schemas/src/sort/<domain>-sort.ts`)
- **service ORDER BY**: `XXX_SORT_COLUMN_MAP satisfies Record<XxxSortField, PgColumn>` mapper SSOT (`apps/backend/src/modules/<domain>/utils/<domain>-sort-mapper.ts`)

**규칙**:
- `*-query.dto.ts`의 자유 텍스트 optional → `optionalTrimmedString(VALIDATION_RULES.<상수>, '<라벨>')` 경유 필수
- `sort` 필드 → `z.string()` 금지, per-domain `XxxSortEnum.optional()` 사용
- service ORDER BY → 인라인 `sort.split('.')` switch 금지, `resolveXxxOrderBy(query.sort)` mapper 호출
- mapper는 `as const satisfies Record<XxxSortField, PgColumn>` 패턴으로 컴파일타임 exhaustive 강제

**검증 명령**:

```bash
# 1. Query DTO 자유 텍스트 optional → optionalTrimmedString 미사용 탐지
grep -rn "z\.string()\.optional()" apps/backend/src/modules/*/dto/*-query.dto.ts \
  | grep -v "optionalTrimmedString\|audit-log-query\|report-query"
# 기대: 0건 (자유 텍스트는 모두 SSOT 헬퍼 경유, audit/reports는 별도 도메인)

# 2. sort: z.string() 직접 사용 탐지 (allowlist 부재)
grep -rnE "sort:\s*z\.string\(\)" apps/backend/src/modules/*/dto/*-query.dto.ts \
  packages/schemas/src/equipment.ts
# 기대: 0건

# 3. per-domain sort enum 파일 존재 (≥ 11)
ls packages/schemas/src/sort/*-sort.ts | grep -v _shared | wc -l
# 기대: ≥ 11

# 4. mapper exhaustive satisfies 강제 (≥ 11)
grep -rnE "satisfies Record<\w+SortField, PgColumn>" apps/backend/src/modules/*/utils/*-sort-mapper.ts | wc -l
# 기대: ≥ 11

# 5. optionalTrimmedString SSOT 도입 확인
grep -c "export function optionalTrimmedString" packages/schemas/src/utils/fields.ts
# 기대: ≥ 1

# 6. 인라인 sort.split('.') 잔존 탐지 (mapper 도입 후 0건)
grep -rn "sort\.split('\\.'" apps/backend/src/modules/**/*.service.ts 2>/dev/null
# 기대: 0건
```

**PASS 기준**: 명령 1, 2, 6 = 0건 + 3, 4, 5 = ≥ 임계값.

**FAIL 기준**: 위 임계값 위반 시 즉시 수정.

**올바른 패턴** (`checkout-query.dto.ts`, 2026-05-05):

```typescript
// ✅ CORRECT — SSOT 헬퍼 + sort enum
import { optionalTrimmedString, CheckoutSortEnum } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';

export const checkoutQuerySchema = z.object({
  search: optionalTrimmedString(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH, '검색어'),
  statuses: optionalTrimmedString(VALIDATION_RULES.LONG_CSV_MAX_LENGTH, '반출 상태 목록'),
  sort: CheckoutSortEnum.optional(),
});

// ❌ WRONG — DoS 표면 + sort SSOT 우회
export const checkoutQuerySchema = z.object({
  search: z.string().optional(),  // trim/max 부재
  sort: z.string().optional(),    // allowlist 부재
});
```

**예외**:
- `audit-log-query.dto.ts` — `cursor`, `startDate`, `endDate`는 별도 정책 (날짜 / pagination cursor 형식)
- `report-query.dto.ts` — 보고서 전용 enum (status/period 등) 별도 도메인
- `equipment-imports`의 `sortBy` + `sortOrder` 분리형 (frontend `?sortBy=&sortOrder=` 호환 보존) — 결합형 sort enum과 다름

**관련 sprint**: `query-dto-validation-ssot` (2026-05-05) — 11 Query DTO + equipmentFilterSchema + 11 sort enum + 11 service mapper + 12 spec (185 케이스).

---

### Step 21: CSV 다중값 토큰 검증 SSOT 강제 — optionalCsvEnum / optionalCsvUuid (2026-05-06 추가)

**배경**: `statuses` / `methods` / `roles` / `teams` / `ids` 등 CSV 다중값 query 필드는 `optionalTrimmedString(LONG_CSV_MAX_LENGTH)` 만으로는 토큰 단위 검증이 부재 — service-layer 화이트리스트 위임에 의존. service에서 `STATUS_VALUES.includes(token)` 강제를 잊으면 unknown 토큰 silent 무시(`?statuses=PENDING,UNKNOWN_X` → service에서 PENDING만 적용, UNKNOWN_X는 silent drop). 또 UUID CSV에서 invalid 토큰이 흘러가면 SQL parameter cast error 또는 silent 0 결과.

본 Step은 `query-dto-r2 갭-4 csv-token-enum-validation` sprint(2026-05-06)에서 도입된 Zod-layer fail-close 강제:

- **enum CSV**: `optionalCsvEnum(<ENUM>_VALUES, LONG_CSV_MAX_LENGTH, '<라벨>')` (`packages/schemas/src/utils/fields.ts`) — split + trim + token 단위 화이트리스트 + 422 reject
- **UUID CSV**: `optionalCsvUuid(LONG_CSV_MAX_LENGTH, '<라벨>')` — split + trim + lenient UUID 정규식(8-4-4-4-12 hex) 토큰 단위 검증
- **service 후속**: `query.<field>.split(',')` 인라인 split 금지 — DTO가 이미 array 변환. `query.<field> && query.<field>.length > 0` 가드만 사용

**규칙**:
- `*-query.dto.ts`의 enum 다중값 필드 → `optionalCsvEnum(<ENUM>_VALUES, ..., '<라벨>')` 경유 필수
- `*-query.dto.ts`의 UUID 다중값 필드 (teamId 단일은 optionalUuid) → `optionalCsvUuid(...)` 경유 필수
- service에서 `query.<field>.split(',')` 인라인 split 금지 (DTO에서 array 변환 완료)
- Swagger `@ApiPropertyOptional` 의 type을 `string[]` 또는 `EnumType[]` 로 정정 (입력은 string CSV이지만 transform 후 array 시그니처)

**검증 명령**:

```bash
# 1. SSOT helper 신설 확인
grep -c "export function optionalCsvEnum\|export function optionalCsvUuid" \
  packages/schemas/src/utils/fields.ts
# 기대: 2

# 2. SSOT helper export 확인
grep -c "optionalCsvEnum\|optionalCsvUuid" packages/schemas/src/index.ts
# 기대: ≥ 2

# 3. CSV 다중값 enum 필드 잔존 탐지 — optionalTrimmedString(LONG_CSV) 의 enum 후보
#    (현재 알려진 enum CSV 필드: statuses/methods/roles 도메인 — 모두 optionalCsvEnum 적용)
grep -rE "(statuses|methods|roles):\s*optionalTrimmedString.*LONG_CSV" \
  apps/backend/src/modules/*/dto/*-query.dto.ts 2>/dev/null
# 기대: 0건

# 4. CSV 다중값 UUID 필드 잔존 탐지 (ids/teams 등 UUID 다중값)
grep -rE "(ids|teams):\s*optionalTrimmedString.*LONG_CSV" \
  apps/backend/src/modules/*/dto/*-query.dto.ts 2>/dev/null
# 기대: 0건 (UUID CSV는 모두 optionalCsvUuid 경유)

# 5. service 인라인 split(',') 잔존 탐지 — DTO 변환 완료 후 service 보강 후속
grep -rnE "query\.(statuses|methods|roles|ids|teams)\.split\(','\)" \
  apps/backend/src/modules/ --include="*.service.ts" 2>/dev/null
# 기대: 0건

# 6. SSOT helper 자체 spec 존재
ls packages/schemas/src/__tests__/csv-helpers.test.ts 2>/dev/null
# 기대: 파일 존재
```

**PASS 기준**: 명령 1, 2 = ≥ 임계값 + 3, 4, 5 = 0건 + 6 파일 존재.

**FAIL 기준**: 위 임계값 위반 시 즉시 수정.

**올바른 패턴** (`team-query.dto.ts` 2026-05-06):

```typescript
// ✅ CORRECT — UUID CSV SSOT
import { optionalCsvUuid } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';

export const teamQuerySchema = z.object({
  ids: optionalCsvUuid(VALIDATION_RULES.LONG_CSV_MAX_LENGTH, '팀 ID 목록'),
});

// service: DTO가 이미 string[]로 변환 — split 금지
if (query.ids && query.ids.length > 0) {
  conditions.push(inArray(teamsTable.id, query.ids));
}
```

```typescript
// ✅ CORRECT — enum CSV SSOT
import { optionalCsvEnum, MANAGEMENT_METHOD_VALUES } from '@equipment-management/schemas';

methods: optionalCsvEnum(
  MANAGEMENT_METHOD_VALUES,
  VALIDATION_RULES.LONG_CSV_MAX_LENGTH,
  '교정 방법 목록'
),
```

```typescript
// ❌ WRONG — token 단위 검증 부재 (silent miss + cast error 위험)
ids: optionalTrimmedString(VALIDATION_RULES.LONG_CSV_MAX_LENGTH, '팀 ID 목록'),
// service:
const teamIds = query.ids.split(',');  // ❌ 인라인 split, UUID 형식 검증 부재
```

**예외**:
- `report-query.dto.ts` / `audit-log-query.dto.ts` — 별도 도메인. 자체 enum/cursor 정책으로 처리
- 단일 enum 필드 (statuses CSV가 아닌 단일 status) → `<EnumType>.optional()` 사용

---

#### 21.B Frontend csv normalization SSOT — `toCsvParam` 헬퍼 (2026-05-07 query-r3 추가)

**배경**: Backend `optionalCsvEnum` / `optionalCsvUuid`가 token 단위 검증을 강제하지만, frontend 호출자가 array → csv 변환을 인라인으로 작성(`array.join(',')`)하면 미래 인코딩 진화(URL-encoded csv, comma-escape, JSON array) 시 호출자마다 분기 위험. SSOT 단일 진입점 필요.

본 Sub-step은 `query-r3-closure` sprint(2026-05-07)에서 도입된 frontend 측 회귀 차단:

- **헬퍼**: `apps/frontend/lib/api/query-csv.ts` — `toCsvParam(value: string | readonly string[] | undefined | null): string | undefined`
- **동작**: string은 trim + 빈 문자열 → undefined / array는 토큰 trim + 빈 토큰 제외 + comma join / 빈 결과 → undefined
- **호환 범위**: backend `optionalCsvUuid` / `optionalCsvEnum` 이 받는 모든 csv query 필드

**규칙**:
- `apps/frontend/lib/api/*.ts` 의 인라인 `.join(',')` 금지 — 모두 `toCsvParam` 경유 (`query-csv.ts` 자체 제외)
- csv 필드를 받는 Frontend Query type은 union으로 격상: `field?: string | readonly string[]`
- API 메서드 내부 URL builder에서 `const param = toCsvParam(query.field); if (param !== undefined) params.append(...)`
- 호출자 컴포넌트는 array를 그대로 전달 가능 — manual `.join(',')` 인라인 패턴 금지

**검증 명령**:

```bash
# 1. SSOT helper 신설 확인
grep -c "export function toCsvParam" apps/frontend/lib/api/query-csv.ts
# 기대: 1

# 2. helper unit spec 존재
ls apps/frontend/lib/api/__tests__/query-csv.test.ts 2>/dev/null
# 기대: 파일 존재 (≥ 8 cases)

# 3. lib/api/ 인라인 .join(',') 잔존 탐지 — query-csv.ts 자체 제외
grep -rnE "\.join\(['\"],['\"]\)" apps/frontend/lib/api/ 2>&1 | grep -v "query-csv"
# 기대: 0건

# 4. csv 필드 union type 확인 (구체 도메인)
grep -cE "ids\??:\s*string\s*\|\s*readonly string\[\]" apps/frontend/lib/api/teams-api.ts
# 기대: ≥ 1
grep -cE "statuses\??:\s*string\s*\|\s*readonly string\[\]" apps/frontend/lib/api/checkout-api.ts
# 기대: ≥ 1
grep -cE "methods\??:.*ManagementMethod" apps/frontend/lib/api/calibration-api.ts
# 기대: ≥ 1

# 5. 도메인별 toCsvParam 도입 확인
for f in teams-api.ts checkout-api.ts calibration-api.ts; do
  grep -c "toCsvParam" apps/frontend/lib/api/$f
done
# 기대: 각 ≥ 1
```

**PASS 기준**: 1, 4, 5 = ≥ 임계값 + 2 = 파일 존재 + 3 = 0건.

**FAIL 기준**: 위 임계값 위반 시 즉시 수정 — 단, csv 필드를 새로 노출하지 않는 도메인은 N/A (sort-only 도메인 등).

**올바른 패턴** (`teams-api.ts` 2026-05-07):

```typescript
// ✅ CORRECT — frontend csv normalization SSOT
import { toCsvParam } from './query-csv';

export interface TeamQuery {
  ids?: string | readonly string[];  // ← union 격상
}

getTeams: async (query: TeamQuery = {}) => {
  const { ids, ...rest } = query;
  const idsParam = toCsvParam(ids);
  if (idsParam !== undefined) params.append('ids', idsParam);
  // rest는 일반 처리
}
```

```typescript
// ❌ WRONG — 인라인 join (미래 인코딩 진화 시 호출자마다 분기 위험)
getTeams: async (query: { ids?: string[] }) => {
  if (query.ids?.length) params.append('ids', query.ids.join(','));
}
```

**예외**:
- 신규 csv 필드를 노출하지 않는 frontend api 파일 — N/A
- 단일 string 호출(이미 csv 직렬화된 형태) — toCsvParam이 string을 그대로 통과시키므로 호환

**관련 sprint**:
- `query-dto-r2 갭-4 csv-token-enum-validation` (2026-05-06) — backend `optionalCsvEnum` / `optionalCsvUuid` SSOT 신설 + 18 cases backend unit spec.
- `query-r3-closure` (2026-05-07) — frontend `toCsvParam` SSOT 신설 + 4 호출자 적용(teams.ids / checkout.statuses / calibration.methods / approvals/fetchers.ts) + 11 unit cases. lib/api 인라인 `.join(',')` 0건 결빙.

### Step 22: Backend Zod issues array i18n routing 회귀 차단 (2026-05-08 추가)

**대상**:
- `apps/backend/src/common/pipes/zod-validation.pipe.ts` — Zod fail 응답 shape
- `apps/backend/src/common/filters/error.filter.ts` — ZodError 직접 throw 분기 + HttpException issues passthrough
- `packages/schemas/src/validation/zod-issue.ts` — `BackendValidationIssue` SSOT
- `apps/frontend/lib/errors/zod-issue-mapper.ts` — Frontend i18n routing
- `apps/frontend/lib/errors/extract-error.ts` — Hub wrapper (`extractErrorCodeOrIssues`)
- `apps/frontend/messages/{ko,en}/errors.json` — `validation` + `fields` namespace

**검증 1 — Backend production code 한국어 인라인 회귀 (response path 한정)**

ADR-0008 결정으로 backend 응답 텍스트(`message`)는 frontend 가 무시하지만, 본 sprint 외부에서
새로운 한국어 string literal 이 추가되어 silent leak 발생하면 i18n parity 깨짐 위험. response
path 진입점 2개 파일만 좁혀서 grep:

```bash
# pipe: 'message' 필드 외 한국어 string 0건 (fallback 한국어 1건만 OK)
grep -nE "을\(를\)|입니다|입력해주세요|선택해주세요" apps/backend/src/common/pipes/zod-validation.pipe.ts
# 기대: 'message: ...' 라인만 매칭. 신규 한국어 string literal 발견 시 FAIL.

# filter: response path 한국어 0건 (fallback 한국어 1건만 OK)
grep -nE "을\(를\)|입니다|입력해주세요|선택해주세요" apps/backend/src/common/filters/error.filter.ts
# 기대: 'A server error occurred' 등 영어 fallback. 한국어 string literal 신규 발견 시 FAIL.
```

**중요 — 정당한 위치**:
- `packages/schemas/src/validation/messages.ts` (VM 본문): backend log/audit/swagger
  fallback role. 본 grep 대상 아님.
- `apps/backend/src/common/i18n/messages/ko.json`: backend 자체 i18n catalog. 본 grep 대상 아님.
- audit log 한국어 메시지, dataMigration 도메인 로직 메시지: 별도 layer.

**검증 2 — `errors.validation` ko/en 11 키 set equality**

`pnpm --filter frontend run test -- i18n-errors-validation-parity` PASS 가 매 commit hook 에서
확인. 단순 grep 카운트:

```bash
awk '/"validation": \{/,/^  \}/' apps/frontend/messages/ko/errors.json | grep -cE '^\s+"[a-z_]+":'
# 기대: ≥ 11 (11 ZodIssueCode + title)

awk '/"validation": \{/,/^  \}/' apps/frontend/messages/en/errors.json | grep -cE '^\s+"[a-z_]+":'
# 기대: ≥ 11
```

**검증 3 — 단방향 wire (schemas → frontend i18n 의존 0건)**

`packages/schemas` 가 frontend i18n / next-intl / messages 디렉토리에 의존하면 Layer 위반 +
Mode 2 review-architecture FAIL.

```bash
grep -rE "(next-intl|messages/ko|messages/en|apps/frontend|frontend/lib)" packages/schemas/src/
# 기대: 0 hits (단방향 wire)

grep -E "from '(@equipment-management/schemas|.+/schemas/)" apps/frontend/lib/errors/zod-issue-mapper.ts
# 기대: ≥ 1 (FE → schemas OK)
```

**검증 4 — Hub 통합 (`extractErrorCodeOrIssues` SSOT 진입점 단일)**

`extractErrorCode` / `extractValidationIssues` 신규 인라인 정의 차단:

```bash
grep -rln "export function extractErrorCode\b\|export function extractValidationIssues\b" apps/frontend/lib/errors/
# 기대: extract-error.ts 만 (1개 파일)

grep -rl "extractErrorCodeOrIssues\b\|extractValidationIssues\b" apps/frontend/lib/errors/*-errors.ts | wc -l
# 기대: ≥ 5 (도메인 mapper hub wrapper 통합 진행 중 — Phase 4 closure 후 21곳 목표)
```

**검증 5 — `BackendValidationIssue` Schema 11 코드 enum 결빙**

zod major bump 시 신규 ZodIssueCode 도입을 자동 차단:

```bash
grep -c "'invalid_type'" packages/schemas/src/validation/zod-issue.ts
# 기대: 1 (ZOD_ISSUE_CODES tuple 정의)

# spec 직접 실행으로 11 코드 + 알 수 없는 코드 normalize 검증
pnpm --filter @equipment-management/schemas run test -- zod-issue-3way-equality
# 기대: PASS (4 cases)
```

**FAIL 기준**:
- 검증 1 — 한국어 string literal 추가 (response path 2 파일만)
- 검증 2 — ko/en `errors.validation` 키 11개 미만 또는 set 불일치
- 검증 3 — schemas → FE 의존 도입
- 검증 4 — `extractErrorCode` 신규 인라인 정의 등장 (extract-error.ts 외)
- 검증 5 — ZOD_ISSUE_CODES tuple 길이 변경 + spec FAIL

**관련 sprint**:
- `backend-zod-error-i18n-ssot` (2026-05-08, Mode 2 Full harness) — `BackendValidationIssue` SSOT
  + ZodValidationPipe issues array + GlobalExceptionFilter Zod 통일 + frontend zod-issue-mapper
  hub + i18n `validation`/`fields` namespace ko/en parity + ADR-0008. 신규 spec 94+ cases.

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
