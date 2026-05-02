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

### Step 15: Frontend `< N` 하드코딩 ↔ Backend Zod `.min(N)` SSOT 동기화 강제 (REJECTION_REASON_MIN_LENGTH 동기화, VALIDATION_RULES 동기화) (2026-05-01 추가)

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
  2>/dev/null | grep -v "//"
# expected: 0 hits — ErrorCode enum 격상 완료
# 미격상: equipment.controller.ts / interceptors / dto (10건 — 다음 스프린트 대상)

# 2. ErrorCode enum 사용 카운트 (회귀 차단 — 격상 후 줄어들지 않아야)
grep -c "ErrorCode\." apps/backend/src/modules/equipment/services/disposal.service.ts
# expected: ≥ 8 (disposal 도메인 codes)
grep -c "ErrorCode\." apps/backend/src/modules/calibration-plans/calibration-plans.service.ts
# expected: ≥ 14 (calibration-plan 도메인 codes)
grep -c "ErrorCode\." apps/backend/src/modules/equipment/equipment.service.ts
# expected: ≥ 12 (equipment service codes, 2026-05-02 격상)
grep -c "ErrorCode\." apps/backend/src/modules/equipment/services/equipment-approval.service.ts
# expected: ≥ 28 (equipment-approval service codes, 2026-05-02 격상)

# 3. service layer fail-close 비대칭 — rejectionReason length 검증 강도 일관성
grep -rn "rejectionReason\?\?\?\.\?trim()\.\?\?length\|comment\.trim()\.\?length" \
  apps/backend/src/modules --include="*.service.ts" 2>/dev/null \
  | grep -v ".spec.ts" | grep -v "__tests__"
# 모든 reject service fail-close가 REJECTION_REASON_MIN_LENGTH 비교를 사용해야 함 (`> 0` 패턴 0건)

# 4. 다른 도메인 인라인 error code (점진적 마이그레이션 추적)
grep -rn "code: '[A-Z_]\+'" apps/backend/src/modules --include="*.ts" 2>/dev/null \
  | grep -v ".spec.ts" | grep -v "__tests__" | wc -l
# 2026-05-02 equipment services 격상 후 baseline: ~203 hits (equipment services -51건).
# 이 수치는 시스템 마이그레이션 진행률 추적 metric — 점진적으로 0에 수렴해야 함.

# 5. Frontend mapper coverage — backend ErrorCode 추가 시 frontend mapper 누락 차단
# (격상 완료된 도메인: disposal + calibration-plan + equipment)
# - `lib/errors/<domain>-errors.ts` 파일 존재 확인 + 매퍼 export 강제
test -f apps/frontend/lib/errors/disposal-errors.ts && grep -c "mapDisposalErrorToToast" apps/frontend/lib/errors/disposal-errors.ts
test -f apps/frontend/lib/errors/calibration-plan-errors.ts && grep -c "mapCalibrationPlanErrorToToast" apps/frontend/lib/errors/calibration-plan-errors.ts
test -f apps/frontend/lib/errors/equipment-errors.ts && grep -c "mapBackendErrorCode" apps/frontend/lib/errors/equipment-errors.ts
# expected: 각 1+

# 6. Mapper 호출처 적용 — onError에서 mapper 사용 강제 (도메인 dialog/client)
grep -c "mapDisposalErrorToToast\|disposal-errors" apps/frontend/components/equipment/disposal/DisposalApprovalDialog.tsx
grep -c "mapCalibrationPlanErrorToToast\|calibration-plan-errors" apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx
# expected: 각 ≥1 — onError에서 한국어 backend 메시지 노출 0

# 7. i18n errors namespace ↔ ErrorCode enum 매핑 정합성 (도메인별)
# disposal-errors.ts mapper의 i18n key가 ko/en disposal.json errors namespace에 모두 존재
# (verify-i18n parity로 자동 보장 — Step 16 보강)
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
- 명령 4 (시스템 진행률): 본 sprint 후 baseline 기록, 후속 sprint마다 감소 추세 확인
- 명령 5 (mapper SSOT 존재): 각 도메인 ≥ 1 export
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
