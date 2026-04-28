# 다음 세션 핸드오프 — 2026-04-28 3-Track Closure (Track A 완료 / Track B WIP / Track C 미시작)

## 본 세션 요약

**Mode 2 harness** 호출 → 사용자 옵션 A 채택(전체 일괄). 진행 도중 컨텍스트 한계 → 트랙별 commit 분리 + 다음 세션 핸드오프로 마무리.

### 본 세션 commit (3건, push 미수행)

```
69883d63 feat(routing): adr-0006 same-origin reverse-proxy 모델 정착 (검증 미실행)
867d519d refactor(checkouts): route-loading 9 호출처 SSOT 마이그
70164e1d feat(software-validations): system-wide audit closure — A1·A2·A3·B1·B2·C1
```

origin/main: `108f9693` → 본 세션 commit 3건 (ahead=3, push 안 함).

### Track 별 verdict

| 트랙 | 도메인 | 상태 | Verdict |
|------|--------|------|---------|
| A | software-validations system-wide (A1·A2·A3·B1·B2·C1) | 코드 + 정적 검증 PASS | **PASS** (단, jest e2e 실 실행 미수행) |
| A-side | RouteLoading SSOT 마이그 9 호출처 | lint regression closure | **PASS** |
| B | nextauth-csrf single-origin (ADR-0006) | 코드 작성 완료 / 검증 게이트 0건 | **WIP** |
| C | dev-doctor --hint-line + checkout-selectability SSOT | 미착수 | **미시작** |

---

## 🔴 IMMEDIATE — 다음 세션 즉시 처리 (Track B 검증 + Track A 잔여)

### T1. Track B 검증 게이트 (~60분)

본 세션은 ADR-0006 same-origin reverse-proxy 모델 코드를 정착시켰으나 **검증 게이트 0건 실행** 상태로 commit. 다음 세션이 가장 먼저 처리.

```bash
# 1. dev 재기동 + Phase 0 reproduction (404 제거 확인)
pnpm dev:fresh
# backend 콘솔 → 5분 모니터: NotFoundException: Cannot GET /api/auth/csrf 0건 ?
# 만약 여전히 발생 → exec-plan §2.3 호출 경로 추적 (sw.ts unregister / axios baseURL)

# 2. 정적 검증
pnpm tsc --noEmit
pnpm --filter backend run lint:ci
pnpm --filter frontend run lint
pnpm --filter backend run test
pnpm --filter frontend run test

# 3. 신설 verify-routing-origin SKILL 자체 검증
# .claude/skills/verify-routing-origin/SKILL.md 의 grep 패턴 실행
# - BACKEND_AUTH_PATHS ∩ NEXTAUTH_HANDLER_PATHS = ∅ (partition invariant)
# - 4 레이어(next.config.js, nginx, proxy.ts, auth.ts) SSOT 사용 일치성

# 4. pre-push hook full 실행
bash .husky/pre-push

# 5. (선택) lan compose 환경 검증
pnpm compose:lan up -d
curl -i http://localhost:9080/api/auth/csrf  # frontend 핸들 (200)
curl -i http://localhost:9080/api/equipment  # backend (200/401)
```

**실패 시나리오 대응**:
- 404가 여전히 발생 → exec-plan `2026-04-28-nextauth-csrf-single-origin.md` §2.3 추적 (axios baseURL / SW / Chrome ext)
- lint 실패 → frontend의 RouteLoading 외 deprecated 호출처(software, calibration 등)도 동시에 마이그 필요 (예상 ~12 호출처)
- jest 실패 → backend test setUp/tearDown에 routing 모델 의존성 잠복 가능 (axios baseURL 사용 spec 검토)

### T2. Track A `test:e2e` 실 실행 (~10분)

본 세션 commit 70164e1d는 `apps/backend/test/software-validations.e2e-spec.ts` 신설 정적 검증만 수행. jest-e2e 인프라(globalSetup + 실 PostgreSQL)에서 실 실행 미수행.

```bash
# Docker postgres 가동 확인
docker compose ps --status running postgres

# 본 spec 7 케이스 실 실행
pnpm --filter backend run test:e2e -- software-validations

# 기대: PASS — approve 3 + qualityApprove 4 = 7 케이스 통과
# 실패 시: jest-e2e globalSetup (test_software 시드 부재) 가능성 → spec 자체 INSERT
```

---

## 🟡 MEDIUM — review-arch 후속 (~50분)

### T3. dev-doctor `--hint-line` CLI mode (~30분)

`.claude/settings.json` SessionStart hook의 inline `node -e '...'` 35자 파서가 dev-doctor SSOT 외부에 있음. doctor에 `--hint-line` 옵션 추가 → hook은 단순 `node scripts/dev-doctor.mjs --hint-line` 호출만.

처리 범위:
- `scripts/dev-doctor.mjs`에 `--hint-line` argv 처리 추가
- `.claude/settings.json` SessionStart hook을 `node scripts/dev-doctor.mjs --hint-line` 호출로 단순화
- 관찰 가능한 동작 동일 (verify: 세션 시작 시 hint 메시지 동일하게 출력)

### T4. checkout-selectability 물리적 SSOT 통일 (~20분)

backend `checkouts.service.ts:1535-1551` OWN_TEAM/OTHER_TEAM 가드가 inline `===` 비교 (논리적 동기 — frontend SSOT와 동일 룰이지만 backend 자체 구현). 

처리: `import { isPurposeCompatibleWithEquipment } from '@equipment-management/shared-constants'` 1-line 수렴.

미래 룰 변경 시 frontend SSOT만 갱신하고 backend 누락 risk 차단.

---

## 🟢 LOW — 별 sprint (트리거 명확)

### T5. rental-approval-workflow-fix 시작

본 세션 dirty에 `.claude/contracts/rental-approval-workflow-fix.md` + `.claude/exec-plans/active/2026-04-28-rental-approval-workflow-fix.md`가 untracked로 남아 있음 (Mode 2 plan/contract만 작성된 상태, 코드 변경 0).

**별 sprint** — Track A/B 완전 closure 후 또는 별도 세션에서 진행.

목표(contract에서 발췌):
- 평택랩 TM(lender)이 pending 상태에서 잘못된 액션 버튼(`approve`/`borrower_approve`) 클릭으로 400/403 받는 회귀 0건
- 수원랩 TM(borrower)만 pending 상태에서 `borrower_approve`/`borrower_reject` 활성
- 평택랩 TM(lender)은 `borrower_approved` 상태에서만 `approve`/`reject` 활성
- 모든 checkout 응답에 `meta.availableActions` + `meta.nextStep` 포함 (FSM drift 0)
- `errors.UNKNOWN_ERROR.actionLabel` ko/en parity

### T6. 다른 deprecated RouteLoading 호출처 마이그

본 세션 commit 867d519d는 checkouts 도메인 9 호출처만 처리. 다른 도메인 ~12 호출처 잔존:
- software, calibration, calibration-plans, reports, admin, cables, form-templates,
  software-validations, notifications, calibration-records 등

**트리거**: pre-push lint 게이트가 다른 도메인 commit 진입 시 deprecated error 보고할 때 → 해당 도메인 마이그.

### T7. ultrareview Layer 6 (선택)

본 세션 3 commit 머지 직전 advisor 권고:
```bash
node scripts/ultrareview-preflight.mjs
node scripts/ultrareview-advisor.mjs
# Go 판정 → /ultrareview <PR번호>
```

대규모 변경(Track A: 28 파일, Track B: 25 파일)이라 사용자 결정 사항.

---

## 본 세션 산출물 위치

| 도메인 | 경로 |
|--------|------|
| Track A plan/contract | `.claude/{exec-plans/active,contracts}/2026-04-28-software-validation-system-wide-completion.md` (active 위치 — 다음 세션 jest e2e 실 실행 후 completed/로 이동) |
| Track A handoff (이전 세션) | `.claude/evaluations/next-session-handoff-2026-04-29-software-validation-approve-comment-complete.md` |
| Track B plan/contract | `.claude/{exec-plans/active,contracts}/2026-04-28-nextauth-csrf-single-origin.md` (active 위치 — 검증 후 completed/로 이동) |
| Track B SSOT | `packages/shared-constants/src/api-routing.ts` |
| Track B verify skill | `.claude/skills/verify-routing-origin/SKILL.md` |
| Track B docs | `docs/adr/0006-frontend-backend-routing-model.md`, `docs/references/api-routing-architecture.md` |
| Track A verify-zod Step 14 | `.claude/skills/verify-zod/SKILL.md:465-510` |
| Track A self-audit 룰 8 | `scripts/self-audit.mjs:427-465` |
| Track A docs | `docs/references/{self-audit.md,skills-index.md}` |
| Track A pre-push lint | `.husky/pre-push:60-80` (backend lint:ci + frontend lint 추가) |
| 별 sprint plan | `.claude/{contracts,exec-plans/active}/2026-04-28-rental-approval-workflow-fix.md` |

---

## 주의사항

### Track B WIP 상태 명시

본 commit `69883d63`은 **검증 게이트 0건 실행 상태**로 작성되었습니다. push 전 반드시 다음 세션 T1 검증 완료 필요. 만약 검증 실패 → revert 또는 추가 fix commit으로 closure.

```bash
# revert 시나리오 (Track B 단독 revert)
git revert 69883d63
# 단, Track A core(70164e1d)와 RouteLoading 마이그(867d519d)는 보존
```

### dirty 잔존

본 세션 정리 후 dirty 잔존:
- `.claude/settings.local.json` (local-only, commit 보류)
- `apps/frontend/next-env.d.ts` (auto-generated)
- `.claude/contracts/rental-approval-workflow-fix.md` (untracked, 별 sprint)
- `.claude/exec-plans/active/2026-04-28-rental-approval-workflow-fix.md` (untracked, 별 sprint)

다음 세션은 위 4건 외 dirty가 0인 상태에서 진입 가능.

### 메모리 교훈 적용 사례

- **시니어 아키텍처 수준 계획**: Track A·B 모두 SSOT/비하드코딩/워크플로우/성능/보안/접근성을 Phase별 명시. Track B는 ADR-0006 본문 + 4-레이어 invariant 정의.
- **Disabled with reason**: Track A `approveDialog` 코멘트 optional이지만 입력 강제 시 disabled + tooltip 사유 표시 패턴(`commentRequired=true` 통합 페이지와 정합).
- **세션 정리 시 자동 commit (push 별도)**: 본 세션 정책 적용 — 3 트랙 분리 commit, push 안 함.
- **시스템 전반 SSOT**: Track B의 `api-routing.ts`가 4-레이어(next.config.js / nginx / proxy.ts / auth.ts) SSOT — 미래 라우팅 룰 변경 시 1곳만 갱신.

---

## 권장 다음 세션 시작 멘트

```
세션 시작. 본 세션(2026-04-28 3-track closure WIP) 핸드오프 확인:
.claude/evaluations/next-session-handoff-2026-04-29-three-track-closure.md

T1 IMMEDIATE 처리: Track B 검증 게이트 실행 (~60분)
- pnpm dev:fresh + 5분 모니터 (NotFoundException 0건 확인)
- pnpm tsc / lint:ci / lint / test 전체
- bash .husky/pre-push full
- 신설 verify-routing-origin SKILL 자체 검증

T2 IMMEDIATE 처리: Track A jest e2e 실 실행 (~10분)
- pnpm --filter backend run test:e2e -- software-validations

T3+T4 MEDIUM (~50분): review-arch 후속
- dev-doctor --hint-line CLI mode
- checkout-selectability 물리적 SSOT 통일

이후 origin/main push 결정. 검증 모두 PASS 시 push, 실패 시 추가 fix.
T5(rental-approval-workflow-fix) 별 sprint 또는 별도 세션.
```

---

## 시니어 교훈 (메모리 격상 후보)

1. **WIP commit 패턴 — branch 없는 main-only 워크플로의 표준**: 거대한 변경(25 파일 ADR 정착)을 검증 미실행 상태로 commit하되, commit message에 "검증 미실행" 명시 + revert 시나리오 명시. 다음 세션이 dirty 0으로 깨끗하게 진입 가능. branch + PR 모델에서는 draft PR이 동일 역할.

2. **deprecated SSOT 회귀의 lint 게이트 효과**: 직전 세션의 deprecated 마킹(`@deprecated`)이 다른 도메인 호출처를 lint error로 자동 감지 → 회귀 차단. SSOT 마이그를 강제하는 정적 게이트로 매우 효과적.

3. **partition invariant SSOT**: Track B `api-routing.ts`의 `BACKEND_AUTH_PATHS ∩ NEXTAUTH_HANDLER_PATHS = ∅` invariant. 두 집합의 합집합이 `/api/auth/*` 네임스페이스를 partition한다는 강제 — verify-routing-origin SKILL이 정적 검증. 미래 신규 auth 경로 추가 시 SSOT 갱신 누락 차단.

4. **3-track 동시 진행 시 commit 분리 표준**: 단일 세션에서 multi-domain 작업 시, 트랙별 격리 commit이 bisect 가독성 + revert 단위성 보장. Track A·B를 한 commit으로 합치면 Track B revert 시 Track A 정합 fix까지 손실.

5. **harness Mode 2 + 옵션 A는 컨텍스트 한계 인지가 필수**: 옵션 A(전체 일괄)는 이상적이지만 5+ Mode 2 plan을 한 세션에 closure 불가능. 트랙별 부분 commit + 핸드오프로 lifecycle 연속성 보장 — 단일 세션 = 단일 트랙 closure가 현실적 표준.
