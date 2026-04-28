# 의존성 공급망 강화 (Dependency Supply-Chain Hardening) 구현 계획

## 메타
- 생성: 2026-04-30
- 모드: Mode 2 (시스템 통합 / 아키텍처 수준)
- 작업 slug: `deps-supply-chain-hardening`
- 예상 변경: 8~12개 파일 (root package.json, lockfile, 신규 SSOT 헬퍼 3개, 직접 사용처 2건, scripts 1~2건, verify 스킬 1건, manage-skills 인덱스, skills-index)
- 차단 의존: 없음 (main 직접 작업, pre-push hook 게이트)

## 사용자 요구 (정확한 인용)
> "누락된 부분없이 타협한 부분없이 업계표준의 방식으로 모든 이슈사항을 시니어 웹개발 전문가로서 문제를 해결함에 있어 현재 문제를 단편적으로 임시방편으로 해결하는게 아니라 아키택처 수준에서 시스템 전반의 개선이 이루어질수있도록 SSOT를 준수하면서, 하드코딩하지않고, 워크플로우와 성능을 고려하면서 개발을 진행해줘."

## 적용 메모리 룰
- **[의존성 major bump은 tsc 실측]** — uuid v9→v14 5단계 bump, changelog 예측 금지, 실측 기반 결정
- **[pnpm overrides는 caret으로 라인 잠금]** — `>=` 9건 → `^` 통일 (메이저 통합 hoist 위험 제거)
- **[Dependabot 알림은 lockfile 실체부터]** — 패치 전 `pnpm audit:dependabot`으로 REAL/FALSE_POSITIVE 분류
- **[Main 직접 작업, 브랜치 금지]** — main에 단계 커밋, pre-push hook 통과
- **[시니어 아키텍처 수준 계획]** — Phase별 SSOT/비하드코딩/워크플로/성능/보안 영향 명시
- **[디자인 리뷰 기반 플랜은 AP 전체 + 전 영역]** — 종합성 원칙: 관측/rollback/feature-flag/bundle-size 모두 명시

## 설계 철학
의존성 패치 4건을 "버전만 올리는 임시방편"이 아니라 **공급망 전반의 회귀 차단 시스템**으로 격상한다. uuid는 도메인 의미 헬퍼 뒤로 캡슐화하여 향후 ulid/nanoid/`crypto.randomUUID()` 전환 비용을 0으로 만들고(SSOT), overrides 정책은 caret 일관성과 자동 drift guard로 보호한다. "현재 알림 4건 끄기"는 부산물이지 목표가 아니다.

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| uuid SSOT 헬퍼 위치 | `apps/backend/src/common/identifiers/identifier.service.ts` (신규 모듈) | 현재 사용처 2건 모두 backend 도메인(파일 업로드, 데이터 마이그레이션). frontend는 NextAuth `randomUUID`/Web Crypto 사용 중이라 공유 불필요. `packages/shared-constants`는 domain-agnostic 상수 영역이라 부적절. backend common module이 의존성 그래프상 모든 feature module의 부모라 적합. NestJS DI 친화 (`@Injectable()` provider). |
| uuid 헬퍼 명명 | 도메인 의도 함수 `generateAttachmentId()`, `generateMigrationBatchId()`, `generateOpaqueId()` | 호출처에서 "왜 이 ID가 필요한지"가 드러나도록 — purpose 타입 체인 SSOT 교훈과 동일 패턴. raw `uuid()` 노출은 캡슐화 누수. |
| uuid 백엔드 알고리즘 | **`crypto.randomUUID()` (Node 14.17+ 빌트인)** — uuid 패키지 의존성 **제거** | (a) Node 20.18+ 엔진 강제 (root package.json `engines.node`). (b) RFC 4122 v4 동등 출력. (c) 의존성 0건 추가, 공급망 surface 감소. (d) uuid v14 ESM-only 호환 risk + 5단계 메이저 bump 학습비용 제거. (e) Dependabot #200/#202 alert 영구 폐쇄 (suppression 불필요). 메모리 룰 [의존성 major bump은 tsc 실측]에 의해 빌드 후 `node -e` 실측으로 출력 형식(36자 hex+dash) 동등성 검증. |
| 헬퍼 wrapper 통과 비용 | V8 inline 가능한 1라인 함수 | `function generateAttachmentId() { return randomUUID(); }`은 V8 hot path에서 inline됨. 측정 무의미하나 회귀 시 jest microbenchmark로 sanity check (Phase B 검증 명령). |
| overrides caret 변환 정책 | 모든 `>=` → `^` 단, lockfile 현재 설치 버전 기준 보수적 caret 결정 | 예: `tar: '>=7.5.7'` 현재 lockfile에 7.5.7 → `'^7.5.7'`. 7.4.x 호환 잃지만 supply-chain 시그널상 우상향 고정이 안전. lockfile diff 400줄 이하 목표 (Phase E MUST 측정값). |
| postcss 보강 위치 | root `pnpm.overrides`에 `postcss: '^8.5.10'` 추가 | postcss는 frontend/Tailwind 빌드 도구, devDependencies 간접 의존. overrides가 lockfile 통합 강제. caret으로 8.6.x bump 시 회귀 차단 + 보안 패치는 흡수. |
| Dependabot drift guard | 신규 `scripts/check-dependabot-drift.mjs` (preinstall에 추가) | 기존 `audit-dependabot.mjs`는 manual 실행. `>=` 잔존 + override 누락을 install 시점에 차단해야 회귀 0. offline 모드 (gh 미가용 시): override `>=` 패턴만 검사 (네트워크 의존도 0으로 폴백). |
| verify 스킬 배치 | 기존 `verify-ssot` SKILL.md에 **Step 추가** (신규 스킬 X) | 새 스킬은 인덱스 비대화. supply-chain은 SSOT 위반의 일종 (raw uuid import = vendor lock-in 누수). manage-skills SKILL.md 인덱스 1건 갱신만 필요. |
| Fallback 트리 (uuid v14 도입 시도하는 경우) | **Plan A 채택**으로 fallback 트리 자체 삭제 | 결정에 따라 uuid 패키지 자체를 제거하므로 ESM 호환성 risk 무관. 만약 외부 의존성(예: `@aws-sdk/*`)이 uuid를 간접 사용하면 그 패키지의 자체 dep로 격리되어 우리 코드와 무관 (lockfile transitive로 처리). |

## 사전 측정 (Pre-flight) — Generator가 실행

```bash
# 1) 직접 사용처 전수 grep (apps/, packages/, scripts/)
grep -rn "from 'uuid'" apps/ packages/ scripts/ 2>/dev/null
grep -rn 'from "uuid"' apps/ packages/ scripts/ 2>/dev/null
grep -rn "require('uuid')" apps/ packages/ scripts/ 2>/dev/null

# 2) 간접 사용처 (transitive — lockfile 기준)
grep -A1 "^[a-z @'-]*uuid@" pnpm-lock.yaml | head -40

# 3) 현재 lockfile postcss / fast-xml-parser / uuid 설치 버전 확인
grep -E "^[a-z'@/-]*(postcss|fast-xml-parser|uuid)@" pnpm-lock.yaml | sort -u

# 4) backend tsconfig module 모드 확인
grep '"module"' apps/backend/tsconfig.json

# 5) Node 엔진 강제 확인
grep -A2 '"engines"' package.json

# 6) Dependabot REAL alerts 분류
pnpm audit:dependabot

# 7) crypto.randomUUID() 출력 형식 사전 검증 (Phase A 결정 근거)
node -e "console.log(crypto.randomUUID(), crypto.randomUUID().length)"
# 기대: 36자, RFC 4122 v4 형식 (8-4-4-4-12)
```

**Generator는 위 7개 명령 결과를 의사결정 로그에 기록 후 Phase A 진입.**

## 구현 Phase

---

### Phase A: ID 생성 SSOT 모듈 신설 (vendor 캡슐화)

**목표:** 모든 도메인 ID 생성 호출이 단일 모듈을 경유하도록 만들어 향후 알고리즘 전환 비용을 O(1)로 만든다.

**SSOT 영향:** 신규 SSOT 진입점. raw uuid/randomUUID import 금지 룰 신설.
**비하드코딩 영향:** 도메인별 prefix/형식 패턴 (예: `att-{uuid}`)은 헬퍼 내부에 격리 — 호출처 인라인 금지.
**워크플로 영향:** 없음 (내부 리팩토링).
**성능 영향:** V8 inline 가능 wrapper. microbenchmark 100k iter 차이 < 5% 목표.
**보안 영향:** `crypto.randomUUID()`는 CSPRNG (RFC 4122 v4). uuid v9 동일 보안 등급.

**변경 파일:**
1. `apps/backend/src/common/identifiers/identifier.service.ts` — **신규**. NestJS `@Injectable()` provider. exports: `generateAttachmentId()`, `generateMigrationBatchId()`, `generateOpaqueId(prefix?: string)`. 내부적으로 `node:crypto.randomUUID()` 호출. JSDoc에 "raw uuid 직접 import 금지, 본 모듈 경유" 명시.
2. `apps/backend/src/common/identifiers/identifier.module.ts` — **신규**. `@Module({ providers: [IdentifierService], exports: [IdentifierService] })`. global module로 등록(`@Global()`)하여 모든 feature module에서 주입 가능.
3. `apps/backend/src/common/common.module.ts` (또는 `app.module.ts` 레벨) — **수정**. IdentifierModule import 추가.
4. `apps/backend/src/common/identifiers/identifier.service.spec.ts` — **신규**. 단위 테스트 ≥ 5 케이스: (a) 36자 길이, (b) v4 형식 정규식 매칭, (c) 100회 호출 시 중복 0, (d) prefix 옵션 동작, (e) 빈 prefix 시 raw UUID.

**검증:**
```bash
pnpm --filter backend run test -- identifier.service.spec
pnpm --filter backend run type-check
# 출력 형식 sanity check
pnpm --filter backend run build && node -e "const {randomUUID} = require('crypto'); const r = randomUUID(); console.assert(r.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(r), 'v4 format'); console.log('OK', r);"
```

---

### Phase B: uuid 직접 사용처 헬퍼 전환

**목표:** `apps/backend` 내 모든 raw uuid 호출을 SSOT 헬퍼로 교체. uuid 패키지 의존성을 코드 레벨에서 0으로 만든다.

**SSOT 영향:** Phase A 헬퍼가 유일한 ID 진입점이 됨. 회귀 방지는 Phase G verify-ssot Step.
**비하드코딩 영향:** 파일명 패턴 `${uuid}${ext}`은 file-upload 내부 동작이지 호출자 책임 아님 — 그대로 유지.
**워크플로 영향:** **호환성 보장 필수**. 현재 file-upload는 36자 hex UUID로 파일 키 생성 (예: `equipment/abcd1234-...-ext.pdf`). 헬퍼도 동일 형식 반환하므로 기존 저장된 파일 키와 100% 호환. DB의 `documents.file_path` 기존 레코드 마이그레이션 불필요.
**성능 영향:** 함수 호출 1단 추가 — 무시 가능. file-upload는 I/O bound, ID 생성은 < 1μs.
**보안 영향:** 없음 (동일 CSPRNG).

**변경 파일:**
1. `apps/backend/src/common/file-upload/file-upload.service.ts:10,149` — **수정**. `import { v4 as uuidv4 } from 'uuid'` 삭제. constructor에 `IdentifierService` 주입. `uuidv4()` → `this.identifiers.generateAttachmentId()`.
2. `apps/backend/src/modules/data-migration/services/data-migration.service.ts:11` — **수정**. 동일 패턴. 호출처 grep으로 모두 찾아 변경 (Pre-flight Step 1 결과 기반). `uuidv4()` → `this.identifiers.generateMigrationBatchId()` 또는 `generateOpaqueId('mig')`.
3. `apps/backend/package.json:78` — **수정**. `"uuid": "^9.0.1"` 제거. 동시에 `@types/uuid`도 devDeps에 있는지 확인 후 제거 (없을 수 있음).
4. (조건부) 기존 file-upload.service.spec.ts / data-migration.service.spec.ts — **수정**. mock 전환. `IdentifierService` mock 객체 (`{ generateAttachmentId: jest.fn(() => 'test-uuid-1234') }`) 주입.

**검증:**
```bash
# 1) raw uuid import 0건 확인 (Phase G 회귀 가드와 동일 명령)
! grep -rn "from 'uuid'" apps/backend/src/ && ! grep -rn 'from "uuid"' apps/backend/src/
# 2) 빌드 + 테스트
pnpm --filter backend run type-check
pnpm --filter backend run build
pnpm --filter backend run test
# 3) 기존 file-upload 테스트가 통과하면 호환성 보장 (S3 키 형식 회귀 0)
pnpm --filter backend run test -- file-upload
pnpm --filter backend run test -- data-migration
```

---

### Phase C: uuid 패키지 의존성 제거 + lockfile 정리

**목표:** Dependabot #200, #202 (uuid v9 alerts) 영구 close. 공급망 surface 1건 감소.

**SSOT 영향:** uuid 패키지 자체가 lockfile에서 제거되거나(직접 의존이 사라지면 transitive로만 잔존) 잔존 시 `@aws-sdk/*` 등 외부 패키지의 격리된 dep로 격하. **우리 코드 surface는 0**.
**비하드코딩 영향:** 없음.
**워크플로 영향:** lockfile 변경 (uuid@9.0.1 entry 삭제 또는 hoist 해제). pre-push hook tsc/test 통과.
**성능 영향:** node_modules 사이즈 ~30KB 감소 (무시 가능). bundle은 backend라 무관.
**보안 영향:** **GHSA #200, #202 영구 close**. uuid v14 메이저 bump 학습/회귀 risk 제로.

**변경 파일:**
1. `pnpm-lock.yaml` — **자동 갱신** (`pnpm install` 결과). 직접 편집 금지.
2. `apps/backend/package.json` — Phase B 4번에서 이미 처리 (`uuid: "^9.0.1"` 제거).

**검증:**
```bash
pnpm install
# uuid 직접 의존 0건 (transitive만 허용)
pnpm why uuid 2>&1 | grep -E "^(backend|frontend)" && echo "FAIL: uuid still referenced" || echo "PASS"
# Dependabot 재분류 (REAL → FALSE_POSITIVE 또는 close)
pnpm audit:dependabot
# 전체 검증
pnpm tsc --noEmit
pnpm --filter backend run test:cov
pnpm --filter frontend run test
```

**Roll-back 트리:** 만약 transitive uuid 잔존 + Dependabot이 여전히 alert → `pnpm.overrides`에 `uuid: '^11.0.0'` 추가 (transitive 강제 bump, 우리 코드 무관하므로 ESM/CJS risk 격리). 11.x는 default export 유지 + Node 18+ 호환으로 가장 안전.

---

### Phase D: postcss + fast-xml-parser overrides 패치 + caret 잠금

**목표:** Dependabot #201 (fast-xml-parser), #203 (postcss) close. 메모리 룰 [pnpm overrides는 caret으로 라인 잠금] 부분 적용.

**SSOT 영향:** root `pnpm.overrides`가 의존성 강제 정책의 SSOT.
**비하드코딩 영향:** caret prefix는 SemVer 표준, 하드코딩 아님.
**워크플로 영향:** lockfile 갱신, 빌드/테스트 회귀 검증.
**성능 영향:** postcss 8.4.31 → 8.5.10 보안 패치 + 미세 성능 개선. fast-xml-parser 5.5.10 → 5.7.0 동일.
**보안 영향:** GHSA #201, #203 close.

**변경 파일:**
1. `package.json` (root, line 67-99 `pnpm.overrides`) — **수정**.
   - 신규 추가: `"postcss": "^8.5.10"`
   - 변경: `"fast-xml-parser": ">=5.3.6"` → `"fast-xml-parser": "^5.7.0"`
2. `pnpm-lock.yaml` — 자동 갱신.

**검증:**
```bash
pnpm install
# 설치 버전 확인
grep -E "^[a-z'@/-]*(postcss|fast-xml-parser)@" pnpm-lock.yaml | sort -u
# 기대: postcss@8.5.10+, fast-xml-parser@5.7.0+
pnpm tsc --noEmit
pnpm --filter frontend run build  # postcss는 frontend Tailwind 빌드에 영향
pnpm --filter backend run build   # fast-xml-parser는 transitive, smoke
pnpm audit:dependabot              # #201, #203 → REAL=0
```

---

### Phase E: pnpm.overrides 전체 audit — `>=` → `^` 통일 (시스템 전반 개선)

**목표:** overrides 9건 (`jws`, `node-forge`, `qs`, `tar-fs`, `form-data`, `validator`, `@isaacs/brace-expansion`, `multer`, `tar`, `follow-redirects`) 의 `>=` 패턴을 모두 caret으로 통일. 메이저 통합 hoist risk 영구 제거.

**SSOT 영향:** overrides 정책 일관성. Phase F의 drift guard가 이 정책을 강제.
**비하드코딩 영향:** caret 버전은 lockfile 측정값 기반 (Pre-flight Step 3 결과) — 추측 금지.
**워크플로 영향:** lockfile 변경 라인 수 측정 필수 (목표 ≤ 400). 변경량 초과 시 부분 적용 + 분리 커밋.
**성능 영향:** 없음 (런타임 동일).
**보안 영향:** **메이저 통합 차단** — 예: `tar: '>=7.5.7'`이 우연히 8.0.0 메이저 bump되어 호환성 깨지는 사고 방지.

**변경 파일:**
1. `package.json` (root, line 69-97) — **수정**. 다음 매핑 적용 (각 패키지의 lockfile 현재 설치 버전 기준 보수적 caret):

   | 현재 (>=) | 변경 (^) | 측정 근거 |
   |---|---|---|
   | `jws: '>=3.2.3'` | `'^3.2.3'` (또는 lockfile 실측 maj.min) | Generator는 `pnpm-lock.yaml`에서 jws 설치 버전 확인 후 결정 |
   | `node-forge: '>=1.4.0'` | `'^1.4.0'` (lockfile 실측) | 동일 |
   | `qs: '>=6.14.1'` | `'^6.14.1'` | 동일 |
   | `tar-fs: '>=2.1.4'` | `'^2.1.4'` (또는 ^3.x 등) | 동일 — 메이저 통합 위험 시 보수적 |
   | `form-data: '>=4.0.4'` | `'^4.0.4'` | 동일 |
   | `validator: '>=13.15.22'` | `'^13.15.22'` | 동일 |
   | `@isaacs/brace-expansion: '>=5.0.1'` | `'^5.0.1'` | 동일 |
   | `multer: '>=2.1.0'` | `'^2.1.0'` | 동일 |
   | `tar: '>=7.5.7'` | `'^7.5.7'` | 동일 |
   | `follow-redirects: '>=1.16.0'` | `'^1.16.0'` | 동일 |

2. `pnpm-lock.yaml` — 자동 갱신.

**검증:**
```bash
# 1) >= 패턴 0건
! grep -E '"[^"]+": ">=' package.json
# 2) lockfile diff 라인 수 측정
git diff pnpm-lock.yaml | wc -l
# 목표: ≤ 400 lines (400 초과 시 부분 적용)
# 3) 전체 회귀
pnpm tsc --noEmit
pnpm --filter backend run test:cov  # CI 동등 (메모리 룰 [pnpm overrides는 caret으로 라인 잠금])
pnpm --filter frontend run test
pnpm --filter backend run build
pnpm --filter frontend run build
```

**Roll-back 트리:** lockfile diff > 400 lines 또는 회귀 발생 시 `git checkout pnpm-lock.yaml package.json` 후 1건씩 단계적 적용.

---

### Phase F: preinstall guard 확장 — Dependabot drift 검사 (CI 강화)

**목표:** install 시점에 (a) overrides의 `>=` 잔존, (b) Dependabot REAL alerts vs overrides 매트릭스 mismatch를 자동 차단. 회귀 0건 보장.

**SSOT 영향:** overrides 정책 enforcement의 SSOT (CI/local 동등).
**비하드코딩 영향:** GitHub repo URL은 git remote에서 동적 추출 (기존 `audit-dependabot.mjs` 패턴 재사용).
**워크플로 영향:** `pnpm install`마다 빠른 검사 추가 (≤ 1초). 네트워크 호출은 offline-first (`gh` 미가용 시 lockfile-only 검사).
**성능 영향:** install 시간 +0.5~1초. 무시 가능.
**보안 영향:** 회귀 차단 자동화 — 사람의 망각 의존도 0.

**변경 파일:**
1. `scripts/check-dependabot-drift.mjs` — **신규**. 검사 항목:
   - **검사 1 (offline, 항상 실행):** root `package.json`의 `pnpm.overrides` 모든 entry가 `^` 또는 정확한 버전 (`x.y.z`)인지. `>=`/`>` 발견 시 exit 1.
   - **검사 2 (online, gh 가용 시):** `gh api dependabot/alerts` 호출 → REAL severity ≥ moderate alert 중 overrides에 미반영된 패키지 탐지. mismatch 발견 시 경고 (exit 0, log only — install은 차단하지 않음, 차단은 검사 1만).
   - **fallback:** `gh` 부재 또는 인증 실패 시 검사 2 스킵, 검사 1만 실행.
2. `package.json` (root) `scripts.preinstall` — **수정**. 현재 `npx only-allow pnpm && node ./scripts/check-no-stale-lockfiles.mjs` → `npx only-allow pnpm && node ./scripts/check-no-stale-lockfiles.mjs && node ./scripts/check-dependabot-drift.mjs`.

**검증:**
```bash
# 1) 정상 케이스 (Phase E 적용 후 >= 0건)
node ./scripts/check-dependabot-drift.mjs
# exit 0 기대
# 2) 회귀 시뮬레이션 (의도적 >= 1건 추가)
sed -i 's/"^4.0.4"/">=4.0.4"/' package.json
node ./scripts/check-dependabot-drift.mjs
# exit 1 기대 + "form-data: >= pattern detected" 메시지
git checkout package.json
# 3) preinstall 통합 검증
pnpm install --offline 2>&1 | grep "preinstall"
```

---

### Phase G: verify-ssot 스킬 Step 추가 — supply-chain 회귀 차단

**목표:** verify-ssot 자동 실행 (`/verify-implementation` orchestrator)에서 raw uuid import 0건 + overrides `>=` 0건을 검증.

**SSOT 영향:** verify 스킬 인덱스 1건 갱신.
**비하드코딩 영향:** 검사 룰은 정규식 패턴이 아니라 문법 패턴 매칭 (false positive 최소화).
**워크플로 영향:** harness Mode 1/2 평가 시 자동 검증.
**성능 영향:** verify 실행 시간 +1~2초.
**보안 영향:** 회귀 차단 + harness 평가 자동화.

**변경 파일:**
1. `.claude/skills/verify-ssot/SKILL.md` — **수정**. 신규 Step 추가 (Step 44):
   - **Step 44: Supply-Chain SSOT 검증**
     - 검사 1: `apps/**/src/**/*.ts`에서 `from 'uuid'` 또는 `from "uuid"` 또는 `require('uuid')` 패턴 0건. 발견 시 FAIL — `IdentifierService` 경유로 수정 지시.
     - 검사 2: root `package.json` `pnpm.overrides`의 모든 값이 `^x.y.z` 또는 `x.y.z` 형식. `>=`/`>`/`*`/`latest` 발견 시 FAIL.
     - 검사 3: `apps/backend/src/common/identifiers/identifier.service.ts` 존재 확인. 부재 시 FAIL.
2. `.claude/skills/manage-skills/SKILL.md` — **수정**. verify-ssot 인덱스 라인에 "Step 44: Supply-Chain SSOT 검증 추가 (2026-04-30)" 메모.
3. `docs/references/skills-index.md` — **수정**. verify-ssot 한 줄 요약에 supply-chain 검사 명시.

**검증:**
```bash
# 회귀 시뮬레이션:
echo "import { v4 } from 'uuid';" > apps/backend/src/regression-test.ts
# verify-ssot Step 44 실행 → FAIL 기대
rm apps/backend/src/regression-test.ts
# 정상 시 PASS
```

---

## 전체 변경 파일 요약

### 신규 생성
| 파일 | 목적 |
|---|---|
| `apps/backend/src/common/identifiers/identifier.service.ts` | ID 생성 SSOT 헬퍼 (Phase A) |
| `apps/backend/src/common/identifiers/identifier.module.ts` | NestJS Global Module (Phase A) |
| `apps/backend/src/common/identifiers/identifier.service.spec.ts` | 단위 테스트 5+ 케이스 (Phase A) |
| `scripts/check-dependabot-drift.mjs` | preinstall drift guard (Phase F) |

### 수정
| 파일 | 변경 의도 |
|---|---|
| `apps/backend/src/common/file-upload/file-upload.service.ts` | uuid 직접 호출 → IdentifierService 주입 (Phase B) |
| `apps/backend/src/modules/data-migration/services/data-migration.service.ts` | 동일 (Phase B) |
| `apps/backend/src/common/common.module.ts` 또는 `app.module.ts` | IdentifierModule import (Phase A) |
| `apps/backend/package.json` | `uuid` 의존성 제거 (Phase B/C) |
| `package.json` (root) | overrides에 postcss 추가, fast-xml-parser caret, `>=` 9건 → `^` 통일 (Phase D, E), preinstall 확장 (Phase F) |
| `pnpm-lock.yaml` | 자동 갱신 (Phase B~E) |
| `.claude/skills/verify-ssot/SKILL.md` | Step 44 추가 (Phase G) |
| `.claude/skills/manage-skills/SKILL.md` | 인덱스 갱신 (Phase G) |
| `docs/references/skills-index.md` | verify-ssot 요약 갱신 (Phase G) |
| 기존 spec 파일 (file-upload, data-migration) | mock 전환 (Phase B) |

---

## 횡단 영역 (시니어 종합 플랜 요건)

### bundle-size 영향
- postcss / fast-xml-parser: **frontend 빌드 도구 측면**. 런타임 번들 미포함 (devDependency 또는 transitive). bundle-size 회귀 0 예상.
- uuid 제거: **backend only**. frontend bundle 무관.
- 검증: Phase D 완료 후 `pnpm measure:bundle` baseline 비교 — 변동 ≤ ±2% 목표.

### feature-flag
- 본 작업은 라이브러리 레벨 패치라 feature-flag 불필요. SSOT 헬퍼 도입은 기존 호환 형식 유지(36자 v4 UUID)로 dark launch 불요.

### rollback 시나리오
- **Phase A~B 롤백:** `git revert` + `pnpm install`. 헬퍼 모듈 분리 커밋이라 원자적 revert 가능.
- **Phase C 롤백 (uuid 제거 후 외부 패키지 호환 문제 발견 시):** Phase C `Roll-back 트리` 적용 — `pnpm.overrides`에 `uuid: '^11.0.0'` 추가하여 transitive만 갱신.
- **Phase D~E 롤백 (overrides caret 변환 회귀 시):** `git checkout package.json pnpm-lock.yaml` → 1건씩 분리 커밋으로 재적용.
- **Phase F 롤백 (preinstall guard false positive 시):** `package.json scripts.preinstall` 원복 + drift guard 수정.
- **Phase G 롤백:** SKILL.md 변경 단순 revert.

### 관측 (observability)
- 본 작업은 인프라 정합성. 운영 메트릭 영향 없음.
- supply-chain 신호: GitHub Dependabot dashboard에서 open alerts 4 → 0 확인.
- 회귀 신호: `pnpm audit:dependabot` 정기 실행 (수동/CI cron 권고).

### i18n / dark mode / a11y
- **무관** (인프라 작업).

### 테스트 인프라 영향
- 신규 spec 1건 (identifier.service.spec.ts).
- 기존 file-upload/data-migration spec mock 전환 — 회귀 검증 필수.
- pre-push hook (.husky/pre-push)의 backend/frontend test 모두 PASS 필요.

### 보안 (검증 항목)
- `crypto.randomUUID()` 사용 검증: Node 20.18+ 보장 (root `engines.node`). v4 UUID CSPRNG.
- 파일 키 충돌 risk: 36자 v4 UUID는 2^122 공간. 1억 회 생성 시 충돌 확률 < 2.7×10^-19. 충분.
- ID 노출 risk 변화 없음 (헬퍼 wrapper만, 알고리즘 동일 보안 등급).

### 워크플로 영향
- 메모리 룰 [Main 직접 작업, 브랜치 금지]: main 직접 커밋 7회 (Phase A~G 각 1커밋 권장).
- pre-push hook 게이트: tsc + backend/frontend test 통과 필수.
- 메모리 룰 [디자인 리뷰 기반 플랜은 AP 전체 + 전 영역]: 본 플랜에 관측/rollback/feature-flag/bundle-size/i18n/dark/a11y 모두 명시 완료.

### 성능 (정량 측정)
- ID 생성: V8 inline. `randomUUID()` 약 200ns/call. 헬퍼 wrapper 후 동일 (microbenchmark 검증).
- file-upload는 I/O bound (S3 업로드 수십~수백 ms). ID 생성 비중 < 0.001%.
- pnpm install: drift guard 추가 +0.5~1초.
- 빌드 시간: 변동 없음 예상.

---

## 의사결정 로그

1. **2026-04-30 작성 시점 — uuid v14 도입 vs 제거 결정.** Plan A (제거) 채택. 근거: (a) 메모리 룰 [의존성 major bump은 tsc 실측]에 따라 5단계 메이저 bump는 큰 학습/검증 비용. (b) Node 20.18+ 엔진 강제로 `crypto.randomUUID()` 빌트인 사용 가능. (c) RFC 4122 v4 동등 출력으로 호환성 risk 0. (d) 의존성 surface 1건 영구 감소. (e) Dependabot #200, #202 영구 close.
2. **2026-04-30 — Plan A 채택으로 fallback 트리 단순화.** uuid v14 ESM/CJS 호환 risk 자체가 사라지므로 (a) suppression / (b) crypto 전환 fallback 트리 불필요. 단, transitive uuid 잔존 시 `pnpm.overrides`로 v11 강제 트리 1건 보존 (Phase C Roll-back).
3. **2026-04-30 — verify 스킬은 신규 생성 X, verify-ssot Step 44 추가 O.** 근거: 새 스킬은 인덱스 비대화 + 의미상 supply-chain은 SSOT 위반의 일종 (vendor lock-in 누수). manage-skills SKILL.md 인덱스 1건 갱신만 필요.
4. **2026-04-30 — uuid SSOT 헬퍼 위치는 backend common module.** 근거: 사용처 모두 backend 도메인. frontend는 NextAuth/Web Crypto 별도 사용 중. `packages/shared-constants`는 domain-agnostic 영역이라 부적절. NestJS Global Module로 등록하여 모든 feature에서 주입 가능.
5. **2026-04-30 — overrides caret 변환은 lockfile 실측 기반.** 근거: 메모리 룰 [pnpm overrides는 caret으로 라인 잠금]. Generator가 Pre-flight에서 lockfile 측정 후 보수적 caret 결정. 추측 금지.
6. **2026-04-30 — preinstall drift guard는 offline-first 설계.** 근거: 로컬 dev 환경에 `gh` CLI 없을 수 있음. 검사 1 (override `>=` 0건)은 항상, 검사 2 (Dependabot API)는 가용 시만. install 차단은 검사 1만, 검사 2는 경고 only. False positive 차단.
7. **2026-04-30 — Phase 분리 7개.** 메모리 룰 [시니어 아키텍처 수준 계획] + [디자인 리뷰 기반 플랜은 AP 전체 + 전 영역] 종합성 원칙 적용. 각 Phase는 원자적 커밋 단위 + 독립 rollback 가능.
