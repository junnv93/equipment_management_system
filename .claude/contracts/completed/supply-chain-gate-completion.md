# Contract — supply-chain-gate-completion (2026-05-01)

작성: 2026-04-28 | Mode 1 | 후속 작업: 2026-04-30 deps-supply-chain-hardening (ATTENTION 등급)
근거: `.claude/evaluations/session-final-review-architecture-2026-04-30.md` A1·A3·A5·A6
목표: review-architecture **ATTENTION → PASS** 등급 격상 (4건, 1.5h budget)

---

## 작업 범위

| ID | 작업 | 신규/수정 | 비용 |
|---|---|---|---|
| **A3** | `.github/workflows/supply-chain-gate.yml` 신설 — drift guard + audit:dependabot CI 게이트 | 신규 1 | 30m |
| **A1** | `mock-providers.ts`에 `createMockIdentifierService()` 추가 + `verify-ssot/SKILL.md` Step 44 mock 등록 grep | 수정 2 | 15m |
| **A5** | `docs/references/identifier-policy.md` 신설 — IdentifierService 도입 트레이드오프 외부화 (≤80 lines) | 신규 1 | 30m |
| **A6** | `apps/backend/.eslintrc.js`에 `node:crypto`/`crypto` `randomUUID` import 차단 + `crypto.randomUUID()` member call 차단 | 수정 1 | 10m |

총 영향: 신규 2 + 수정 3 = **5 파일** (단일 도메인: supply-chain governance 완성)

본 작업은 **새 기능 추가가 아닌 기존 보호막의 누락된 우회 표면을 닫는 작업**.
A6는 verify-ssot Step 44 정적 grep이 잡지 못하는 우회 패턴(`* as crypto`, alias rename, member call)을 ESLint 룰로 이중 방어.
A3는 preinstall 훅이 `--ignore-scripts`로 우회되는 시나리오를 CI 워크플로 단계로 닫음.
A1은 `@Global()` 모듈이 단위 테스트에서 silent DI failure를 일으키는 미래 회귀 표면을 사전에 막음.

---

## MUST (실패 시 루프 차단, 머지 불가)

### M1. 빌드 검증
- `pnpm tsc --noEmit` — backend + frontend 양쪽 0 error
- `pnpm --filter backend exec tsc --noEmit` — 0 error
- `pnpm --filter backend run lint` — A6 새 룰이 작동하면서도 *기존 코드*에서는 violation 0건 (현재 상태 그대로 PASS)
- `pnpm --filter backend run build` — 빌드 성공

### M2. A3 — supply-chain-gate.yml 작동
- 파일 존재: `.github/workflows/supply-chain-gate.yml`
- 트리거: `pull_request` (target `main`) + `push` (`main`)
- Step 1: `node scripts/check-dependabot-drift.mjs` 실행 (offline check) — exit 1 시 fail
- Step 2: `pnpm audit:dependabot` 실행 — non-zero exit 시 fail
- preinstall 훅과 *독립적*으로 실행 (`--ignore-scripts` 우회 방어)
- pnpm setup + Node 버전 일관성: `actions/setup-node@v4`, `pnpm/action-setup@v4`, `package.json` `engines.node`와 일관

### M3. A1 — createMockIdentifierService 헬퍼
- `apps/backend/src/common/testing/mock-providers.ts`에 `createMockIdentifierService()` export 추가
- 반환 형상: `IdentifierService` 4개 메서드(`generateAttachmentId`, `generateMigrationBatchId`, `generateJti`, `generateOpaqueId`) 모두 `jest.fn()` mock
- 기본 반환값은 결정적인 UUID v4 형식 문자열 (테스트에서 stable assertion 가능)
- `verify-ssot/SKILL.md` Step 44 검증 명령에 grep 1건 추가:
  - "spec 파일에서 IdentifierService 주입 후 mock 미등록" 패턴 검출
  - 또는 `createMockIdentifierService` 사용처 grep으로 감지 가능

### M4. A5 — identifier-policy.md
- 파일 존재: `docs/references/identifier-policy.md`
- 분량: ≤80 lines (review-architecture 보고서 명시)
- 필수 섹션:
  1. **왜 IdentifierService인가** (vendor 캡슐화 사유, ulid/nanoid/KSUID 미선택 트레이드오프)
  2. **4개 도메인 헬퍼 명명 규칙** (`generateAttachmentId`/`generateMigrationBatchId`/`generateJti`/`generateOpaqueId`)
  3. **호출처 패턴** (`@Injectable` DI vs plain class 모듈 함수 직접 import)
  4. **예외 영역** (frontend Edge Runtime `proxy.ts`, e2e spec)
  5. **신규 도메인 ID 추가 절차** (도메인 헬퍼 추가 → DI 클래스 메서드 추가 → 호출처 전환)
- `docs/references/skills-index.md` 또는 `CLAUDE.md`에서 참조 가능 (또는 verify-ssot Step 44에서 link)

### M5. A6 — ESLint 이중 가드
- `apps/backend/.eslintrc.js`의 `no-restricted-imports`에 다음 추가:
  - `node:crypto` 모듈에서 `randomUUID` named import 차단
  - `crypto` 모듈(without prefix)에서 `randomUUID` named import 차단
- `no-restricted-syntax`에 다음 추가:
  - `crypto.randomUUID()` member call 차단 (alias rename 우회 패턴 차단)
- `apps/backend/src/common/identifiers/identifier.service.ts`는 예외 (overrides로 룰 비활성화)
- 기존 spec / testing / seed 예외 overrides는 유지

### M6. SSOT 무결성 (Step 44 회귀 0건)
- 본 작업 후에도 raw `uuid` import 0건, raw `randomUUID` import 0건 (identifier.service.ts 외) 유지
- pnpm.overrides caret 잠금 유지
- `node scripts/check-dependabot-drift.mjs` 직접 실행 PASS

---

## SHOULD (실패 시 tech-debt-tracker 등재, 루프 차단 안 함)

### S1. CI workflow 모범 패턴
- `concurrency` 그룹 사용으로 PR 재푸시 시 이전 run cancel
- `permissions: contents: read` 최소 권한
- `timeout-minutes` 명시 (10분 이내 권장)

### S2. ESLint 메시지 quality
- 차단 메시지에 권장 SSOT 경로(`@/common/identifiers/identifier.service`) 명시
- 우회 시도 detect 시 메시지에 verify-ssot Step 44 참조

### S3. 문서 cross-reference
- `docs/references/skills-index.md` 또는 `verify-ssot/SKILL.md` Step 44에서 `identifier-policy.md` link
- `backend-patterns.md`에 SSOT 진입점 한 줄 언급 (선택)

### S4. mock 헬퍼 사용 예시
- `mock-providers.ts` 헬퍼 파일에 JSDoc 1줄로 사용 위치 hint
- spec 작성 시 `{ provide: IdentifierService, useValue: createMockIdentifierService() }` 패턴

---

## NON-GOALS (본 세션 작업 외 — 다음 sprint)

| 항목 | 트리거 |
|---|---|
| `.github/dependabot.yml` 정책 (versioning-strategy) | dependabot 첫 PR이 preinstall guard에 의해 install 실패 시 |
| `file-upload.service.spec.ts` 신설 | 별도 sprint (보안·magic-bytes·SHA-256 critical path) |
| `form-template.service.spec.ts` 신설 | 별도 sprint |
| `identifier.service.spec.ts` negative test (`randomUUID` mock 실패 케이스) | identifier.service 변경 PR |
| frontend ID 헬퍼 격상 (`packages/shared-constants` or `apps/frontend/lib/identifiers/`) | frontend 첫 도메인 ID 호출처 등장 |
| bundle-size baseline 갱신 | frontend가 SSOT 격상 헬퍼 import 시점 |

---

## 검증 명령 (Generator + Evaluator 공통)

```bash
# A3 — workflow file 존재 + 구문 유효
test -f .github/workflows/supply-chain-gate.yml
node -e "require('js-yaml')" 2>/dev/null && \
  node -e "const yaml=require('js-yaml');const fs=require('fs');yaml.load(fs.readFileSync('.github/workflows/supply-chain-gate.yml','utf8'))"
# (yaml 파서 없으면 GitHub Actions가 자체 검증)

# A1 — mock 헬퍼 export
grep -q "createMockIdentifierService" apps/backend/src/common/testing/mock-providers.ts
# Step 44 mock grep 추가 검증
grep -q "createMockIdentifierService\|IdentifierService.*mock" .claude/skills/verify-ssot/SKILL.md

# A5 — docs 파일 존재 + 분량
test -f docs/references/identifier-policy.md
[ "$(wc -l < docs/references/identifier-policy.md)" -le 80 ]

# A6 — ESLint 룰 추가 + 기존 통과
grep -q "node:crypto" apps/backend/.eslintrc.js
grep -q "randomUUID" apps/backend/.eslintrc.js
pnpm --filter backend run lint

# M6 — Step 44 SSOT 회귀 0
! grep -rn "from ['\"]uuid['\"]" apps/backend/src/ 2>/dev/null
! grep -rn "import .* from 'node:crypto'.*randomUUID" apps/backend/src/ 2>/dev/null \
  | grep -v 'common/identifiers/identifier\.service\.ts\|\.spec\.ts'

# 빌드
pnpm --filter backend exec tsc --noEmit
pnpm --filter backend run build

# preinstall guard 동작 확인
node scripts/check-dependabot-drift.mjs

# A6 — uuid alias rename 우회 패턴이 lint에서 잡히는지 (시뮬레이션, 실제로는 작성 안 함)
# 예: const { randomUUID: rid } = require('node:crypto');  → no-restricted-imports에서 차단
# 예: import * as crypto from 'crypto'; crypto.randomUUID();  → no-restricted-syntax에서 차단
```

---

## Iteration 추적

| iter | timestamp | result | issue summary |
|---|---|---|---|
| 1 | (대기) | - | - |

---

## Evaluator 평가 항목 (Mode 1 표준)

1. M1~M6 MUST 항목 1:1 대조 (PASS/FAIL)
2. SHOULD 항목 → tech-debt 등재 후보
3. verify-ssot Step 44 회귀 검증 (`node scripts/check-dependabot-drift.mjs` + grep)
4. verify-implementation 4 스킬 (ssot/security/hardcoding/implementation) 동작 확인
5. ESLint 신규 룰이 *기존* 코드에서 false positive 없는지 (lint exit 0)
6. 본 작업 외 dirty 파일 *건드림 0건* 확인 (다른 세션 격리 유지)

---

## 결과 분류

| MUST | SHOULD | Verdict |
|---|---|---|
| 모두 PASS | 모두 PASS | PASS — PR 가능 |
| 모두 PASS | 일부 FAIL | PASS + tech-debt 등재 |
| 1건 이상 FAIL | - | FAIL → fix loop (max 3 iter) |
