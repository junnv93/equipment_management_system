# Evaluation: zod-i18n-mapper-hub-closure

---

## Iteration: 3

**평가 일시**: 2026-05-08
**평가 결과**: **PASS** (MUST 21/21 전부 PASS)

---

## MUST Criteria Results

| # | Criterion | Result | Evidence |
|---|-----------|--------|---------|
| M-1 | tsc 에러 0 | PASS | `pnpm tsc --noEmit 2>&1 \| grep -c "error TS"` → `0` |
| M-2 | frontend lint PASS | PASS | `pnpm --filter frontend run lint` → exit 0 (빈 출력) |
| M-3 | 12개 파일 extractValidationIssues | PASS | 12개 파일 모두 grep-l 매칭, FAIL 줄 0개 |
| M-4 | 12개 파일 mapZodIssuesToToast | PASS | 12개 파일 모두 grep-l 매칭, FAIL 줄 0개 |
| M-5 | SSOT 단일 정의 | PASS | `grep -rln "export function extractValidationIssues" apps/frontend/lib/errors/` → `extract-error.ts` 1개만 |
| M-6 | 자연 제외 3건 hub 호출 부재 | PASS | `cable-errors.ts / document-errors.ts / equipment-errors.ts` 매칭 없음 → 빈 출력 |
| M-7 | spec 파일 존재 | PASS | `ls apps/frontend/lib/errors/__tests__/zod-fallback-coverage.test.ts` → 파일 존재 |
| M-8 | ts-morph devDep 등록 | PASS | `node -e "...['ts-morph']..."` → exit 0 |
| M-9 | spec PASS (18 cases) | PASS | `pnpm --filter frontend run test -- "zod-fallback-coverage"` → `PASS`, `Tests: 18 passed, 18 total` |
| M-10 | EXCLUSIONS set 5건 이상 | PASS | `grep -cE "cable-errors\|document-errors\|..."` → `10` ≥ 5 |
| M-11 | MetricsService Counter + method | PASS | `zod_validation_issues_total` count in metrics.service.ts → `1` ≥ 1; `observeZodIssueCount` in metrics.service.ts → `1` ≥ 1; `grep -rc "observeZodIssueCount" apps/backend/src/common/` → `metrics.service.ts:1` + `error.filter.ts:1` + `error-filter-zod.spec.ts:6` 출력 |
| M-12 | Counter labels 2종 | PASS | `grep -E "domain_route\|issue_count_bucket" ... \| wc -l` → `2` ≥ 2 |
| M-13 | bucket 4-tier ≥ 4 occurrences | PASS | `grep -oE "'1'\|'2-5'\|'6-10'\|'11\+'" ... \| wc -l` → `8` ≥ 4 |
| M-14 | filter에서 observeZodIssueCount 호출 | PASS | `grep -c "observeZodIssueCount" apps/backend/src/common/filters/error.filter.ts` → `1` ≥ 1 |
| M-15 | @Optional 데코레이터 | PASS | `grep -B 1 "MetricsService" error.filter.ts \| grep -c "@Optional"` → `1` ≥ 1 |
| M-16 | backend spec PASS | PASS | `pnpm --filter backend run test -- "error-filter-zod"` → `PASS`, `Tests: 7 passed, 7 total`; `observeZodIssueCount` in spec → `6` ≥ 1 |
| M-17 | backend 전체 테스트 회귀 0 | PASS | `pnpm --filter backend run test` → `Test Suites: 130 passed, 130 total`, `Tests: 1630 passed, 1630 total` |
| M-18 | Layer 보존 (본 sprint 신규 modules import 0건) | PASS | `grep -E "from '\.\.\/.*modules\/" ... \| grep -v "audit/audit.service" \| wc -l` → `0` (기대: 0); `grep -c "from '../metrics/metrics.service'" error.filter.ts` → `1` ≥ 1 (common-internal OK). pre-existing AuditService import 제외 후 본 sprint 신규 modules 의존 0건 확인 |
| M-19 | Step 22 임계값 ≥ 17 | PASS | `grep -cE "≥ 17\|>= 17" .claude/skills/verify-zod/SKILL.md` → `1` ≥ 1 |
| M-20 | Step 23 신설 | PASS | `grep -c "^### Step 23" .claude/skills/verify-zod/SKILL.md` → `1` |
| M-21 | ADR-0008 closure note | PASS | `grep -c "zod_validation_issues_total" docs/adr/0008-backend-zod-error-i18n.md` → `1` ≥ 1 |

---

## SHOULD Criteria Notes

**S-1** (form-template / user 변형 패턴 주석): PASS
- `form-template-errors.ts`: `// ADR-0008: ErrorCode 미매핑 시 Zod validation issues fallback (변형 패턴: 단일 return 구조)` 주석 확인.
- `user-errors.ts`: `// ADR-0008: ErrorCode 미매핑 시 Zod validation issues fallback (변형 패턴: mapBackendErrorCode 헬퍼 경유)` 주석 확인.

**S-2** (Counter 카디널리티 < 200): PASS
- `labelNames: ['domain_route', 'issue_count_bucket']`. bucket 4개 × ~50 라우트 = 200 이하 예상.

**S-3** (EXCLUSIONS 5건 사유 주석): PASS
- `cable-errors.ts // re-export shim only`, `document-errors.ts // download path — mapDocumentFileErrorToToast has no t function`, `equipment-errors.ts // enum/class infra — no mapXxxErrorToToast function`, `extract-error.ts // hub itself`, `zod-issue-mapper.ts // hub itself` — 5건 사유 주석 전부 확인.

**S-4** (후속 tech-debt 3건 등록): PARTIAL
- `.claude/exec-plans/tech-debt-tracker.md` §2026-05-08 zod-i18n 후속 섹션에 3건 등록됨: `domain-mapper-hub-integration-systematic` (MEDIUM) + `domain-mapper-zod-fallback-eslint-rule` (LOW) + `backend-payload-size-telemetry` (LOW).
- 그러나 계약 S-4에서 요구하는 정확한 레이블 `alert rule` / `ESLint 마이그레이션` / `e2e toast` 와 tracker 항목 간 1:1 대응 없음. sprint plan(`.claude/exec-plans/active/2026-05-08-zod-i18n-mapper-hub-closure.md`) 후속 tech-debt 섹션에는 `alert rule` / `ESLint custom rule 마이그레이션` / `e2e Zod fail → toast e2e` 3건이 기재되어 있으나 tracker에는 미반영 상태.
- SHOULD 기준 — tech-debt 노트로 처리 (이전 iter 동일).

---

## Overall Verdict: PASS

**MUST**: 21/21 전부 PASS
**SHOULD**: S-1 PASS / S-2 PASS / S-3 PASS / S-4 PARTIAL

### iter 3 변경 사항

M-18 계약이 `grep -v "audit/audit.service"` 제외 필터를 포함하도록 rev-3 정정됨. 실행 결과 `0` (기대: 0) → PASS. 나머지 20개 기준은 iter 2와 동일 PASS 상태 유지.

### S-4 tech-debt 후속 액션

sprint plan 후속 3건(`alert rule` / `ESLint custom rule 마이그레이션` / `e2e Zod fail → toast e2e`)을 `.claude/exec-plans/tech-debt-tracker.md` §zod-i18n-mapper-hub-closure 섹션에 등록 권고.

---

## Iteration: 2

**평가 일시**: 2026-05-08
**평가 결과**: **FAIL** (M-18 실패 1건)

---

## MUST Criteria Results

| # | Criterion | Result | Evidence |
|---|-----------|--------|---------|
| M-1 | tsc 에러 0 | PASS | `grep -c "error TS"` → `0` |
| M-2 | frontend lint PASS | PASS | `pnpm --filter frontend run lint` → exit 0 (빈 출력) |
| M-3 | 12개 파일 extractValidationIssues | PASS | 12개 파일 모두 grep-l 매칭, FAIL 줄 0개 |
| M-4 | 12개 파일 mapZodIssuesToToast | PASS | 12개 파일 모두 grep-l 매칭, FAIL 줄 0개 |
| M-5 | SSOT 단일 정의 | PASS | `grep -rln "export function extractValidationIssues"` → `extract-error.ts` 1개만 |
| M-6 | 자연 제외 3건 hub 호출 부재 | PASS | `cable-errors.ts / document-errors.ts / equipment-errors.ts` 매칭 없음 → `PASS` 출력 |
| M-7 | spec 파일 존재 | PASS | `ls apps/frontend/lib/errors/__tests__/zod-fallback-coverage.test.ts` → 파일 존재 |
| M-8 | ts-morph devDep 등록 | PASS | `node -e "...['ts-morph']..."` → exit 0 → `PASS` |
| M-9 | spec PASS (18 cases) | PASS | `pnpm --filter frontend run test -- "zod-fallback-coverage"` → `PASS`, `Tests: 18 passed, 18 total` |
| M-10 | EXCLUSIONS set 5건 이상 | PASS | `grep -cE "cable-errors\|document-errors\|..."` → `10` ≥ 5 |
| M-11 | MetricsService Counter + method | PASS | `zod_validation_issues_total` → `1` ≥ 1; `observeZodIssueCount` in metrics.service.ts → `1` ≥ 1; 복합: `error.filter.ts:1` + `metrics.service.ts:1` 모두 출력 |
| M-12 | Counter labels 2종 | PASS | `grep -E "domain_route\|issue_count_bucket" ... \| wc -l` → `2` ≥ 2 |
| M-13 | bucket 4-tier ≥ 4 occurrences | PASS | `grep -oE "'1'\|'2-5'\|'6-10'\|'11\+'" ... \| wc -l` → `8` ≥ 4 (계약 rev-2: `-o` flag 사용, Prettier 멀티라인 안전) |
| M-14 | filter에서 observeZodIssueCount 호출 | PASS | `grep -c "observeZodIssueCount" apps/backend/src/common/filters/error.filter.ts` → `1` ≥ 1 |
| M-15 | @Optional 데코레이터 | PASS | `grep -B 1 "MetricsService" error.filter.ts \| grep -c "@Optional"` → `1` ≥ 1 |
| M-16 | backend spec PASS | PASS | `pnpm --filter backend run test -- "error-filter-zod"` → `PASS`, `Tests: 7 passed, 7 total`; `observeZodIssueCount` count → `6` ≥ 1 |
| M-17 | backend 전체 테스트 회귀 0 | PASS | `pnpm --filter backend run test` → `Tests: 1630 passed, 1630 total` |
| **M-18** | **Layer 보존 (common → modules import 0건)** | **FAIL** | `grep -E "from '\.\.\/.*modules\/" apps/backend/src/common/filters/error.filter.ts \| wc -l` → **`1`** (기대: `0`). 실제 import: `import { AuditService } from '../../modules/audit/audit.service';` (line 25). common-internal import 확인: `grep -c "from '../metrics/metrics.service'"` → `1` ≥ 1 (OK). |
| M-19 | Step 22 임계값 ≥ 17 | PASS | `grep -cE "≥ 17\|>= 17" .claude/skills/verify-zod/SKILL.md` → `1` ≥ 1 |
| M-20 | Step 23 신설 | PASS | `grep -c "^### Step 23" .claude/skills/verify-zod/SKILL.md` → `1` |
| M-21 | ADR-0008 closure note | PASS | `grep -c "zod_validation_issues_total" docs/adr/0008-backend-zod-error-i18n.md` → `1` ≥ 1 |

---

## SHOULD Criteria Notes

**S-1** (form-template / user 변형 패턴 주석): PASS
- `form-template-errors.ts`: `extractValidationIssues` + `mapZodIssuesToToast` 정상 통합. 파일 내 `FORM_TEMPLATE_FALLBACK_I18N_KEY = 'uploadDialog.error'` 변형 패턴 명시.
- `user-errors.ts`: `extractValidationIssues` + `mapZodIssuesToToast` 정상 통합. 파일 내 `USER_ERROR_FALLBACK_I18N_KEY = 'errors.unknown'` 변형 패턴 명시.

**S-2** (Counter 카디널리티 < 200): PASS
- `labelNames: ['domain_route', 'issue_count_bucket']`. bucket 4개 × ~50 라우트 = 200 이하 예상.

**S-3** (EXCLUSIONS 5건 사유 주석): PASS
- `cable-errors.ts // re-export shim only`, `document-errors.ts // download path`, `equipment-errors.ts // enum/class infra`, `extract-error.ts // hub itself`, `zod-issue-mapper.ts // hub itself` — 전 5건 사유 주석 확인.

**S-4** (후속 tech-debt 3건 등록): PARTIAL
- `docs/tech-debt-tracker.md` 파일 미존재. `.claude/exec-plans/tech-debt-tracker.md` §2026-05-08에 3건 등록된 것으로 iter 1 평가에서 확인. `alert rule` / `ESLint 마이그레이션` / `e2e toast` 레이블과 정확한 1:1 대응 항목 부재 — SHOULD 이므로 tech-debt 노트 등록으로 처리.

---

## Overall Verdict: FAIL

### 실패 상세: M-18

**계약 기대**: `grep -E "from '\.\.\/.*modules\/" apps/backend/src/common/filters/error.filter.ts | wc -l` = `0`

**실제 결과**: `1`

**원인 분석**:
- `apps/backend/src/common/filters/error.filter.ts` line 25에 `import { AuditService } from '../../modules/audit/audit.service';` 존재.
- 이 import는 commit `c8faf22f feat(security): guard-level 403 audit log gap — APP_FILTER DI + SSOT` (본 sprint `a92d5bcb` 이전 커밋)에서 도입된 **기존 Layer 위반**으로, 본 sprint에서 신규 도입한 것이 아님.
- iter 1 평가에서 동일 명령어 결과를 `0`으로 기록했으나 이는 평가 오류 — 해당 import는 iter 1 시점에도 이미 존재했음.
- 계약이 "기대: 0"으로 명시되어 있으므로 현재 상태는 기술적으로 FAIL.

**배경 컨텍스트**:
- 본 sprint 변경 범위 (`apps/backend/src/common/metrics/metrics.service.ts` + `apps/backend/src/common/filters/error.filter.ts`)에서 신규 modules Layer 위반은 0건.
- AuditService import는 pre-existing violation으로 이 sprint의 Layer 정책 준수에는 문제가 없음.
- 그러나 계약이 "0"을 기대하며 실제 값은 "1"이므로 엄격 기준에 따라 FAIL 판정.

---

## Repair Instructions

### Option A (권고): 계약 M-18 기대값 정정 (rev-3)

AuditService import는 본 sprint 이전부터 존재하는 기존 Layer 위반이며, 계약의 Layer 보존 의도는 "본 sprint에서 신규 modules 의존 도입 금지"임. 계약을 아래와 같이 정정:

```bash
# 기존 (count-based, 기존 위반 포함)
grep -E "from '\.\.\/.*modules\/" apps/backend/src/common/filters/error.filter.ts | wc -l
# 기대: 0  ← 이미 1 존재로 FAIL

# 수정 (sprint-specific: 본 sprint 신규 도입 metrics 관련 modules import 부재 확인)
grep -E "from '\.\.\/.*modules\/" apps/backend/src/common/filters/error.filter.ts | grep -v "audit/audit.service"
# 기대: 빈 출력 (metrics.service는 common-internal, audit은 pre-existing)
```

또는 기대값을 `1` (pre-existing AuditService)로 업데이트:
```
# 기대: ≤ 1 (AuditService pre-existing 1건 허용)
```

### Option B: AuditService import를 common 레이어로 이동

`AuditService`를 common 계층 인터페이스 + 토큰으로 추상화하여 modules 직접 import 제거. 단, 이는 본 sprint 범위 외 변경이므로 별도 sprint 처리 권고.

---

**참고**: M-18을 제외한 M-1~M-17, M-19~M-21 (총 20개 기준) 전부 PASS. 본 sprint 구현 품질은 양호하며 실패는 계약 기대값과 pre-existing 상태 불일치로 인한 것임.
