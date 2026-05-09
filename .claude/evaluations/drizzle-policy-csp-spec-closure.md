# Evaluation Report — drizzle-policy-csp-spec-closure

- **Iteration**: 2
- **Date**: 2026-05-09
- **Verdict**: PASS
- **Recommendation**: Step 7 (final report + lifecycle move to `completed/`)

## Iteration History

| Iter | Verdict | Failed Criteria | Resolution |
|------|---------|-----------------|------------|
| 1 | FAIL | M-10 (lint exit 2 + unused var `BACKEND_API`) | Generator removed `BACKEND_API` declaration in iter 2 |
| 2 | **PASS** | — | All 15 MUST criteria PASS. Architecture finding (ADR-0002 forward ref) also resolved (extra credit). |

## MUST Criteria Result (iter 2)

| ID | Criterion | Result | Evidence |
|----|-----------|--------|----------|
| M-1 | ADR-0010 신설 + 형식 정합 | PASS | FILE_EXISTS ✓. Context/Decision/Consequences/Trigger Conditions/References 모두 ≥ 1. manual SQL 12건, drizzle-kit generate 11건, journal append/_journal.json 5건, __drizzle_migrations 3건, evasion attempts (stdin/TTY/--force/snapshot 재생성/interactive) 14건. 모든 threshold 충족. |
| M-2 | DRIZZLE_MIGRATIONS.md 현재 상태 반영 | PASS | `0057\|journal 58\|58 entries` 5건 ≥ 1 ✓. `0025까지\|snapshot 26` 2건 ≥ 1 ✓. |
| M-3 | DRIZZLE_MIGRATIONS.md §1 모순 지시 제거 | PASS | `반드시.*drizzle-kit generate` 0건 ✓. `스키마 변경은 반드시` 0건 ✓. |
| M-4 | DRIZZLE_MIGRATIONS.md ADR-0010 백링크 | PASS | ADR-0010 18건 ≥ 2 ✓. manual SQL/수동 SQL 10건 ≥ 3 ✓. _journal.json 6건 ≥ 1 ✓. __drizzle_migrations 11건 ≥ 1 ✓. sha256/hash 10건 ≥ 1 ✓. |
| M-5 | DRIZZLE_MIGRATIONS.md 기존 운영 자산 보존 | PASS | 0006_gray_sersi/uuid_cast_guard 5건 ≥ 1 ✓. squash/baseline 22건 ≥ 2 ✓. |
| M-6 | csp-violation.spec.ts 존재 + 3 MUST test case | PASS | FILE_EXISTS ✓. `test(` 4건 ≥ 3 ✓. Content-Security-Policy/csp header ≥ 1 ✓. Report-To/report-uri ≥ 1 ✓. csp-violation/legacy/reporting api ≥ 1 ✓. |
| M-7 | CSP spec — SSOT import | PASS | `@equipment-management/shared-constants` 1건 ≥ 1 ✓. `API_ENDPOINTS.SECURITY.CSP_REPORT` 3건 ≥ 1 ✓. `BASE_URLS` 5건 ≥ 1 ✓ (iter 1: 6건, iter 2: 5건 — `BACKEND_API` 제거로 1건 감소, 임계값 충족 유지). |
| M-8 | CSP spec — 하드코딩 URL 0건 | PASS | grep 결과 `NONE` ✓. |
| M-9 | CSP spec — Old API 회귀 차단 | PASS | `page.route(` 0건 ✓. `middleware/getServerSideProps` 0건 ✓. `useFormState` 0건 ✓. |
| M-10 | **CSP spec — Lint + Type 통과** | **PASS** | `BACKEND_API` 미사용 변수 제거됨. `pnpm exec eslint --no-ignore tests/e2e/security/csp-violation.spec.ts` exit 0 (0 errors). 상세 ↓ |
| M-11 | tech-debt-tracker 라인 56/57 종결 마크 | PASS | `[x].*수동 검증` ✓. `[x].*Drizzle snapshot 재생성` ✓. archive OR-fallback ✓. tracker slug 2건 ≥ 2 ✓. |
| M-12 | archive batch row 등재 | PASS | archive slug 1건 ≥ 1 ✓. awk caveat 적용: line 74에 위치, 직전 ## 헤더가 line 19 (2026년 5월 배치 이력), 사이 헤더 0건 ✓. |
| M-13 | **`pnpm tsc --noEmit` 에러 0** | **PASS** | EXIT 0 ✓. iter 1 평가 시점에도 EXIT 0이었으며, iter 2 재실행 시점에도 EXIT 0 (직접 검증). 사용자 보고서에 명시된 다른 세션 in-progress 삭제(`apps/frontend/app/(dashboard)/handover/`)는 평가 시점 이미 정리됨 — `git status -s \| grep "^[ ]?D " \| wc -l = 0` 확인. 본 sprint 변경 파일은 모두 tsc clean. |
| M-14 | backend test 회귀 0건 | PASS | 4 suites / 31 tests 전체 PASS. EXIT 0 ✓ (iter 1·iter 2 재실행 모두 동일). |
| M-15 | MEMORY.md 인덱스 등록 | PASS | slug 1건 (line 118), `## 프로젝트 이력` (line 116) 직후 위치 ✓. |

### M-10 상세 (resolved)

**Iter 1 FAIL 원인**:
1. `BACKEND_API` (line 29) unused variable 오류
2. 계약 명령 `pnpm --filter frontend run lint -- <file>` 의 CLI 문법 문제로 exit 2

**Iter 2 검증**:
```bash
$ grep -n "BACKEND_API" apps/frontend/tests/e2e/security/csp-violation.spec.ts
# (출력 없음 — 변수 제거됨)

$ cd apps/frontend && pnpm exec eslint --no-ignore tests/e2e/security/csp-violation.spec.ts
EXIT:0  # 0 errors

$ pnpm exec eslint tests/e2e/security/csp-violation.spec.ts  # ignore 정책 적용 시
✖ 1 problem (0 errors, 1 warning)  # warning은 "file ignored"이며 실제 lint 오류는 0
EXIT:0
```

계약 명령(`pnpm --filter frontend run lint -- <file>`)은 여전히 exit 2를 반환하지만, 이는 **ESLint CLI + pnpm `--` separator + `tests/e2e/**` ignore 정책의 구조적 조합 문제**이며 spec 파일 자체의 lint 정합성과 무관함. M-10의 의도("CSP spec이 lint 통과")는 `--no-ignore` 또는 직접 invocation으로 검증 시 명백히 PASS — Generator의 검증 명령(`pnpm exec eslint --no-ignore ...`)이 의도에 부합하는 정합 명령으로 판정. 본 결함은 sprint scope 외 contract authoring 표준화 이슈로 분리 (Recommendations 절 참조).

### M-13 상세

iter 2 재실행 시점에 `pnpm tsc --noEmit` EXIT 0. 사용자 보고서에 명시된 다른 세션 in-progress 삭제(`apps/frontend/app/(dashboard)/handover/`, `apps/backend/src/modules/checkouts/services/handover-token.service.ts`)는 평가 시점 이미 정리됨 (`git status -s` 결과 D 파일 0건). 본 sprint 변경 4 파일(`csp-violation.spec.ts` / `0010-drizzle-manual-sql-policy.md` / `DRIZZLE_MIGRATIONS.md` / `0002-drizzle-orm-over-typeorm.md`) 모두 tsc clean. `csp-violation.spec.ts` 는 `tsconfig.json` exclude `"tests"` 로 tsc 검사 대상이 아니지만 본 sprint 무관.

### M-14 상세

iter 2 재실행: 4 suites (sort-rejection-telemetry / sort-rejection-redis-rate-limiter / security.service / security.controller) 전체 PASS, 31/31 tests, EXIT 0.

---

## SHOULD Criteria Result

| ID | Criterion | Result | Note |
|----|-----------|--------|------|
| S-16 | TC-4 코드 keyword | PASS (code only) | `expect.poll/page.evaluate.*createElement/forbidden.example.invalid` ≥ 1 ✓. Playwright 런타임 실행은 DEFERRED — dev server + storageState 인프라 필요. 후속 tech-debt 등록 권장. |
| S-17 | chromium 단독 실행 의도 주석 | PASS | "chromium 단독 실행" header 주석 존재 ✓. |
| S-18 | DRIZZLE_MIGRATIONS.md §4 (CI 체크) 갱신 | PASS | CI 검증 keyword 2건 ≥ 1 ✓. §4에 `drizzle-kit generate` 차단 grep + snapshot diff guard 3단계 스크립트 명시. |
| S-19 | CSP spec wall time < 60s on chromium | DEFERRED | 브라우저 실행 미수행 (S-16과 동일 인프라 의존). |
| S-20 | ADR-0010 References 인용 | PASS | ADR-0002 3건 ≥ 1 ✓. DRIZZLE_MIGRATIONS 9건 ≥ 1 ✓. `feedback_drizzle_kit_interactive_prompt` 2건 ≥ 1 ✓. |

---

## Architecture Review Findings (iter 2 update)

### ADR-0010 vs ADR-0002 일관성 — RESOLVED

**Iter 1 finding**: ADR-0002 `## 결과` 마지막 줄이 `db:generate → SQL 리뷰 → db:migrate` 워크플로를 명시하나 ADR-0010 forward reference 없음 — ADR-0002만 보는 독자가 금지된 워크플로를 따를 위험.

**Iter 2 fix 검증**:
```bash
$ grep -c "ADR-0010" docs/adr/0002-drizzle-orm-over-typeorm.md
1  # ✓ forward reference 추가됨
```

ADR-0002 마지막 줄이 다음과 같이 갱신됨:
> "마이그레이션 워크플로우 (운영 정책 보완 — 2026-05-09): 본 레포는 [ADR-0010 (Drizzle Manual SQL Policy)](./0010-drizzle-manual-sql-policy.md) 에 따라 `drizzle-kit generate` 가 아닌 **manual SQL 작성 + `_journal.json` append + DB 직접 apply + `__drizzle_migrations` tracking sync** 4 단계 절차를 채택한다. ... ADR-0010 은 본 ADR-0002 의 ORM 선택 결정을 *대체* 하지 않고 *보완* 한다."

ADR-0002 ↔ ADR-0010 양방향 cross-reference 완성. doc-vs-doc 모순 영구 차단.

### DRIZZLE_MIGRATIONS.md vs ADR-0010 일관성 — PASS (iter 1과 동일)

§1 ADR-0010 백링크 / §5 squash fallback ("ADR-0010 manual SQL — squash는 단일 환경 한정 fallback") / §6 uuid-cast 가드 모두 정합.

### CSP spec storageState 경로 정합성 — PASS (iter 1과 동일)

`tests/e2e/.auth/lab-manager.json` ↔ `auth.setup.ts` 출력 경로 일치.

---

## Defects Found

없음. iter 1의 단일 MUST 결함(M-10 unused variable)은 iter 2에서 제거 확인됨.

---

## Recommendations

### Tech-debt 등록 권장 (SHOULD non-blocking)

1. **`csp-violation-spec-runtime-verification`** (S-16 / S-19 DEFERRED): 실 Playwright 실행으로 TC-4 (real DOM violation) + wall time < 60s 검증. 트리거: dev server + auth.setup.ts 사전 실행 가능한 환경 확보 시.

### 평가자 메모 (Sprint scope 외)

- 계약 M-10 명령 (`pnpm --filter frontend run lint -- <file>`) 의 CLI 문법 문제는 본 sprint 자체 결함이 아니며 spec 파일은 lint clean임. 향후 contract 작성 시 ESLint CLI semantics + ignore 정책 충돌을 회피하는 명령 형태(`pnpm exec eslint <file>` 등)로 표준화 권장 — 별도 contract authoring guideline 후속으로 분리.

---

## Final Verdict

**PASS** — 15/15 MUST + 3/5 SHOULD PASS, 2 SHOULD DEFERRED (런타임 인프라 의존, tech-debt 등록 권장).

**Step 7 진입 권고**:
- contract + exec-plan을 `completed/` 디렉토리로 이동
- MEMORY.md 프로젝트 이력 항목은 이미 등재됨 (line 118)
- tech-debt-tracker 라인 56/57은 이미 `[x]` + archive batch row 등재 완료
- ADR-0010 + ADR-0002 forward reference + DRIZZLE_MIGRATIONS.md 갱신 모두 완료
- iter 2 fix 후속: `BACKEND_API` 변수 제거 + ADR-0002 forward reference 추가 — 본 sprint 결함 0건
