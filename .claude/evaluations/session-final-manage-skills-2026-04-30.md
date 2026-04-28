# 본 세션 manage-skills 분석 보고서 (2026-04-30)

분석 일자: 2026-04-30T00:00:00Z
세션 범위: deps-supply-chain-hardening (5 commits, 17 files)

커밋 해시 범위: `0b7c260a` ~ `a2bea6b0`

---

## 변경 파일 목록 (세션 범위)

| 파일 | 분류 |
|---|---|
| `apps/backend/src/common/identifiers/identifier.service.ts` | 신규 — SSOT 헬퍼 |
| `apps/backend/src/common/identifiers/identifier.module.ts` | 신규 — NestJS 전역 모듈 |
| `apps/backend/src/common/identifiers/identifier.service.spec.ts` | 신규 — 단위 테스트 |
| `scripts/check-dependabot-drift.mjs` | 신규 — preinstall drift guard |
| `apps/backend/src/common/file-upload/file-upload.service.ts` | 수정 — raw uuid → IdentifierService |
| `apps/backend/src/modules/data-migration/services/data-migration.service.ts` | 수정 — raw uuid → IdentifierService |
| `apps/backend/src/modules/data-migration/__tests__/data-migration.service.spec.ts` | 수정 — 테스트 mock 갱신 |
| `apps/backend/src/app.module.ts` | 수정 — IdentifierModule 등록 |
| `apps/backend/package.json` | 수정 — uuid devDep 잔존 여부 |
| `package.json` (root) | 수정 — pnpm.overrides caret 잠금 |
| `pnpm-lock.yaml` | 수정 — lockfile 재생성 |
| `.claude/skills/verify-ssot/SKILL.md` | 수정 — Step 42~44 추가 |
| `.claude/skills/manage-skills/SKILL.md` | 수정 — 인덱스 갱신 |
| `docs/references/skills-index.md` | 수정 — 요약 갱신 |
| `.claude/contracts/deps-supply-chain-hardening.md` | 신규 — 계약 문서 |
| `.claude/evaluations/deps-supply-chain-hardening.md` | 신규 — 평가 기록 |
| `.claude/exec-plans/completed/2026-04-30-deps-supply-chain-hardening.md` | 신규 — 구현 계획 아카이브 |

---

## 패턴별 커버리지 분석

### Pattern 1: NestJS DI Class + 모듈 함수 듀얼 진입점 (identifier.service.ts)

- **파일**: `apps/backend/src/common/identifiers/identifier.service.ts`
- **변경 내용**: plain class용 모듈 함수 (`generateAttachmentId`, `generateMigrationBatchId`, `generateJti`, `generateOpaqueId`) + `@Injectable()` 클래스 듀얼 진입점. 내부적으로 클래스 메서드가 모듈 함수를 위임 호출하므로 SSOT 동일성 보장.
- **실측 사용처**:
  - DI 경유: `file-upload.service.ts`, `data-migration.service.ts`, `form-template.service.ts`, `test-auth.controller.ts`
  - 모듈 함수 경유: `one-time-token.service.ts` (`generateJti()` 직접 import — DI 생성자가 없는 plain class 패턴)
- **일반화 가능성**: 높음. 다른 common 유틸(예: `content-disposition.util.ts`)도 동일 패턴 적용 가능. 향후 `@Injectable()` 없는 유틸이 동일 로직을 공유해야 할 때 모듈 함수 진입점이 필요.
- **기존 verify 커버 여부**: verify-ssot Step 44에서 커버됨 (IdentifierService 존재 + raw uuid 0건).
- **gap**: Step 44는 "raw uuid import 0건"을 검사하지만, 모듈 함수 진입점(`generateJti`, `generateAttachmentId`)이 직접 import되는 패턴 자체는 허용 범위 내 SSOT 소비로 명시되지 않음. 오해를 줄이기 위해 예외 조항에 `one-time-token.service.ts` 사례를 명시적으로 추가 권장.
- **판정**: Update verify-ssot Step 44 (예외 조항 보완). 신규 스킬 불필요.

### Pattern 2: Domain ID 헬퍼 명명 규칙 (generateXxxId / generateJti / generateOpaqueId)

- **파일**: `apps/backend/src/common/identifiers/identifier.service.ts`
- **변경 내용**: vendor `uuid.v4()`를 도메인 의도 함수명으로 캡슐화. 호출처에서 "왜 이 ID가 필요한지" 의도가 드러남 (Purpose Type Chain SSOT 교훈과 동일 패턴).
- **일반화 가능성**: 중간. 현재 backend 전용 4개 함수 (attachmentId/migrationBatchId/jti/opaqueId). frontend는 Web Crypto API를 직접 사용 중이며 EquipmentForm은 `temp-${Date.now()}-${Math.random()}` 인라인 패턴.
- **기존 verify 커버 여부**: verify-ssot Step 44 검증 명령 5에서 `identifiers.generateAttachmentId` 사용처 grep으로 부분 커버.
- **gap 1**: `generateTempId()` 패턴 (`EquipmentForm.tsx:504`) — CSPRNG 비사용, UI 임시 키 생성이라 보안 요구 없음. 단, 패턴이 인라인 정의라 코드베이스 분산 위험.
- **gap 2**: frontend에서 향후 도메인 ID(nonce 외) 생성 필요 시 가이드라인 부재.
- **판정**: Defer. frontend ID 헬퍼는 P2 (현재 수요 1건, proxy.ts는 CSP nonce로 보안 범주). `generateTempId` 패턴은 비보안 UI 키라 verify-hardcoding 범주가 아님.

### Pattern 3: pnpm.overrides caret 잠금 SSOT (`>=` 패턴 0건 정책)

- **파일**: `package.json` (root), `scripts/check-dependabot-drift.mjs`
- **변경 내용**: root `pnpm.overrides` 전체 entry를 `^x.y.z` 또는 `x.y.z`로 통일. 기존 `>=` 9건 제거. preinstall guard가 회귀를 설치 시점에 차단.
- **실측 현황**: `package.json` 현재 35개 override entry 모두 `^` caret 또는 `x.y.z` 정확 버전.
- **일반화 가능성**: 높음. `package.json` 수정 시마다 `>=` 재도입 위험.
- **기존 verify 커버 여부**: verify-ssot Step 44 검증 명령 3에서 Node.js 인라인 스크립트로 caret 잠금 검증. preinstall guard도 동일 검사.
- **gap**: verify-ssot Step 44 검증 명령 4 (회귀 시뮬레이션)가 "일시적 `_test_drift` 추가 후 exit 1 확인"이라 CI에서 자동 실행 불가 (수동 확인 의존). CI에서 `node scripts/check-dependabot-drift.mjs` 독립 step 추가 시 완전 자동화 가능.
- **판정**: Update verify-ssot Step 44에 CI 자동화 권고 문구 추가. 신규 스킬 불필요.

### Pattern 4: Preinstall Drift Guard (offline-first + GitHub API 옵셔널)

- **파일**: `scripts/check-dependabot-drift.mjs`, `package.json` preinstall 훅
- **변경 내용**: Check 1 (offline, exit 1 차단) + Check 2 (online gh API, informational only). `--frozen-lockfile` CI에서 preinstall 실행됨 (`--ignore-scripts` 부재 확인: main.yml L84).
- **일반화 가능성**: 중간. 비슷한 가드 패턴이 `check-role-config-sync.mjs`, `check-css-vars.mjs`, `check-no-stale-lockfiles.mjs`에도 적용됨.
- **기존 verify 커버 여부**: verify-ssot Step 29에서 prebuild guard 존재 + `prebuild` 훅 연결을 검증. 동일 패턴이지만 `preinstall` 훅 범주는 Step 29 미포함.
- **gap**: verify-ssot Step 29는 `prebuild` 가드 커버만. `preinstall` 가드 (`check-dependabot-drift.mjs`, `check-no-stale-lockfiles.mjs`)에 대한 검증 step 부재. Step 44의 검증 명령 4에서 부분 커버하지만 preinstall 훅 자체 연결 확인 명령이 없음.
- **판정**: Update verify-ssot Step 44에 preinstall 훅 연결 확인 명령 추가 (P2).

### Pattern 5: Dependabot Dismiss with Accurate Reasons (`not_used` / `inaccurate` / `tolerable_risk`)

- **파일**: (PR/GitHub Dependabot 인터페이스 — 코드베이스 파일 없음)
- **변경 내용**: 4건 alert 처리. uuid #200/#202: `not_used` (IdentifierService로 package 제거). fast-xml-parser #201: `inaccurate` (xml 비사용). postcss #203: `tolerable_risk` (lock 조작 공격 벡터 비해당).
- **일반화 가능성**: 낮음 (GitHub 인터페이스 정책 수준).
- **기존 verify 커버 여부**: verify-security Step 5에서 `pnpm audit + overrides` 수준. Dependabot dismiss justification 표준은 코드베이스 검증 범위 외.
- **gap**: Dependabot dismiss reason 표준화는 `.github/dependabot.yml` 정책 또는 주석 문서 수준에서 관리해야 하나 현재 미수록. 단, 코드 자동화 범주 아님.
- **판정**: Defer. docs/operations/ 에 Dependabot dismiss policy 1페이지 정도 추가 권장 (P3 backlog).

### Pattern 6: verify-ssot Step 42, 43, 44 신설 (세션 내 이미 처리)

- **파일**: `.claude/skills/verify-ssot/SKILL.md`
- **변경 내용**:
  - Step 42: 테스트 파일 hardcoded threshold vs SSOT 토큰 import 강제
  - Step 43: `@deprecated` export alias 외부 소비처 0건 정리
  - Step 44: Supply-Chain SSOT — raw uuid import 금지 + pnpm.overrides caret 잠금
- **커버리지**: 세션 변경의 핵심 패턴을 직접 커버. Step 42~43은 dashboard-redesign 세션 교훈, Step 44는 본 세션 신설.
- **gap**: Step 44 예외 조항에 `proxy.ts crypto.randomUUID()` (Web Crypto API / Edge Runtime)와 `one-time-token.service.ts`의 모듈 함수 직접 import 패턴이 명시되어 있으나, e2e spec (`wf-export-ui-download.spec.ts:127 crypto.randomUUID()`) 예외가 명시되지 않음.
- **판정**: Update verify-ssot Step 44 예외 조항에 e2e spec 허용 명시 (P1).

---

## 잔존 위험 영역 실측

### 위험 1: frontend `proxy.ts:115` `crypto.randomUUID()` 직접 사용

```
apps/frontend/proxy.ts:115: const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
```

- **컨텍스트**: Next.js Edge Runtime (Cloudflare Workers 호환 환경). `crypto`는 `globalThis.crypto` — Web Crypto API, Node.js `node:crypto` 모듈이 아님. import 문 없이 전역 사용.
- **Step 44 예외 조항**: "frontend NextAuth `randomUUID` (Web Crypto API) — backend 도메인과 별개 (현재 frontend는 별도 ID 헬퍼 미보유, 필요 시 별도 SSOT 신설)"로 허용 명시됨.
- **실질적 위험**: Edge Runtime에서 `node:crypto` import 자체가 불가하므로 frontend 전용 헬퍼로 감싸더라도 내부 구현은 `globalThis.crypto.randomUUID()` 동일. CSP nonce 생성은 매 요청마다 필요한 보안 기능으로 별도 SSOT로 격상할 실질적 이점이 없음.
- **결론**: 현 상태 허용. verify-ssot Step 44 예외 조항에 `proxy.ts` CSP nonce 용도 명시만 추가.

### 위험 2: e2e spec `wf-export-ui-download.spec.ts:127` `crypto.randomUUID()`

```
apps/frontend/tests/e2e/workflows/wf-export-ui-download.spec.ts:127:
    name: `WF Export UI QP-18-09 ${crypto.randomUUID()}`,
```

- **컨텍스트**: Playwright Node.js 프로세스에서 실행. `crypto`는 Node 19+ 전역 또는 `globalThis.crypto`. 테스트 데이터 유일성 보장 목적.
- **Step 44 예외**: "단위 테스트 파일" 허용으로 커버되지만 e2e spec 파일 명시 없음.
- **결론**: e2e spec은 도메인 ID SSOT 대상이 아님. 예외 조항에 "e2e spec 파일 — 테스트 데이터 유일성 목적 허용" 추가 필요.

### 위험 3: `packages/*`에서 향후 ID 생성 시 가이드라인 부재

- **현황**: `packages/schemas`, `packages/db`, `packages/shared-constants` 모두 `randomUUID` 사용처 0건 (실측 확인).
- **미래 위험**: packages는 frontend와 backend 양측에서 import. packages 내에서 `randomUUID`가 필요해지면 backend `IdentifierService`를 import할 수 없으므로 새 헬퍼 위치 결정 필요.
- **결론**: 현재 수요 없음. P3 backlog 문서화.

---

## 우선순위별 권고 목록

### P1 (즉시 — 이번 세션 내 처리 권장)

#### P1-1: verify-ssot Step 44 예외 조항 보강

**대상 스킬**: `verify-ssot` SKILL.md  
**근거**: e2e spec `wf-export-ui-download.spec.ts:127 crypto.randomUUID()` 가 Step 44 예외에 명시되지 않아 다음 verify 실행 시 false positive FAIL 가능.  
**조치**: Step 44 예외 조항에 다음 추가:
```
- e2e spec 파일 (`apps/frontend/tests/e2e/**/*.spec.ts`) — 테스트 데이터 유일성 목적의 
  `crypto.randomUUID()` 직접 사용 허용 (도메인 ID 생성 아님)
- `one-time-token.service.ts` — DI 생성자 없는 plain class에서 `generateJti()` 모듈 함수 
  직접 import. SSOT 정의 파일 내 함수 소비이므로 허용 (raw uuid import 아님)
- `apps/frontend/proxy.ts` — Edge Runtime `globalThis.crypto.randomUUID()` CSP nonce 생성. 
  Node.js `node:crypto` import 불가 환경이므로 backend IdentifierService와 별개 도메인으로 허용.
```
**검증**: Step 44 검증 명령 1에서 e2e spec grep 제외 조건 추가 (`grep -v "\.spec\.ts"`).

---

### P2 (다음 세션 — tech-debt-tracker 등록)

#### P2-1: verify-ssot Step 44에 preinstall 훅 연결 확인 명령 추가

**대상 스킬**: `verify-ssot` SKILL.md  
**근거**: Step 44는 `check-dependabot-drift.mjs` 파일 존재 + 내부 로직을 검증하지만, `package.json` preinstall 훅 연결 확인 명령이 없음. preinstall 훅이 제거되면 guard가 무력화.  
**권장 검증 명령 추가**:
```bash
# preinstall 훅에 check-dependabot-drift.mjs 연결 확인
grep '"preinstall"' package.json | grep "check-dependabot-drift.mjs"
# 기대: 1건 (preinstall에 drift guard 포함)
```
**효과**: preinstall 훅 drift 회귀 자동 탐지.

#### P2-2: frontend ID 헬퍼 신설 여부 결정

**근거**: `proxy.ts` CSP nonce용 `crypto.randomUUID()` 1건이 유일한 frontend ID 생성 사용처. 현재 Step 44 예외로 허용됨.  
**트리거**: frontend에서 도메인 의미 ID(첨부파일 임시 키, 낙관적 업데이트용 임시 ID 등)가 2곳 이상 필요해지면 `apps/frontend/lib/utils/identifier.ts` 신설 + verify-ssot Step 44b로 확장.  
**현재 상태**: `EquipmentForm.tsx`의 `generateTempId()`는 UI 임시 키로 CSPRNG 비필요. 보류 적합.  
**조치**: tech-debt-tracker에 "frontend ID 헬퍼 신설 트리거 기준: 도메인 ID 생성 2건 이상" 기록.

#### P2-3: docs/operations/dependabot-dismiss-policy.md 신설

**근거**: Dependabot dismiss reason 표준 (`not_used` / `inaccurate` / `tolerable_risk`)이 구두/커밋 메시지에만 기록되어 신규 작업자 기준 부재.  
**내용**: dismiss reason 3종 정의 + 적용 사례 (본 세션 4건) + 향후 alert 대응 의사결정 트리.  
**파일**: `docs/operations/dependabot-dismiss-policy.md` (1~2 페이지).

#### P2-4: CI workflow에 `node scripts/check-dependabot-drift.mjs` 독립 step 추가

**근거**: 현재 preinstall 훅으로만 실행되어 CI `pnpm install` 실행 여부에 의존. `main.yml`에 독립 step 추가 시 preinstall 우회(`--ignore-scripts`) 시에도 CI 게이트 작동.  
**현황**: `main.yml:84` `pnpm install --frozen-lockfile` — `--ignore-scripts` 없어 preinstall 실행됨. 즉각적 위험 없음이나 명시적 step 추가가 defense-in-depth.  
**조치**: `main.yml`에 `- name: Supply-chain drift check; run: node scripts/check-dependabot-drift.mjs` step 추가 (P2 수준).

---

### P3 (backlog)

#### P3-1: bundle-size measure baseline 갱신

**근거**: `pnpm.overrides`에서 `postcss: '^8.5.10'`, `fast-xml-parser: '^5.7.0'` 업데이트 후 frontend bundle 변동 미측정. S3 SHOULD 기준.  
**조치**: `pnpm measure:bundle` 실행 후 `.claude/metrics/bundle-baseline-2026-04-30.json` 갱신. 변동 ±2% 이내 확인.

#### P3-2: packages/* 향후 ID 생성 가이드라인 문서화

**근거**: 현재 packages/* 에서 randomUUID 사용처 0건이나, 향후 추가 시 `identifier.service.ts` import 불가 (의존성 방향 역행). 미리 정책 문서화.  
**내용**: "packages에서 ID 생성 필요 시 `crypto.randomUUID()` 직접 사용 허용. 단, 도메인 헬퍼 명명 패턴 적용 필수 (generateXxxId 형식)."  
**파일**: `docs/references/identifier-policy.md` 신설 또는 backend-patterns.md에 섹션 추가.

#### P3-3: identifier.service 미크로벤치마크 실측

**근거**: S6 SHOULD 기준. `generateAttachmentId()` wrapper 호출 오버헤드 실측. V8 inline 최적화 검증.  
**조치**: `apps/backend/src/common/identifiers/identifier.service.spec.ts`에 microbenchmark describe 블록 추가.  
**우선순위**: 낮음 — 현재 wrapper 1라인 함수라 V8 inline 확실. 성능 이슈 발생 시 재고.

---

## 요약 테이블

| 우선순위 | 대상 스킬/파일 | 액션 | 근거 |
|---|---|---|---|
| P1 | `verify-ssot` SKILL.md Step 44 | 예외 조항 3건 추가 (e2e spec, one-time-token, proxy.ts 명시) | false positive 탐지 방지 |
| P2 | `verify-ssot` SKILL.md Step 44 | preinstall 훅 연결 확인 명령 추가 | drift guard 회귀 탐지 자동화 |
| P2 | tech-debt-tracker | frontend ID 헬퍼 신설 트리거 기준 기록 | 향후 결정 기준 SSOT |
| P2 | `docs/operations/dependabot-dismiss-policy.md` | 신설 | dismiss reason 표준 문서화 |
| P2 | `.github/workflows/main.yml` | drift guard 독립 step 추가 | defense-in-depth (CI에서 명시적 gate) |
| P3 | `docs/references/identifier-policy.md` | 신설 또는 backend-patterns.md 섹션 추가 | packages/* ID 생성 정책 가이드 |
| P3 | bundle-size baseline | 갱신 | postcss/fast-xml-parser 변경 후 측정 |
| P3 | identifier.service.spec.ts | microbenchmark 추가 | S6 SHOULD 이행 |

---

## CLAUDE.md / SKILL.md 업데이트 필요 여부

### CLAUDE.md

- **변경 필요 없음**. Useful Skills 섹션의 verify-ssot 설명이 "SSOT 임포트 소스 검증"으로 기술되어 Step 44 내용은 SKILL.md에서 확인 가능한 수준. 메인 CLAUDE.md는 개요 수준이라 세부 Step 언급 불필요.

### manage-skills SKILL.md

- **이미 갱신됨** (본 세션에서 Step 44 설명이 스킬 테이블 `verify-ssot` 행에 반영). 스킬 파일 패턴에 `scripts/check-*.mjs`, `package.json`이 추가됨.
- **P1 후속 갱신 필요**: verify-ssot Step 44 예외 조항 보강 시 manage-skills 인덱스 설명 텍스트는 변경 불필요 (예외 조항은 SKILL.md 내부 문제).

### verify-ssot SKILL.md

- **P1 즉시**: Step 44 예외 조항에 e2e spec / one-time-token / proxy.ts 3건 명시 추가.
- **P1 즉시**: Step 44 검증 명령 1에서 `*.spec.ts` 제외 조건 추가:
  ```bash
  ! grep -rn "from ['\"]uuid['\"]" apps/backend/src/ 2>/dev/null
  ! grep -rn "require('uuid')" apps/backend/src/ 2>/dev/null
  # randomUUID 직접 import — IdentifierService 정의 파일과 테스트 파일 제외
  ! grep -rn "from 'node:crypto'.*randomUUID\|from 'crypto'.*randomUUID" apps/backend/src/ 2>/dev/null \
    | grep -v 'common/identifiers/identifier\.service\.ts\|\.spec\.ts'
  # frontend e2e spec은 도메인 ID SSOT 대상 외
  grep -rn "randomUUID" apps/frontend --include="*.ts" --include="*.tsx" \
    | grep -v "spec\|test\|proxy\.ts\|node_modules"
  # 결과: 0건 (proxy.ts와 e2e spec 제외 후 frontend randomUUID 사용처 없어야 함)
  ```
- **P2 다음 세션**: preinstall 훅 연결 확인 명령 추가.

---

## 영향없는 스킬 (skipped)

| 스킬 | 이유 |
|---|---|
| `verify-cas` | CAS 관련 변경 없음 |
| `verify-auth` | JWT 토큰 생성 로직 변경 없음 (jti는 IdentifierService로 캡슐화, guard 로직 미변경) |
| `verify-zod` | DTO 변경 없음 |
| `verify-hardcoding` | 도메인 값 하드코딩 없음. 헬퍼 내부 `randomUUID()` 호출은 알고리즘 선택이지 하드코딩 아님 |
| `verify-frontend-state` | frontend 상태 관리 변경 없음 |
| `verify-nextjs` | Next.js 패턴 변경 없음 |
| `verify-filters` | 필터 로직 변경 없음 |
| `verify-design-tokens` | 디자인 토큰 변경 없음 |
| `verify-i18n` | 번역 키 변경 없음 |
| `verify-sql-safety` | SQL 쿼리 변경 없음 |
| `verify-e2e` | e2e spec 로직 변경 없음. e2e spec 내 `crypto.randomUUID()` 사용은 기존 패턴 |
| `verify-seed-integrity` | seed 데이터 변경 없음 |
| `verify-workflows` | 워크플로우 커버리지 변경 없음 |
| `verify-cache-events` | 캐시/이벤트 아키텍처 변경 없음 |
| `verify-handover-security` | `generateJti()` 사용처 유지. SSOT 경유로 오히려 강화됨. 별도 Step 변경 불필요 |
| `verify-qr-ssot` | QR 관련 변경 없음 |
| `verify-checkout-fsm` | Checkout FSM 변경 없음 |
| `verify-security` | Step 1 (proxy.ts CSP nonce)은 `crypto.randomUUID()` 사용 방식 변경 없음. Step 5 (pnpm audit)는 Step 44 caret 잠금으로 보완됨. 기존 Step 내용 유효 |

---

## 미커버 변경사항 (UNCOVERED)

아래 사항은 verify 스킬로 자동 커버되지 않는 변경이며, 사람이 PR 리뷰 또는 verify-implementation 수동 실행으로 확인 필요:

### UNCOVERED-1: IdentifierModule @Global() 등록 회귀

- **파일**: `apps/backend/src/app.module.ts`
- **위험**: `IdentifierModule`이 `@Global()` 없이 등록되거나 `app.module.ts`에서 제거되면 feature module이 `IdentifierService` 주입 실패 (런타임 에러).
- **현황**: 현재 verify-ssot Step 44 검증 명령 2에서 `@Global` 어노테이션 존재 확인 포함.
- **자동화 수준**: 충분 (검증 명령 2 커버).

### UNCOVERED-2: `apps/backend/package.json` uuid 의존성 잔존

- **파일**: `apps/backend/package.json`
- **현황**: backend 소스에서 uuid import 0건이지만, `package.json` devDependencies에 uuid가 잔존하는지 미확인.
- **판단**: transitive로만 사용되는 경우 Dependabot 재경고 가능. `pnpm --filter backend run build` 정상 + M3 검증으로 실질 위험 없음.
- **권장 확인 명령**:
  ```bash
  grep '"uuid"' apps/backend/package.json
  # 결과: 없음이 이상적 (backend package.json에서 직접 의존성 제거 완료 여부)
  ```

### UNCOVERED-3: scripts/check-no-stale-lockfiles.mjs preinstall 공존

- **파일**: `package.json` preinstall 훅
- **현황**: preinstall이 `npx only-allow pnpm && node ./scripts/check-no-stale-lockfiles.mjs && node ./scripts/check-dependabot-drift.mjs` 3개 명령 체인. 앞 명령 실패 시 drift guard 미실행.
- **위험**: `check-no-stale-lockfiles.mjs` 오작동 시 drift guard가 실행 안 됨. 단, 독립 실패이므로 install 자체 차단됨.
- **판단**: 허용 범위 내. P2 CI step 추가로 defense-in-depth 확보.

---

## 신규 스킬 생성 여부

**신규 스킬 생성 없음**.

본 세션 패턴 5개 모두 기존 스킬 업데이트 또는 Defer로 처리:
- Pattern 1~4: verify-ssot Step 44 확장 (P1, P2)
- Pattern 5: docs/operations 문서화 (P2/P3)

공통 근거:
1. 관련 파일 3개 미만 (신규 스킬 생성 기준: 3+ 관련 파일이 공통 규칙 공유)
2. 모든 패턴이 SSOT 위반의 공급망 변형이므로 verify-ssot 도메인 내
3. 스킬 인덱스 비대화 방지

---

## 완료 체크리스트 (P1 즉시 항목)

- [ ] verify-ssot Step 44 예외 조항 e2e spec 추가
- [ ] verify-ssot Step 44 예외 조항 one-time-token.service.ts 모듈 함수 허용 명시
- [ ] verify-ssot Step 44 예외 조항 proxy.ts CSP nonce 명시 보강
- [ ] verify-ssot Step 44 검증 명령 1에서 `*.spec.ts` 제외 조건 추가
