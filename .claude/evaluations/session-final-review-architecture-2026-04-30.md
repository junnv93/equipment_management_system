# 본 세션 review-architecture 보고서 (2026-04-30 deps-supply-chain-hardening)

생성: 2026-04-30 | scope: 5 commits, 19 files
대상 commits: `0b7c260a`, `0eccdf71`, `6a360128`, `a2bea6b0`, `f4633215`

## 총괄

| 차원 | Verdict | 핵심 발견 |
|---|---|---|
| Cross-module 일관성 | PASS | 4개 `@Injectable` 호출처가 모두 `private readonly identifiers: IdentifierService` 동일 prop 명·패턴. Plain class 진입점은 모듈 함수 분리로 정합. |
| SSOT 진위 | PASS | 같은 파일 내 클래스+모듈 함수 둘 다 `randomUUID()` 단일 호출 — 진짜 SSOT. 향후 알고리즘 전환 1점만 수정. |
| CAS / Cache coherence | PASS | file_path는 36자 v4 UUID 100% 호환. 캐시 키/audit log 영향 없음. |
| Security layers | ATTENTION | `randomUUID()` v4 보안 등급 동등. 단, `--ignore-scripts` 기반 preinstall 우회와 외부 라이브러리 미래 v5/v7 채택 시 justification 회귀 가능성은 가드 미장착. |
| Performance | PASS | 클래스 메서드 1-line 위임 → V8 inline 가능. Hot path overhead 무시 가능. tar-fs 2→3, jws 3→4 hoist는 e2e/unit test로 실측 통과. |
| Testing strategy | ATTENTION | identifier 자체 11 케이스는 사전 가드로 충분. 그러나 `file-upload.service.spec.ts` 자체 부재로 IdentifierService 통합 회귀 가드 0건. form-template도 spec 부재. 도메인 통합은 grep과 e2e에 의존. |
| 단편 vs 시스템 회고 | ATTENTION | deferred 4건 중 2건은 sprint로 이연 적절, 2건(A4 CI gate, A6 identifier-policy docs)은 *지금* 처리가 타당함. |
| Critical 누락 | ATTENTION | `@Global()` 모듈 등록은 e2e jest config에서 정상 작동하지만, `Test.createTestingModule`은 `IdentifierModule`을 자동 import하지 않음 — 향후 새 spec 작성 시 mock 누락 시 NestJS DI 에러 발생 위험. |

## Critical Issues (시니어 아키텍처 결함)

**없음**. 명확한 회귀/설계 결함은 본 세션에서 검출되지 않았습니다. 모든 변경은 SSOT 격상 방향이며 호환성 boundary(36자 v4)도 유지됐습니다.

## Architectural Concerns (시니어 판단 필요)

### A1. `@Global()` 등록 vs unit-test DI 비대칭 (즉시 처리 권고)

`identifier.module.ts:11`이 `@Global()`이므로 런타임/e2e에서는 모든 모듈이 `IdentifierService`를 자동 주입할 수 있습니다. 그러나 `Test.createTestingModule({ providers: [...] })`로 작성하는 단위 테스트는 `@Global()` 모듈을 자동 import하지 않습니다.

**위험**: 향후 다른 `@Injectable` 서비스가 `IdentifierService`를 새로 주입하고 spec을 추가할 때, 작성자가 `@Global()`만 보고 mock을 누락하면 `Nest can't resolve dependencies` 런타임 에러가 발생. 이는 컴파일러가 잡지 못함.

**권고 (즉시)**: `apps/backend/src/common/testing/mock-providers.ts`에 `createMockIdentifierService()` 헬퍼 추가 + verify-ssot Step 44 검증에 "신규 spec이 IdentifierService 의존 시 mock 등록 여부" grep 한 줄 추가.

### A2. Frontend ID 헬퍼 미보유 — packages/shared-constants 격상 결정 보류 (deferred 적절)

verify-ssot Step 44 §예외에 명시: "frontend NextAuth `randomUUID` (Web Crypto API) — backend 도메인과 별개". 의도적 분리로 정당. 그러나 frontend가 향후 client-side id를 도메인 의미로 생성하기 시작하는 순간 (예: 임시 row id, drag-drop reorder key, optimistic update local id), backend SSOT를 답습하면 monorepo 일관성이 깨짐.

**시니어 결정**: deferred 적절. `packages/shared-constants`로 격상은 frontend 첫 호출처가 등장할 때 격상하는 것이 YAGNI. 단 backend 헬퍼 시그니처를 frontend가 답습 가능하도록 의도적으로 zero-NestJS-dependency 모듈 함수가 같이 export되어 있다는 사실은 좋은 설계 결정.

### A3. preinstall guard 우회 가능성 (즉시 처리 권고)

`scripts/check-dependabot-drift.mjs`는 root `package.json`의 `preinstall` 훅에 등록되어 caret 잠금을 강제. 그러나:

1. CI 환경에서 `pnpm install --ignore-scripts`로 호출 시 preinstall이 실행되지 않음. 이 옵션은 supply-chain 공격 방어 목적으로 권장되는 패턴.
2. Dependabot이 만든 PR이 직접 `package.json`을 편집하면 lockfile 재생성 전까지 drift guard가 매치하지 못함.

**시니어 판단**: deferred 4건 중 "CI workflow drift step"이 이 위험을 간접적으로 커버하지만, 분류는 후속 sprint가 아니라 *지금 처리*가 정답. 이유:
- preinstall 우회는 *알려진* 공격 표면이고 mitigation 비용이 GitHub Action workflow 1개 (~30 lines)로 매우 낮음
- 본 세션 작업의 *전체* justification이 supply-chain hardening인데 회귀 차단을 다음 sprint로 미루는 것은 작업 정합성 손실

**권고 (즉시)**: `.github/workflows/supply-chain-gate.yml` 신설 — `node scripts/check-dependabot-drift.mjs` + `pnpm audit:dependabot`을 PR 게이트로. preinstall 우회와 무관하게 PR 머지 직전 검증.

### A4. dependabot.yml 정책 (sprint 적절하지만 트리거 명시 필요)

deferred 4건 중 "dependabot.yml 정책"은 *지금* 처리할 필요는 없지만, 본 세션에서 정한 caret 잠금 정책과 dependabot 자동 PR이 충돌할 수 있음 (dependabot이 `>=` 또는 `~` 범위로 PR 생성 시 preinstall guard에 의해 PR 자체가 install 실패).

**시니어 판단**: 적절. 트리거를 "dependabot 첫 PR 실패 시"로 tech-debt-tracker에 명확히 등재해야 sprint 적절성 유지.

### A5. `identifier-policy docs` (즉시 처리 권고)

deferred 4건 중 "identifier-policy docs"는 신규 코더 입장에서 가장 먼저 마주치는 SSOT 룰. verify-ssot Step 44가 이미 존재하지만 *왜* IdentifierService를 만들었는지의 트레이드오프(ulid/nanoid 미선택 사유)는 코드 주석에만 분산.

**시니어 판단**: docs/references/identifier-policy.md (≤80 lines) 신설 비용이 매우 낮고 SSOT 주장의 외부화 가능. 다음 세션의 신규 코더가 generateOpaqueId를 안 만들고 raw `randomUUID`를 추가할 가능성 차단. 권고: **즉시 처리**.

### A6. ESLint 이중 가드 (즉시 처리 권고)

verify-ssot Step 44 정적 grep만으로 우회 패턴 차단 불완전:
- `import * as crypto from 'crypto'; const id = crypto.randomUUID();` — `* as crypto` 후 멤버 접근은 grep에 안 잡힘
- `const { randomUUID: rid } = require('node:crypto')` — 이름 alias

**완전성을 위한 권고**: ESLint `no-restricted-imports` 규칙으로 `node:crypto` (identifier.service.ts 외) 차단 + `no-restricted-syntax`로 `crypto.randomUUID` member call 차단. verify-ssot Step 44 정적 grep과 *이중* 가드 형태로.

### A7. bundle-size measure (deferred 적절)

backend-only 변경이고 frontend 번들 영향 0. deferred 분류 정당.

## SSOT 진위 검증

`identifier.service.ts:31-60` 모듈 함수 4개와 `identifier.service.ts:65-81` 클래스 메서드 4개가 *동일 파일 내*에서 같은 `randomUUID` (`node:crypto:2`)를 호출. 클래스 메서드는 `return generateAttachmentId();` 같은 1-line 위임만 수행 — V8 inline 가능, 분기 0.

**진짜 SSOT 검증 항목**:
- 알고리즘 전환 시 단일 점 수정: `randomUUID()` 호출 라인 4개 (모두 함수 본문). ulid 도입 시 `import { ulid } from 'ulid'` + 4개 함수 본문 교체 = 4-line diff. 클래스는 변경 불필요. **PASS**.
- Vendor lock-in 누수: 호출처는 `identifiers.generateAttachmentId()` 도메인 의도로만 호출 — `'uuid'` 패키지 또는 `randomUUID` 어휘가 호출처에 노출되지 않음. **PASS**.
- ID 형식 패턴 분산: 36자 v4 형식이 호출처에 나타나는 곳은 `file-upload.service.ts:154` 의 `${uuid}${fileExtension}` 단 1곳. 길이 가정 하드코딩 검출 안 됨. **PASS**.

## Cross-module pattern consistency

| 호출처 | constructor prop 명 | DI 주입 위치 | 일관성 |
|---|---|---|---|
| `file-upload.service.ts:56` | `private readonly identifiers: IdentifierService` | 마지막 위치 (after STORAGE_PROVIDER) | OK |
| `data-migration.service.ts:104` | `private readonly identifiers: IdentifierService` | 마지막 위치 | OK |
| `form-template.service.ts:77` | `private readonly identifiers: IdentifierService` | 마지막 위치 (after CACHE_SERVICE) | OK |
| `test-auth.controller.ts:30` | `private readonly identifiers: IdentifierService` | 마지막 위치 | OK |
| `one-time-token` (plain class) | 모듈 함수 import (DI 우회) | N/A | 정합 |

**Verdict**: 4개 `@Injectable` 호출처는 *완벽한* 일관성. 이는 우연이 아니라 의도된 컨벤션 — review 시 bikeshedding 회피.

**4개 도메인 헬퍼 명명 검토**:
- `generateAttachmentId` — 첨부 파일 자산 (file-upload + form-template 공유, 의미 동일)
- `generateMigrationBatchId` — 데이터 마이그레이션 세션 추적
- `generateJti` — JWT ID 클레임
- `generateOpaqueId(prefix?)` — 도메인 의미 없는 일반 (안전망)

form-template이 `generateAttachmentId` 재사용은 의미상 적절 — 양식 템플릿 파일은 storage key가 첨부 파일과 동일한 lifecycle/형식을 가짐.

## Security Layers

### `node:crypto.randomUUID()` vs `uuid` v9 v4 동등성
둘 다 RFC 4122 v4, 122 bits CSPRNG 엔트로피. **보안 등급 동등**.

### Justification dismiss (#202) 근거 검증
exceljs/node-jose 모두 v4만 사용 — *실측 grep 0건 확인됨*. 외부 패키지 미래 변경 시:
- exceljs는 sheet relationships ID에 v4 사용 — ECMA-376 표준 요구사항이라 v5/v7 강제 전환 가능성 0
- node-jose는 cek ID에 v4 사용 — RFC 7517 표준
- `pnpm.overrides` `uuid: ^11.0.0`으로 transitive 11.x 라인 잠금 — 외부 패키지 의존이 변하더라도 우리 lockfile이 추종하지 않음

**Verdict**: justification dismiss 근거가 단기·장기 모두 견고.

## Performance / Caching

### Hot path latency
- file-upload `saveFile`: I/O bound (multipart + magic-bytes + SHA-256 + storage upload). UUID 생성은 마이크로초 단위. 영향 무시.
- data-migration `previewMultiSheet`: Excel 파싱 + DB 검증 N×M loop가 latency 지배.
- form-template `createFormTemplateVersion`: storage upload 지배.

**클래스 위임 V8 inline**: `return generateAttachmentId();` 1-line, monomorphic call site → V8 TurboFan 인라이닝 후보. 측정해볼 가치는 있으나 측정 비용이 측정 이득보다 큼 → **측정 deferred 적절**.

### pnpm.overrides 메이저 hoist 회귀
| Override | Old | New | Major hoist | 회귀 영향 |
|---|---|---|---|---|
| `jws` | `>=3.2.3` | `^4.0.1` | 3→4 | jsonwebtoken transitive. signature 형식 호환. e2e test 통과. |
| `tar-fs` | `>=2.1.4` | `^3.1.2` | 2→3 | docker build-time. backend 런타임 미사용. |
| `uuid` | `^9.0.0` | `^11.0.0` | 9→11 | backend 직접 의존 제거. transitive 잔존 (exceljs/node-jose). v9→v11 v4 형식 동일. |

**시니어 판단**: 메이저 점프 3건은 본 세션 *이전* `>=` silent hoist를 *명시화*한 것. 회귀 표면 신규 추가 0.

## Testing Coverage Gap

### 11 케이스 진위 분석
`identifier.service.spec.ts`:
- ✅ Format: v4 UUID regex 검증
- ✅ Uniqueness: 1000회 호출 중복 0 (CSPRNG sanity)
- ✅ Prefix: empty string · custom prefix · undefined 분기
- ✅ DI vs module function 동등성
- ⚠️ 빠진 케이스: `randomUUID()` failure mode 시뮬레이션 없음 (LOW)

### 통합 테스트 갭 (HIGH)
- `file-upload.service.spec.ts` — **존재하지 않음** (검증됨). FileUploadService에 IdentifierService 주입을 추가했지만 통합 테스트로 검증되지 않음
- `form-template.service.spec.ts` — 본 검토에서 미확인

**시니어 권고**: file-upload는 보안·무결성·SHA-256·magic bytes 등 critical path를 담당하는데 spec 0건은 본 세션 작업과 무관하게 **기존 tech-debt**. 본 세션이 *추가*한 위험은 아니지만, IdentifierService 도입을 계기로 spec 신설이 자연스러운 시점.

## 권고 (즉시 / sprint / deferred)

### 즉시 (다음 세션 head)
1. **A1**: `apps/backend/src/common/testing/mock-providers.ts` `createMockIdentifierService()` 헬퍼. *비용*: 15분
2. **A3**: `.github/workflows/supply-chain-gate.yml` 신설 (drift guard + audit:dependabot CI gate). *비용*: 30분. **본 세션 작업의 진짜 완성**
3. **A5**: `docs/references/identifier-policy.md` 신설. *비용*: 30분
4. **A6**: ESLint `no-restricted-imports` (`node:crypto` from non-identifier source). *비용*: 10분

### Sprint (트리거 명확)
5. **A4**: `.github/dependabot.yml` 에 caret 잠금 정책과 충돌 방지 룰. *트리거*: dependabot 첫 PR이 preinstall guard에 의해 실패하는 시점
6. **identifier negative test**: `randomUUID` mock 실패 시뮬레이션 1 케이스
7. **file-upload.service.spec 신설** + form-template.service.spec 신설 (기존 tech-debt)

### Deferred (트리거 불명)
8. **A2**: frontend ID 헬퍼 격상. *트리거*: frontend 첫 도메인 ID 호출처 등장
9. **bundle-size measure**: backend-only 변경이라 frontend 영향 0

## Final Verdict

**ATTENTION** (1-2건 권고 처리 권장)

본 세션은 **시니어 표준의 80%**에 도달. SSOT 격상의 핵심 의도(vendor 캡슐화 + caret 잠금 + preinstall guard)는 정확히 달성됐고, cross-module 일관성·CAS coherence·security 등급은 모두 통과. 그러나:
- A3 (CI 게이트 미장착)는 deferred로 분류됐지만 *지금* 처리하지 않으면 본 세션 작업의 supply-chain hardening 명분이 절반만 완성된 상태
- A1 (test DI 비대칭)은 다음 세션에 새 spec 작성 시 silent failure를 만들 수 있는 미래 회귀 표면
- A5 (identifier-policy docs)는 Step 44가 *왜* 존재하는지의 외부화로 신규 코더 진입 비용을 낮춤
- A6 (ESLint 이중 가드)는 정적 grep의 우회 패턴 차단

이 4건을 다음 세션 head에서 처리하면 **PASS** 등급으로 격상.
