# ADR-0007: Multi-Session Working Tree Safety

- **상태**: Accepted
- **일시**: 2026-05-06
- **결정자**: maintainer (1인 개발)
- **맥락 범위**: ops, security, claude-code multi-session, commit-pipeline

## Context

본 프로젝트는 1인 trunk-based 워크플로 (ADR-0006 + memory `feedback_main_only_no_branches.md`)
이지만, 동일 `working tree` 에서 여러 Claude Code 세션이 동시에 작동하는 시나리오가
일상화되었다. 본 환경에서 다음 race 가 반복적으로 발생한다.

### 관찰된 incident (2026-05-06 단일 세션 1일)

1. **lintstaged staged 회귀**: 다른 세션의 commit `9fbacfbc` 가 `randomUUID from 'node:crypto'`
   import 위반을 main 진입. lintstaged glob 이 `apps/backend/src/**/*.ts` 만 커버
   (lint:ci 는 `{src,apps,libs,test}/**/*.ts`) 였고, multi-session race 또는 staged 누락이
   복합적으로 작용한 것으로 추정 — root cause 단정 불가하나 시스템 결함은 명확.
2. **인덱스 흡수 race**: 본 세션이 `git add 1file` + commit 했으나 인덱스에 다른 세션이
   미리 stage 한 10 파일이 있어 11 파일이 함께 commit 됨 (1라인 fix → 11파일 흡수).
   `git reset HEAD~1` 복구.
3. **Read → Write 충돌**: tracker 정리 작업에서 4회 `Edit`/`Write` mtime check 실패 —
   다른 세션이 동일 파일을 동시 갱신.
4. **lintstaged backup stash 누적**: 본 세션 종료 시점 `git stash list` 5+개 — backup
   stash 가 정상적으로 pop 되지 못한 채 누적.

이 race 들은 모두 **공유 working tree** 라는 단일 root cause 에서 비롯한다. 결정을 미루면:

- main 에 broken state commit 진입 빈도 증가 (lintstaged↔lint:ci 비대칭 영구화)
- 다른 세션 작업 무단 흡수로 인한 data loss 위험
- commit history 신뢰도 저하 (의도와 실제 변경의 부정합)

## Decision

**현 시점에서는 hook 가드 + memory feedback 정책 강화** 를 채택한다 (Option C).

본 sprint (`commit-pipeline-safety`) 에서 다음 시스템 가드를 도입한다.

1. **`scripts/precommit-staged-guard.mjs`** — pre-commit hook 의 첫 단계.
   - 모든 commit 에서 `git diff --cached --stat` 자동 출력 (인지 강제, 마찰 0)
   - `EMS_PRECOMMIT_STRICT=1` 활성화 시 의심 패턴 (≥11 staged 파일 또는 mtime spread ≥30분)
     자동 차단
2. **`scripts/verify-lint-ruleset-parity.mjs`** — pre-push hook 단계.
   lintstaged glob 이 lint script coverage 의 부분집합이 되는 회귀를 정적 비교로 차단.
   **backend + frontend 두 도메인 모두 검증** (iter 3 S-1 격상으로 frontend 흡수):
   `verifyDomainParity` 공통 로직 + `PARITY_SPEC.{backend,frontend}` SSOT.
3. **lintstaged backend glob 확장** — `apps/backend/src/**/*.ts` →
   `apps/backend/{src,test}/**/*.ts` 로 lint:ci coverage 와 정합.
   **frontend** 는 lintstaged glob `apps/frontend/**/*.{ts,tsx}` 가 이미 lint script `eslint .`
   와 동등 — coverage gap 없음. critical rule 등록 회귀(`STATUS_LITERAL_RULE` /
   `HEX_COLOR_RULE` / `DDAY_TONE_RULE` 누락)를 본 스크립트가 차단.
4. **memory `feedback_lintstaged_other_session_files.md` 강화** (본 sprint 외 이미 완료):
   `git add` 직후 `git diff --cached --stat` 검증 의무화.

### 검토한 대안 (Options)

1. **Option A — git worktree per-session 분리**

   각 Claude Code 세션이 별도 git worktree (`git worktree add ../session-X main`) 에서
   작업. 100% 격리.
   - **장점**: race 원천 차단. lintstaged stash 충돌 0.
   - **단점**:
     - 세션 시작/종료 비용 (worktree 생성/제거)
     - harness/scripts 가 cwd 가정에 의존하는 코드 — 모든 절대경로 검토 필요
     - memory `feedback_multi_pc_sync.md` (멀티 PC 정책) 와 인지 부담 중복
     - dependency install 중복 (각 worktree 독립 node_modules)
     - 1인 개발자가 매번 의식해야 하는 마찰

2. **Option B — Advisory lock (`.claude/.session-lock`)**

   세션 시작 시 lock 파일 생성, 다른 세션이 보면 abort 또는 wait.
   - **장점**: 단순. 기존 working tree 그대로 사용.
   - **단점**:
     - stale lock 정리 메커니즘 필요 (PID 기반 + heartbeat)
     - harness subprocess 가 메인 세션 lock 충돌 가능
     - lintstaged 등 외부 도구는 lock 인지 불가 — 가드 누수
     - 1인 개발자 단일 세션 운용 시 lock 마찰만 추가

3. **Option C — Hook 가드 + memory feedback 정책 (채택)**
   - **장점**:
     - 기존 워크플로 그대로, 추가 마찰 0 (인지 강제는 stat 출력 한 줄)
     - strict 모드는 opt-in (사용자가 위험 작업 시 활성화)
     - lintstaged glob/parity 회귀는 정적 비교로 자동 차단
     - 1인 개발자 단일 세션 운용 시 마찰 0
   - **단점**:
     - 100% 차단 아님 — 사용자 인지 의존 (stat 출력 무시 가능)
     - mtime spread 휴리스틱 false positive 여지 (legitimate refactor 도 mtime 분산 가능)
     - **strict 모드 비활성 default 시 본 sprint incident 같은 흡수 race 는 여전히 stat
       경고 만 발생** (즉 사용자가 stat 을 인지해야 차단 — 정책 의존)

### 채택 근거

- **Option A** 의 격리 비용 > 본 시점 incident 빈도가 정당화하는 ROI
- **Option B** 의 추가 lock 마찰 vs. 1인 개발 단일 세션 운용 비율이 압도적으로 많음
- **Option C** 는 incident 의 재발 방지 효과 (parity 정적 가드 + stat 인지 강제) 가 마찰
  대비 비용 효율적. 트리거 조건 충족 시 Option A 로 격상

## Consequences

### 긍정

- lintstaged↔lint:ci coverage 회귀 영구 차단 (`verify-lint-ruleset-parity` SSOT)
- 사용자가 매 commit 에서 staged 파일을 인지 (stat 자동 출력)
- 위험 작업 시 strict 모드 opt-in 으로 인덱스 흡수 race 차단
- 1인 개발 단일 세션 운용 비용 0
- ADR 본문이 향후 재검토 트리거를 결빙 — 환경 변화 시 자동 escalation

### 부정

- 다중 세션 동시 운용 + strict 미활성 시 race 의 100% 차단은 부재 — 사용자 인지에 의존
- mtime spread 휴리스틱은 legitimate refactor 에서 false positive 가능 (`EMS_PRECOMMIT_GUARD_NO_MTIME=1`
  으로 비활성화 가능)
- pre-commit hook 길이 증가 — 1초 미만이지만 cumulative

### 완화 (Mitigations)

- `EMS_PRECOMMIT_STRICT=1` 을 critical sprint (예: harness Mode 2) 또는 multi-session 동시
  운용 인지 시 활성화 — 워크플로에 명시
- `EMS_PRECOMMIT_GUARD_NO_MTIME=1` 으로 false positive 회피 (CI / harness 자동화)
- memory `feedback_lintstaged_other_session_files.md` 에 `git diff --cached --stat` 검증
  의무화 (이미 본 sprint 메모리 보강 완료)
- 트리거 조건 충족 시 ADR-0008 (worktree per-session) 로 격상

### Trigger Conditions for Reconsideration

이 결정을 재검토해야 할 조건. 트리거 충족 시 ADR-0008 신설 (worktree per-session 격리).

| 트리거                                          | 임계값                                                 |
| ----------------------------------------------- | ------------------------------------------------------ |
| multi-session race incident (working tree 충돌) | ≥ 3 건/월                                              |
| commit 흡수 사고 (다른 세션 작업 가로챔)        | ≥ 1 건 main 진입 (push 후 발견)                        |
| Claude Code 세션 동시 실행 (정기)               | ≥ 3 개 동시                                            |
| lintstaged↔lint:ci parity 회귀                  | ≥ 1 회 (`verify-lint-ruleset-parity` 가 처음으로 fail) |

## 향후 대응 절차 (운영자 가이드)

### 신세션 시작 시

1. `git status -s` 로 working tree 상태 필수 확인
2. `git log --oneline origin/main..HEAD` 로 ahead commit 검토
3. 다른 세션 작업 의심 시 (modified 파일 다수, lintstaged stash 누적) — 본인 작업 보류
   또는 `EMS_PRECOMMIT_STRICT=1` 활성화

### `git add` 후 commit 직전

1. `git diff --cached --stat` 로 staged 영역 의도 검증
2. 사용자 의도 (1 파일 fix) 와 staged count 차이가 있으면 STOP — `git restore --staged
<unintended-file>` 로 정리 후 재시도
3. memory `feedback_lintstaged_other_session_files.md` 정책 재확인

### Incident 발생 시

1. **push 전**: `git reset HEAD~1` (mixed) → 의도한 파일만 `git add` → 재 commit
2. **push 후**: `git revert <sha>` 후 follow-up commit. push 후 reset 금지 (다른 세션 영향)
3. reflog 추적: `git reflog | head -20` 으로 다른 세션 활동 식별
4. memory feedback 추가 — 신규 패턴이면 `feedback_<keyword>.md` 신설

## References

- 관련 ADR: ADR-0006 (frontend-backend routing model — 동일 게이트 정신)
- 본 sprint exec-plan: `.claude/exec-plans/active/2026-05-06-commit-pipeline-safety.md`
- 본 sprint contract: `.claude/contracts/commit-pipeline-safety.md`
- memory: `feedback_lintstaged_other_session_files.md`, `feedback_main_only_no_branches.md`,
  `feedback_multi_pc_sync.md`, `feedback_evaluator_pass_senior_self_audit.md`
- incident: 9fbacfbc (lintstaged↔lint:ci coverage 누수), 678682d1→2d4fdce9 (인덱스 흡수 + reset 복구)
- 본 sprint 신규 가드: `scripts/precommit-staged-guard.mjs`,
  `scripts/verify-lint-ruleset-parity.mjs`
