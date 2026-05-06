---
slug: commit-pipeline-safety
mode: 2
status: in_progress
domain: tooling / commit-pipeline / hooks / lint
date: 2026-05-06
---

# Sprint — Commit Pipeline Safety (4건 closure)

## 배경

본 세션 incident chain (2026-05-06) — 다른 세션 commit `c5e3a39f`의 `randomUUID from 'node:crypto'` 위반이 main 진입 (lintstaged staged-only eslint 통과 / `lint:ci` pre-push에서 차단). 본 세션 fix 시 multi-session 인덱스 흡수로 11파일 commit 사고. 4건 시스템 closure 필요.

진짜 결함은 **GLOB COVERAGE PARITY** — 두 config는 같은 `apps/backend/.eslintrc.js`를 쓰나 lintstaged glob `apps/backend/src/**/*.ts`이 lint:ci glob `{src,apps,libs,test}/**/*.ts`의 부분집합.

## SSOT 출처

- `.lintstagedrc.json`
- `apps/backend/package.json:18` (`lint:ci`)
- `apps/backend/.eslintrc.js:54-124` (randomUUID 4-layer 룰)
- `.husky/pre-commit`, `.husky/pre-push`
- `docs/adr/template.md`
- memory: `feedback_lintstaged_other_session_files.md`, `feedback_evaluator_pass_senior_self_audit.md`

## MUST

- **M-1 ruleset parity 자동 검증**: `scripts/verify-lint-ruleset-parity.mjs` 존재 + 실행 시 PASS. lintstaged eslint config 경로(`apps/backend/.eslintrc.js`)가 lint:ci와 동일 단일 SSOT임을 정적 비교 검증. critical 룰(`no-restricted-imports`, `no-restricted-syntax`) 정의 + `node:crypto:randomUUID`/`crypto:randomUUID` 등록 검증. 검증: `pnpm verify:lint-ruleset-parity` exit 0.

- **M-2 회귀 fixture 차단**: `apps/backend/src/` 하위 위반 fixture를 임시 staged → `pnpm lint-staged` 호출 → exit code != 0. Phase 5 spec으로 자동화.

- **M-3 lintstaged glob coverage**: lintstaged glob이 lint:ci 위반 가능 영역 ⊇. 즉 backend 영역에 `apps/backend/{src,test,libs,apps}/**/*.ts` 또는 동등. 검증: `.lintstagedrc.json` glob에 `test`/`libs` 포함 또는 `apps/backend/**/*.ts` (전 영역).

- **M-4 pre-commit staged guard 동작**: `scripts/precommit-staged-guard.mjs` 존재 + 실행 시 stat 출력 + strict mode opt-in block. 검증: 정상 모드 exit 0 + stderr에 `staged 파일 N개` 패턴 포함.

- **M-5 strict mode block**: `EMS_PRECOMMIT_STRICT=1` + staged 파일 11개 이상 시 block. unit spec PASS (block 1건 + 통과 1건).

- **M-6 ADR-0007 존재**: `docs/adr/0007-multi-session-working-tree-safety.md` 존재 + Status:Accepted + Context/Decision/Consequences/Trigger Conditions 4섹션.

- **M-7 tech-debt-tracker.md:4 정확성**: line 4 문구가 실제 archive 파일/디렉토리 위치와 일치. 검증: 참조 파일/경로 실재.

- **M-8 SSOT (스크립트 하드코딩 0)**: 신규 스크립트 2개의 path/rule name이 const 또는 JSON config로 SSOT. 매직 string 직접 사용 ≤ 1 (const 정의 1건 외 사용처는 const 참조).

- **M-9 hook 성능 1s 이내**: `time node scripts/precommit-staged-guard.mjs` <1.0s.

- **M-10 tsc clean**: `pnpm tsc --noEmit` exit 0.

- **M-11 backend test PASS**: `pnpm --filter backend run test --silent --passWithNoTests` exit 0.

- **M-12 다른 세션 11 modified 파일 unchanged**: sprint 시작 baseline 캡처 → 종료 시 동일. Generator가 baseline 캡처 후 비교.

- **M-13 hook 우회 경로 부재**: `.husky/`/`scripts/` 내 `--no-verify`/`HUSKY=0` 회피 경로 0건 (정책 docs 언급 1건 허용).

- **M-14 pre-push parity step 통합**: `.husky/pre-push`에 `verify:lint-ruleset-parity` step 호출 존재.

## SHOULD

- **S-1 frontend lintstaged↔lint parity**: ESLint 9 flat config 전용 parity 스크립트 별도 sprint.
- **S-2 packages 영역 parity**: `packages/**/*.ts` lintstaged glob과 root `.eslintrc.js`의 packages override 정합 별도.
- **S-3 commitlint 강화**: 본 sprint 외.
- **S-4 git worktree per-session 가이드**: ADR-0007 트리거 미달 — incident ≥ 월 3회 시 ADR-0008.
- **S-5 hook 실행 시간 metrics**: 회귀 추적은 별도.

## 작업

### Generator

1. **Phase 0 진단** — c5e3a39f staged 통과 root cause + glob diff. READ-ONLY.
2. **Phase 1** — `.lintstagedrc.json` glob 확장 + `scripts/verify-lint-ruleset-parity.mjs` SSOT 신설 + pre-push 통합.
3. **Phase 2** — `scripts/precommit-staged-guard.mjs` + pre-commit 통합. **sentinel commit 즉시 검증**.
4. **Phase 3** — `docs/adr/0007-multi-session-working-tree-safety.md`.
5. **Phase 4** — tracker line 4 (필요 시).
6. **Phase 5** — fixture spec 2건 + 통합 verify.

### Evaluator

- M-1 ~ M-14 모두 통과 검증
- SHOULD 미통과 시 tech-debt-tracker 등록
- 자기검토 라운드 ≥ 2회

## 도메인 외 PASS 조건

- main only branch (브랜치 생성 0)
- commit 직전 `git diff --cached --stat` 의무
- 다른 세션 11 modified 파일 unchanged (M-12)
- `--no-verify` 사용 0회
