# Evaluation Report: E2E CI Auth Setup Fix

**Date:** 2026-04-02
**Evaluator:** QA Agent
**Contract:** `.claude/contract.md`

---

## Critical Finding: Changes Not Committed

All code changes exist only in the working tree (unstaged). `git status` shows modified but uncommitted files:
- `apps/frontend/lib/auth.ts`
- `apps/frontend/app/(auth)/login/page.tsx`
- `.github/workflows/main.yml`
- `.env.ci.example`

The Generator completed the code changes correctly but did not create a commit. Evaluation below is against the **working tree state** (not committed state).

---

## MUST Criteria

| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| M1 | `ENABLE_TEST_AUTH` 환경변수로 test-login provider + DevLoginButtons 활성화 제어 | **PASS** | `auth.ts:73`: `enableTestAuth = process.env.ENABLE_TEST_AUTH === 'true' \|\| isTest \|\| isDevelopment` 추가. `auth.ts:258`: `...(enableTestAuth` 사용 (기존 `isTest \|\| isDevelopment` 대체). `login/page.tsx:11-12`: `showDevAccounts = process.env.NODE_ENV === 'development' \|\| process.env.ENABLE_TEST_AUTH === 'true'` |
| M2 | CI workflow e2e-test job에 `ENABLE_TEST_AUTH=true` 설정 | **PASS** | `main.yml` build step (line 309)과 frontend start step (line 340) 모두에 `ENABLE_TEST_AUTH: 'true'` 추가 확인 |
| M3 | `pnpm --filter frontend run tsc --noEmit` 통과 | **NOT VERIFIED** | 빌드 미실행. Generator 보고에 의존. 변경 범위가 작아(환경변수 읽기 + boolean 연산) 실패 가능성 낮으나 독립 검증 부재 |
| M4 | `pnpm --filter backend run tsc --noEmit` 통과 | **NOT VERIFIED** | Backend 코드 변경 없음. 실패 가능성 극히 낮으나 독립 검증 부재 |
| M5 | 기존 `ENABLE_LOCAL_AUTH` 패턴과 일관된 네이밍/사용법 | **PASS** | `enableLocalAuth = process.env.ENABLE_LOCAL_AUTH === 'true' \|\| isDevelopment` vs `enableTestAuth = process.env.ENABLE_TEST_AUTH === 'true' \|\| isTest \|\| isDevelopment`. 동일 패턴: `ENABLE_*` prefix, `=== 'true'` strict check, `\|\| fallback` |
| M6 | `.env.ci.example`에 `ENABLE_TEST_AUTH` 문서화 | **PASS** | line 34-35: 전용 섹션 추가 `# ENABLE_TEST_AUTH=true` + 용도 설명 주석. line 38: 환경별 차이점에 `ENABLE_TEST_AUTH=true` 추가 |
| M7 | `continue-on-error: true` 제거 | **PASS** | working tree diff에서 `continue-on-error: true` + 주석 2줄 삭제 확인. 현재 main.yml의 e2e-test job에 `continue-on-error` 없음 |
| M8 | 로컬 개발 환경 영향 없음 | **PASS** | `auth.ts`: `isDevelopment=true` -> `enableTestAuth=true` (기존 `isTest \|\| isDevelopment`와 동일 결과). `login/page.tsx`: `NODE_ENV === 'development'` 조건 첫 번째 항으로 유지 -> `showDevAccounts=true` (기존 동작 보존) |

---

## SHOULD Criteria

| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| S1 | `pnpm build` 성공 | **NOT VERIFIED** | Generator 보고에 의존. 독립 검증 미실행 |
| S2 | auth.setup.ts 코드 변경 불필요 | **PASS** | `git diff HEAD -- '**/auth.setup.ts'` 출력 없음. auth.setup.ts 미수정 확인 |
| S3 | SSOT 준수 | **PASS** | `ENABLE_TEST_AUTH` 참조 위치: `auth.ts` (provider 등록), `login/page.tsx` (DevLoginButtons 표시), `main.yml` (CI env), `.env.ci.example` (문서). 환경변수가 단일 제어점으로 기능하며 로컬 상수 재정의 없음 |

---

## Overall Verdict: **CONDITIONAL PASS**

### Code Correctness: PASS (M1, M2, M5, M6, M7, M8 충족)

코드 변경 4건 모두 정확하며 최소 변경 원칙을 준수한다. 기존 로컬 개발 환경 동작에 영향 없음.

### Blocking Issues

1. **변경 사항 미커밋**: 4개 파일의 변경이 working tree에만 존재하며 staged/committed 되지 않음. 커밋 없이는 CI에서 효과 없음.
2. **M3/M4 독립 검증 미실행**: tsc 빌드가 Evaluator에 의해 실행되지 않음. 변경이 `process.env` 읽기와 boolean 연산뿐이라 실패 가능성은 매우 낮으나, 계약 상 "검증" 요건을 완전히 충족하지는 못함.

### 최종 판정

코드 품질은 충분하다. 커밋 후 CI 파이프라인에서 실제 E2E auth.setup 통과를 확인하면 완전한 PASS이다.
