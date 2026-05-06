# Commit Pipeline Safety — exec-plan

- **slug**: `commit-pipeline-safety`
- **mode**: 2 (harness)
- **date**: 2026-05-06
- **scope**: husky pre-commit / lintstaged / lint:ci / pre-push 정합 + multi-session race + ADR
- **status**: active

## 배경

본 세션 incident chain (2026-05-06):
1. 다른 세션 commit `c5e3a39f`가 `randomUUID from 'node:crypto'` 위반을 main 진입 — backend `lint:ci`(pre-push)에서는 차단되지만 lintstaged staged-only eslint에서는 통과 → 회귀.
2. 본 세션이 fix 시도 시 `git add 1file` 했으나 인덱스에 다른 세션이 미리 stage한 10개 파일이 흡수돼 11파일 commit됨.
3. `git reset HEAD~1` 복구.
4. `tech-debt-tracker.md:4` 문구 부정확 가능성.

핵심 결함:
- **A (재정의)**: 두 config는 같은 `.eslintrc.js` 사용 — **GLOB COVERAGE 차이**. lintstaged glob `apps/backend/src/**/*.ts` ⊊ lint:ci glob `{src,apps,libs,test}/**/*.ts`.
- **B**: multi-session 환경에서 `git add` 의도와 인덱스 실제 상태 차이를 hook이 감지 못 함.
- **C**: multi-session race 반복되지만 정책 ADR 없음.
- **D**: tracker header 문구.

## Phase 0 — 현황 진단 (read-only)

c5e3a39f 변경 파일 위치 + lintstaged↔lint:ci glob diff 정량화 + ADR 디렉토리(`docs/adr/` 사용).

## Phase 1 — Item 1 lintstaged-lintci glob+ruleset parity

- `.lintstagedrc.json`: backend glob `apps/backend/src/**/*.ts` → `apps/backend/{src,test,libs,apps}/**/*.ts`
- 신규 `scripts/verify-lint-ruleset-parity.mjs`: SSOT const(critical rules + glob spec) + 정적 비교
- `package.json`: `verify:lint-ruleset-parity` script
- `.husky/pre-push`: 신규 step 추가

## Phase 2 — Item 2 pre-commit-staged-count-guard (Option E)

채택안: **diff stat 자동 출력 + `EMS_PRECOMMIT_STRICT=1` opt-in block + mtime spread heuristic**.

- 신규 `scripts/precommit-staged-guard.mjs`
- `.husky/pre-commit`: step 0 추가
- 작성 직후 `git commit --allow-empty -m "verify"` sentinel 검증

## Phase 3 — Item 3 ADR-0007 multi-session-safety

- 신규 `docs/adr/0007-multi-session-working-tree-safety.md`
- 채택: (c) hook 가드 + memory feedback 정책
- 트리거: incident ≥ 월 3회 시 worktree 분리 ADR-0008로 분리

## Phase 4 — Item 4 tracker header

- archive 파일 실재 확인 후 line 4 정확성 검증/수정

## Phase 5 — fixture 회귀 spec + 통합 verify

- `scripts/__tests__/precommit-staged-guard.spec.mjs`
- `scripts/__tests__/verify-lint-ruleset-parity.spec.mjs` (또는 인라인 fixture)
- 통합 verify: tsc + backend test + parity + sentinel commit

## 백업/롤백

| Phase | 변경 | 롤백 |
|---|---|---|
| 1 | `.lintstagedrc.json`, scripts 신규, hook line | git checkout + 신규 파일 삭제 |
| 2 | scripts 신규, `.husky/pre-commit` line | hook line 제거 + 스크립트 삭제 |
| 3 | ADR-0007 신규 | 삭제 |
| 4 | tracker line 4 | git checkout |
| 5 | spec 신규 | 삭제 |

**critical**: Phase 2 hook 작성 오류 시 모든 commit 차단. sentinel commit 즉시 검증 의무.

## Build Sequence

- [ ] Phase 0 진단
- [ ] Phase 1 glob 확장 + parity 스크립트 + pre-push 통합
- [ ] Phase 2 pre-commit guard + sentinel 검증
- [ ] Phase 3 ADR-0007
- [ ] Phase 4 tracker (필요 시)
- [ ] Phase 5 fixture spec + 통합 verify
- [ ] 자기검토 라운드 ≥ 2
- [ ] commit (본 sprint 변경 파일만 stage, `git diff --cached --stat` 검증)

## Out of Scope

- GitHub Dependabot 13 vulnerabilities
- 다른 세션 11 modified working tree 파일
- backend `lint:ci` 룰 자체 변경
- frontend lintstaged↔lint parity (S-1)
- packages 영역 parity (S-2)
