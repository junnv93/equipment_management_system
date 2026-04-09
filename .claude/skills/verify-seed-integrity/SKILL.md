---
name: verify-seed-integrity
description: 테스트 시드 인프라의 3자 SSOT 정합성을 검증합니다 — seed-data 파일 ↔ seed-test-new.ts 의 truncate/insert wiring ↔ verification.ts 의 count check 가 한 세트로 움직여야 함. 새 seed 파일 추가 후, verification.ts 편집 후 사용.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 seed 파일명]'
---

# Seed Infrastructure Integrity 검증

## Purpose

E2E / 통합 테스트 시드 인프라의 3자 SSOT 삼각형을 검증합니다:

```
seed-data/**/*.seed.ts           ← 데이터 정의 (single source of data)
        ↓ imported by
seed-test-new.ts                 ← Phase 0 truncate + Phase N insert (orchestration)
        ↓ validated by
verification.ts                  ← 시드 후 DB 상태 불변조건 검증 (SSOT expected count)
```

세 꼭짓점 중 하나라도 누락되면:
- **truncate 누락** → 세션 간 데이터 누적, idempotency 파괴 (e.g. 2026-04-08 notifications 280건 누적 사고)
- **insert 누락** → verification 실패, 실제 테스트 데이터 부재
- **verification 누락** → silent drift (e.g. seed에서 row 개수 변경돼도 검증이 발견 못 함)

추가로 **verification.ts 내 magic number 하드코딩** 금지 — 모든 expected count 는 `SEED_DATA.length` 또는 `.filter().length` 로 도출. 2026-04-08 세션에서 stale threshold 2건 발견 후 SSOT 전환.

> **일반 SSOT 임포트 검증은 `/verify-ssot`, 일반 하드코딩 탐지는 `/verify-hardcoding` 에서 수행합니다.**
> **이 스킬은 시드 인프라 특화 불변조건만 다룹니다.**

## When to Run

- 새 `seed-data/**/*.seed.ts` 파일을 추가한 직후
- `seed-test-new.ts` 의 truncate 리스트 또는 insert phase 를 편집한 직후
- `verification.ts` 의 검증 로직을 추가/수정한 직후
- `SEED_DATA` 배열에 rows 를 추가/삭제한 직후

## Related Files

| File | Role |
|---|---|
| `apps/backend/src/database/seed-data/**/*.seed.ts` | 시드 데이터 배열 (SSOT of rows) |
| `apps/backend/src/database/seed-test-new.ts` | Phase 0 truncate + Phase 1~4 insert orchestration |
| `apps/backend/src/database/utils/verification.ts` | `checkCount` helper + 시드 후 불변조건 검증 |
| `apps/frontend/tests/e2e/global-setup.ts` | 시드 실행 + fail-fast (verify-e2e Step 13 참조) |

## Workflow

### Step 1: seed-data orphan 탐지 — seed-test-new.ts import 누락

모든 `*.seed.ts` export 는 반드시 `seed-test-new.ts` 에 import 되어야 한다 (dead seed 방지).

**탐지:**
```bash
find apps/backend/src/database/seed-data -name '*.seed.ts' -type f \
  | xargs -I{} basename {} .ts \
  | while read seedFile; do
      if ! grep -q "from.*seed-data.*${seedFile}" apps/backend/src/database/seed-test-new.ts; then
        echo "❌ orphan seed file (not imported): ${seedFile}"
      fi
    done
```

**PASS:** 0 orphans. **FAIL:** orphan seed 파일 → `seed-test-new.ts` 에 import + insert phase 에 등록.

### Step 2: seed-data 테이블 ↔ Phase 0 truncate 리스트 정합

`seed-test-new.ts` 가 `db.insert(schema.X)` 하는 모든 테이블 `X` 는 Phase 0 truncate 리스트(`const tables = [...]`)에도 포함되어야 한다 (idempotency invariant).

**탐지:**
```bash
# insert 되는 테이블명 추출 (schema.camelCase → snake_case)
grep -oE "db\.insert\(schema\.\w+\)" apps/backend/src/database/seed-test-new.ts \
  | sed 's/db.insert(schema\.//; s/)//' \
  | sort -u
# ↑ 이 목록과 Phase 0 `const tables = [...]` 배열 (snake_case) 가 subset 관계여야 함
```

**PASS:** 모든 insert 대상이 truncate 리스트에 등재됨. **FAIL:** 미등재 테이블 → truncate 리스트에 추가.

**주의**: camelCase ↔ snake_case 변환 수동 확인 필요 (예: `equipmentRequests` → `equipment_requests`).

### Step 3: verification.ts magic number 탐지

`verification.ts` 의 `checks.push` 블록에서 `passed:` 표현식에 하드코딩된 숫자 리터럴이 나타나면 안 된다. 모든 expected 는 `SEED_DATA.length` 또는 `.filter().length` 도출.

**탐지:**
```bash
grep -nE "passed:\s*\w+\s*(>=|===|==)\s*[0-9]+" \
  apps/backend/src/database/utils/verification.ts
# 또는 checkCount 호출 인자의 4번째 파라미터가 숫자 리터럴인 경우
grep -nE "checkCount\([^)]+,\s*[0-9]+" \
  apps/backend/src/database/utils/verification.ts
```

**PASS:** 0 results (`Equipment status: X` 등 도메인 invariant `>= 1` 체크는 예외 — Exception 1 참조).
**FAIL:** magic number → `SEED_DATA.length` 또는 `.filter().length` 로 교체.

### Step 4: checkCount helper default === 검증

`checkCount` helper 가 default 로 `===` 를 사용해야 한다. `>=` 는 `{ minOnly: true }` 옵션으로만 opt-in 되어야 함.

**탐지:**
```bash
grep -nA3 "function checkCount" apps/backend/src/database/utils/verification.ts \
  | grep -E "actual (>=|===) expected"
```

**PASS:** `actual === expected` 가 default 경로, `actual >= expected` 는 `options.minOnly` 분기에만 존재.
**FAIL:** default 가 `>=` 이면 silent drift 위험 — `===` 로 교체.

### Step 5: verification 커버리지 — insert 대상 테이블 ↔ checkCount 호출

`seed-test-new.ts` 가 insert 하는 **모든 테이블** 은 `verification.ts` 에 대응하는 `checkCount` 호출이 있어야 한다 (커버리지 invariant).

**탐지:**
```bash
# Step 2 결과(insert 테이블 목록) 와 verification.ts 의 checkCount table arg 비교
grep -oE "checkCount\([^,]+,\s*'[^']+',\s*'[a-z_]+'" \
  apps/backend/src/database/utils/verification.ts \
  | grep -oE "'[a-z_]+'$" | tr -d "'" | sort -u
```

**PASS:** insert 테이블 ⊆ verification 테이블. **FAIL:** 누락 테이블 → `checkCount` 추가.

### Step 6: Phase 0 truncate 순서 — FK 의존성 역순

Phase 0 truncate 는 FK 의존성 역순 (child → parent) 으로 나열되어야 TRUNCATE CASCADE 에러/락 경합을 최소화한다. `users`/`teams` 는 반드시 맨 뒤.

**PASS:** `users`, `teams` 가 배열 끝 2개 요소. **WARN:** 중간에 있으면 실제로 작동은 하지만 리뷰 대상.

### Step 7: form_templates 보존 (부팅 전용 시드 불변조건)

`form_templates` 는 `main.ts:158 seedFromFilesystem` 이 백엔드 부팅 시에만 `docs/procedure/template/` 에서 시드하는 "부팅 전용" 리소스이다. 재시드 경로가 없으므로 seed-test-new 실행 중 한 번이라도 비워지면 모든 export 테스트가 `FORM_TEMPLATE_NOT_FOUND` 로 일괄 실패한다.

두 가지 경로 모두 검증:

1. **직접 truncate 금지** — `form_templates` 가 Phase 0 `tables` 배열에 등장하면 FAIL.
   ```bash
   grep -n "'form_templates'" apps/backend/src/database/seed-test-new.ts
   # → Phase 0 tables 배열 내 등장 시 FAIL
   ```

2. **간접 CASCADE 보존** — `form_templates.uploaded_by → users.id` FK 로 인해 `TRUNCATE users CASCADE` 가 form_templates 를 함께 비운다. 따라서 snapshot/restore 패턴이 필수:
   ```bash
   grep -n "formTemplatesSnapshot\|formTemplates" apps/backend/src/database/seed-test-new.ts
   # → snapshot select + restore insert (uploadedBy: null) 두 블록 모두 존재해야 PASS
   ```
   두 블록 중 하나라도 누락되면 FAIL.

**대체 해결책**: FK 를 `ON DELETE SET NULL` 로 마이그레이션하면 snapshot/restore 가 불필요해진다. 마이그레이션 후에는 본 Step 의 2번 조건을 "snapshot/restore 부재 + FK `.onDelete('set null')` 존재" 로 재조정.

## Output Format

```markdown
| # | 검사                                | 상태      | 상세                              |
|---|-------------------------------------|-----------|-----------------------------------|
| 1 | seed-data orphan 탐지               | PASS/FAIL | import 누락 파일 목록             |
| 2 | truncate ↔ insert 테이블 정합       | PASS/FAIL | 미등재 테이블                     |
| 3 | verification.ts magic number        | PASS/FAIL | 하드코딩 위치 (file:line)         |
| 4 | checkCount default ===              | PASS/FAIL | default 분기 비교 연산자          |
| 5 | verification checkCount 커버리지    | PASS/FAIL | 누락 테이블                       |
| 6 | Phase 0 truncate FK 역순            | PASS/WARN | users/teams 위치                  |
| 7 | form_templates 보존 (부팅 전용)     | PASS/FAIL | 직접 truncate + snapshot/restore  |
```

## Exceptions

1. **`Equipment status: X` 같은 값별 최소 1건 체크** — `count >= 1` 은 magic number 가 아닌 **도메인 invariant** (각 enum 값이 최소 1건 존재해야 한다). `filterableStatuses` 루프 내 체크는 Step 3 면제.
2. **`checkCount` helper 내부의 `actual >= expected`** — `options.minOnly === true` 분기에 한해 정상 (명시적 opt-in).
3. **복합 테이블 insert** — `equipment` 테이블에 `EQUIPMENT_SEED_DATA` + `DISPOSAL_EQUIPMENT_SEED_DATA` 를 합산 insert 하는 경우, verification 의 expected 는 두 length 합으로 계산 (이미 적용됨).
4. **audit_logs 등 trigger 기반 자연 증가 테이블** — DB trigger 로 seed-time 추가 row 가 생길 수 있는 테이블은 `{ minOnly: true }` 플래그 opt-in 허용. 단 주석으로 이유 명시 필수.
5. **중간 테이블(join table) 없는 M:N link** — link 테이블이 schema 에 존재하지만 별도 seed 가 없는 경우 (FK 파생) Step 5 면제.
6. **테스트 픽스처성 seed** — 단 1개 테스트에서만 사용되는 일회성 seed 는 전역 seed-test-new.ts 에 등재하지 말고 spec 내부 `test.beforeAll` 로 처리.
