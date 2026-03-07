---
name: verify-zod
description: Zod 검증 패턴 준수 여부를 검증합니다. DTO 추가/수정 후 사용.
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

## When to Run

- 새로운 DTO를 추가한 후
- 기존 DTO의 검증 로직을 수정한 후
- 새로운 모듈을 생성한 후
- ZodValidationPipe 관련 변경 후

## Related Files

| File                                                                | Purpose                                        |
| ------------------------------------------------------------------- | ---------------------------------------------- |
| `apps/backend/src/common/pipes/zod-validation.pipe.ts`              | ZodValidationPipe 구현 (ValidationTarget 포함) |
| `apps/backend/src/common/dto/base-versioned.dto.ts`                 | versionedSchema 베이스 DTO                     |
| `apps/backend/src/modules/equipment/dto/equipment-query.dto.ts`     | Query DTO 참조 구현                            |
| `apps/backend/src/modules/checkouts/dto/approve-checkout.dto.ts`    | Body DTO 참조 구현                             |
| `apps/backend/src/modules/calibration/dto/calibration-query.dto.ts` | Query DTO 참조 구현                            |
| `apps/backend/src/modules/audit/dto/audit-log-query.dto.ts`         | Query DTO 참조 구현 (targets: ['query'] 포함)  |

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

## Output Format

```markdown
| #   | 검사                       | 상태      | 상세             |
| --- | -------------------------- | --------- | ---------------- |
| 1   | class-validator 미사용     | PASS/FAIL | 사용 위치 목록   |
| 2   | ZodValidationPipe 내보내기 | PASS/FAIL | 누락 DTO 목록    |
| 3   | Query DTO targets 설정     | PASS/FAIL | 누락 파일 목록   |
| 4   | DTO 구조 패턴              | PASS/FAIL | 비정상 구조 목록 |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **DTO의 주석 내 class-validator 언급** — 문서화 목적 (e.g., "class-validator 대신 Zod 사용")
2. **index.ts 파일** — 재 export만 하므로 ZodValidationPipe 불필요
3. **base-versioned.dto.ts** — 베이스 스키마 정의용으로 독립 Pipe 불필요
4. **response DTO** — 응답용 타입 정의는 검증이 불필요하므로 Pipe 없어도 됨 (e.g., `*-response.dto.ts`)
5. **dto/index.ts에서의 re-export** — Barrel file은 Pipe 정의 불필요
