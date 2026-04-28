# Identifier Policy — 도메인 ID 생성 SSOT

신규 ID가 필요할 때 *어디에 무엇을 추가할지*만 정의. 검증은 `verify-ssot` Step 44.

## SSOT 진입점

`apps/backend/src/common/identifiers/identifier.service.ts` — **이 파일 1곳만** `randomUUID`를 직접 호출. 모든 backend 호출처는 본 파일이 export 한 함수/클래스만 사용.

| 진입점                                | 사용처                              | 패턴                                                        |
| ------------------------------------- | ----------------------------------- | ----------------------------------------------------------- |
| `IdentifierService` (`@Injectable`)   | NestJS 컴포넌트 (서비스/컨트롤러)   | DI 주입 — `private readonly identifiers: IdentifierService` |
| 모듈 함수 (`generateAttachmentId` 등) | DI 우회가 필요한 plain class / util | 직접 import                                                 |

두 진입점 모두 **같은 `randomUUID()` 호출에 위임** — 클래스 메서드는 모듈 함수에 1-line 위임 (V8 inline). 알고리즘 전환 시 4 함수 본문만 교체.

## 4개 도메인 헬퍼

| 함수                         | 의도                                  | 호출처                         |
| ---------------------------- | ------------------------------------- | ------------------------------ |
| `generateAttachmentId()`     | 첨부 파일 / 업로드 자산의 storage key | `file-upload`, `form-template` |
| `generateMigrationBatchId()` | 데이터 마이그레이션 세션 추적         | `data-migration`               |
| `generateJti()`              | JWT `jti` 클레임 (1회용 토큰 nonce)   | `one-time-token`               |
| `generateOpaqueId(prefix?)`  | 도메인 의미 없는 일반 ID (안전망)     | 신규 prefix가 없을 때만        |

## 트레이드오프 (왜 v4 UUID인가)

| 후보                             | 채택 안 한 이유                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------- |
| `ulid`                           | 시간 정렬 가능 ↔ 외부 패키지 의존 추가. DB 정렬 인덱스 사용처 없어 가치 < 비용. |
| `nanoid`                         | URL-safe 짧음 ↔ 형식 호환성. 기존 `file_path` 36자 v4 가정과 깨짐.              |
| `KSUID`                          | 27자 + 시간 prefix ↔ 외부 패키지. 정렬 가능 ID 수요 미실측.                     |
| **`crypto.randomUUID()` (선택)** | Node 빌트인, RFC 4122 v4, CSPRNG. _zero dep_. lockfile 회귀 표면 0.             |

**전환 비용**: 4 함수 본문에 `import { ulid } from 'ulid'` 후 `randomUUID()` → `ulid()` 교체 — 호출처는 무관. SSOT의 진짜 가치.

## 신규 도메인 ID 추가 절차

1. `identifier.service.ts` 모듈 함수 추가: `export function generateXxxId(): string { return randomUUID(); }`
2. `IdentifierService` 클래스에 1-line 위임 메서드 추가
3. 호출처에서 `identifiers.generateXxxId()` 사용 (또는 plain class면 모듈 함수 직접 import)
4. spec 작성 시 `createMockIdentifierService()` 헬퍼 사용 (`apps/backend/src/common/testing/mock-providers.ts`)

## 예외 영역 (도메인 ID SSOT 적용 외)

- **`apps/frontend/proxy.ts`** — Edge Runtime `globalThis.crypto.randomUUID()` (Web Crypto API). CSP nonce 생성. `node:crypto` import 불가 환경. backend SSOT와 별개 도메인.
- **e2e spec 파일 (`apps/frontend/tests/e2e/**/\*.spec.ts`)\*\* — 테스트 데이터 유일성 목적. 도메인 ID 아님.
- **packages/\* 향후 ID 수요** — 현재 0건. frontend 첫 도메인 ID 호출처 등장 시 `packages/shared-constants` 또는 `apps/frontend/lib/identifiers/` 신설 후 본 문서 §예외에서 §진입점으로 이동.

## 정적 + 동적 가드

| 가드         | 위치                                                                                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 정적 grep    | `verify-ssot` Step 44 (raw `uuid` import / raw `randomUUID` import 0건)                                                                              |
| 정적 ESLint  | `apps/backend/.eslintrc.js` `no-restricted-imports` (`node:crypto`/`crypto` `randomUUID`) + `no-restricted-syntax` (`crypto.randomUUID` member call) |
| Install gate | `scripts/check-dependabot-drift.mjs` (preinstall — pnpm.overrides caret 잠금)                                                                        |
| CI gate      | `.github/workflows/supply-chain-gate.yml` (PR — `--ignore-scripts` 우회 방어)                                                                        |
| Test mock    | `createMockIdentifierService()` (`@Global` 모듈 단위 테스트 silent DI failure 방지)                                                                  |

## 관련 문서

- `verify-ssot` Step 44 — 자동 검증 룰
- `manage-skills` SKILL.md — supply-chain SSOT 인덱스
- `.claude/exec-plans/completed/2026-04-30-deps-supply-chain-hardening.md` — 도입 이력
