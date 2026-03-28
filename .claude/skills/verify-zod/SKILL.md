---
name: verify-zod
description: Verifies Zod validation pattern compliance — ZodValidationPipe usage (no class-validator), versionedSchema inclusion in state-change DTOs, controller pipe application, query DTO consistency. Run after adding/modifying DTOs or controller endpoints.
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
