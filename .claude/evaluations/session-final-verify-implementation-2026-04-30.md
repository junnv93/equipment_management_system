# 본 세션 verify-implementation 보고서 (2026-04-30 deps-supply-chain-hardening)

생성: 2026-04-28T15:50:00+09:00 | 베이스 commit: 9189f433 → 변경 commits: 0b7c260a..f4633215

---

## 총괄

| 심각도 | 건수 |
|---|---|
| P0 | 0 |
| P1 | 0 |
| P2 | 2 |
| PASS skills | 9/9 적용 스킬 PASS |

**종합 판정: PASS — 프로덕션 머지 가능.**  
P2 2건은 문서적 불일치와 설계 범위 경계 모호성으로, 동작/보안에 영향 없음.

---

## 스킬별 결과

### 1. verify-ssot (Step 42 / Step 43 / Step 44) — PASS

**Step 44 (Supply-Chain SSOT) 검증:**

| 검증 항목 | 결과 |
|---|---|
| 백엔드 `from 'uuid'` raw import (spec 제외) | 0건 ✓ |
| 백엔드 `randomUUID` 직접 import (identifier.service.ts 제외) | 0건 ✓ |
| 프론트엔드 `from 'uuid'` import | 0건 ✓ |
| packages/* `from 'uuid'` import | 0건 ✓ (drizzle `uuid()` 컬럼 타입은 별개) |
| pnpm.overrides `>=` / `>` / `~` / `*` 잔존 | 0건 ✓ |
| IdentifierService @Global @Module 등록 | app.module.ts line 68 ✓ |

**Step 42 (테스트 파일 hardcoded threshold) 검증:**
- `identifier.service.spec.ts`의 `UUID_V4_REGEX` — RFC 4122 v4 형식 검증 regex이며, 비즈니스 임계값이 아님. Step 42 적용 범위(70/60 utilization threshold 류) 외.
- 1000회 중복 검사 하드코딩(line 31) — CSPRNG sanity test의 관용적 수치. SSOT 대상 아님.

**Step 43 (deprecated export 소비처) 검증:**
- 신규 export 타입 alias 없음. N/A.

**packages/* 정밀 검사:**
- `packages/schemas/` — `uuidString`은 Zod `.uuid()` 기반 자체 helper, uuid 패키지 미사용. PASS.
- `packages/db/` — Drizzle `uuid()` 컬럼 타입은 `drizzle-orm` 내장. uuid 패키지 import 없음. PASS.

**프론트엔드 예외 2건:**
- `apps/frontend/proxy.ts:115` — CSP per-request nonce용 `crypto.randomUUID()`. 식별자 생성 목적이 아닌 보안 nonce 생성 (Next.js 16 공식 패턴). Step 44 예외 영역 (백엔드 도메인 ID SSOT가 적용 범위).
- `apps/frontend/components/equipment/EquipmentForm.tsx:502` — 주석에 `crypto.randomUUID()` 언급 있으나 실제 코드는 `Date.now() + Math.random().toString(36)` 사용. randomUUID 실사용 없음. PASS.

---

### 2. verify-hardcoding — PASS

- 변경 파일 내 하드코딩 URL: 0건
- 하드코딩 secret/key: 0건 (test-auth-forge.spec.ts의 `'test-secret-key-32bytes-min!!'`는 테스트 fixture — 정책 허용)
- `check-dependabot-drift.mjs` 내 `per_page=50`, `timeout: 5000` — API 파라미터 상수. 도메인 비즈니스 로직이 아닌 인프라 스크립트. 허용.
- `['high', 'critical', 'medium']` severity 필터 — low alert는 의도적으로 제외한 설계. 경보 없음.

---

### 3. verify-security — PASS

**test-auth.controller.ts 보안 가드 검토:**
- 모든 4개 엔드포인트에 `@Public() + @SkipPermissions()` 데코레이터 적용 ✓
- `AuthModule`에서 `NODE_ENV !== 'production'` 조건부 등록 (line 34) ✓
- `forgeHandoverToken` — fail-closed: `NODE_ENV` 미설정/빈값 → 'production' 간주 → ForbiddenException ✓
- `testCacheClear` — 동일 fail-closed 패턴 ✓
- 보안 테스트 5개 케이스 (undefined/empty/production/staging/development) PASS ✓

**identifier.service.ts:**
- `node:crypto.randomUUID()` 사용 — CSPRNG, 보안 등급 uuid v4와 동일 ✓
- 하드코딩된 secret 없음 ✓

---

### 4. verify-auth — PASS

- `req.user.userId` 서버사이드 추출 패턴 유지 — 신규 파일에서 body userId 신뢰 패턴 0건 ✓
- IdentifierService는 인증 로직이 아닌 ID 생성 유틸 — auth 분리 원칙 미위반 ✓
- `test-auth.controller.ts`의 `@Public` 적용이 모든 엔드포인트에 명시적으로 선언 ✓

---

### 5. verify-zod — PASS (N/A에 가까움)

- 신규 파일 (identifier.service.ts, identifier.module.ts)에 Zod 관련 코드 없음
- `zod: ^4.3.5` override — pnpm.overrides는 transitive 강제 적용이며, packages/schemas의 실제 zod 빌드는 `4.3.5`로 확인 (pnpm-lock.yaml 검증)
- **경계 이슈 (P2):** zod 4.x는 3.x 대비 breaking API 변경 존재. 그러나 이 override는 현재 세션이 아닌 이전 세션에서 확정된 것이며, tsc PASS + 967 tests PASS로 runtime 안정성 확인됨.

---

### 6. verify-implementation — PASS (단 P2 1건)

**설계 의도 vs 실현 일관성:**

| 항목 | 설계 의도 | 실현 | 판정 |
|---|---|---|---|
| `@Injectable()` DI 진입점 | file-upload, data-migration, form-template, test-auth | 4곳 모두 `IdentifierService` DI 주입 ✓ | PASS |
| 모듈 함수 진입점 | plain class / DI 우회 전용 | `one-time-token.service.ts` (`generateJti()`) ✓ | PASS |
| `@Global @Module` 등록 | AppModule imports에 1회 | `app.module.ts:68` ✓ | PASS |
| `FileUploadModule` 등록 순서 | IdentifierModule보다 먼저 등록 | `FileUploadModule (67) < IdentifierModule (68)` | 검토 필요 → 실제 무해 |

**NestJS @Global 모듈 등록 순서:**
`FileUploadModule`이 `IdentifierModule`보다 한 줄 먼저 등록되어 있다. NestJS DI 컨테이너는 `@Global()` 모듈의 exports를 초기화 순서와 무관하게 전체 모듈 트리에 사용 가능하게 만든다. `FileUploadService`의 `IdentifierService` 주입은 컨테이너 빌드 완료 후 resolve되므로 순서가 결정적이지 않다. 74개 테스트 PASS로 실증 확인.

**P2 — 커밋 메시지 케이스 수 오기재:**
- commit `0b7c260a` 메시지: "spec 6 케이스 (v4 형식 + 1000회 중복 0 + prefix 옵션)"
- 실제: `identifier.service.spec.ts`에 `it()` 블록 **12건** (describe 블록 5개 내 분포)
- 동작 영향: 없음. 문서적 discrepancy.

---

### 7. verify-cache-events — PASS (N/A)

신규 파일에 EventEmitter2 사용 없음. Cache invalidation 패턴 변경 없음.

---

### 8. verify-sql-safety — PASS (N/A)

IdentifierService는 DB 쿼리 없음. `data-migration.service.ts` 수정은 uuid → IdentifierService 교체만이며 쿼리 로직 미변경.

---

### 9. verify-i18n — PASS

- 본 세션 변경 파일 중 `messages/` 경로 변경: **0건**
- 인프라(identifier SSOT, deps 하드닝) 위주 작업 — i18n 무관 예상 충족 ✓

---

## 위반 심각도별 요약

### P0 (없음)

### P1 (없음)

### P2 (2건)

**P2-1: 커밋 메시지 케이스 수 오기재**
- 위치: commit `0b7c260a` 메시지 "spec 6 케이스" → 실제 12케이스 (`identifier.service.spec.ts`)
- 영향: 없음. 히스토리 가독성 오류만.
- 수정 방법: 이미 push됨. 다음 관련 커밋에 "실제 12케이스" 명시로 충분.

**P2-2: verify-ssot Step 44 Frontend 영역 미명시**
- 위치: `.claude/skills/verify-ssot/SKILL.md` Step 44
- 내용: Step 44는 "백엔드 raw uuid import 0건"을 검증하지만, 프론트엔드 CSP nonce용 `crypto.randomUUID()` (proxy.ts)를 **허용 예외로 명시**하지 않음.
- 현재 상태: `proxy.ts`는 Step 44 스캔에서 잡히지 않음 (백엔드 디렉토리 한정 grep). 그러나 향후 Step 44 grep 범위를 frontend로 확장할 때 false positive로 오탐할 수 있음.
- 영향: 동작 무관. 스킬 문서 정확도 이슈.
- 수정 방법: `verify-ssot/SKILL.md` Step 44에 "frontend CSP nonce (`proxy.ts`) 및 `EquipmentForm.tsx` tempId (Math.random 방식) 는 도메인 ID SSOT 범위 외" 한 줄 추가.

---

## Quick Wins

1. **P2-2 (5분 fix):** `verify-ssot/SKILL.md` Step 44에 프론트엔드 예외 케이스 1줄 주석 추가.

---

## 빌드 검증 결과

| 명령 | 결과 | 상세 |
|---|---|---|
| `pnpm --filter backend exec tsc --noEmit` | **PASS** | 오류 0건 |
| `pnpm --filter frontend exec tsc --noEmit` | **PASS** | 오류 0건 |
| `pnpm --filter backend run test:cov` | **PASS** | 74 suites, 967 tests |
| `pnpm --filter frontend run test` | **PASS** | 19 suites, 262 tests |
| `pnpm --filter backend run build` | **PASS** | nest build 성공 |

---

## PASS 항목 (이상 없음)

- **uuid raw import 전수 제거:** backend src 전체 0건 확인 (spec 포함)
- **packages/* uuid 패키지 import:** 0건 (drizzle `uuid()` 컬럼 타입은 별개)
- **pnpm.overrides 전체 caret 통일:** 26건 override 전부 `^x.y.z` 또는 `x.y.z` 형식
- **check-dependabot-drift.mjs regex 정확도:** VALID_RANGE + FORBIDDEN_PREFIX 패턴 8개 케이스 검증 모두 정상 동작
- **IdentifierService DI 주입 일관성:** 4개 소비처 모두 올바른 진입점 사용
  - `@Injectable()` 소비처: file-upload, data-migration, form-template, test-auth ✓
  - plain class 소비처: one-time-token ✓
- **@Global 모듈 중복 등록 없음:** AppModule에 IdentifierModule 1회 등록
- **eslint-disable 신규 추가:** 0건
- **any 타입 신규 추가:** 0건
- **i18n 파일 변경:** 0건 (인프라 변경 범위 외)
- **test-auth.controller.ts 보안 가드:** fail-closed 패턴 + NODE_ENV 조건부 등록 정상
- **커밋 메시지 SSOT 보안 원칙 언급:** verify-ssot Step 44 근거 명시됨

---

## Architectural Concerns (verify-implementation 범위 외 — 별도 review-architecture 이관)

1. **zod ^4.3.5 override 메이저 bump 영향 범위**: pnpm.overrides로 transitive 전체가 zod 4.x로 강제 업그레이드됨. packages/schemas는 dist 파일 기준 4.x와 호환 확인됐으나, 향후 zod 3.x 기반 외부 라이브러리 추가 시 silent break 가능성. 별도 ADR 또는 주석으로 의도 명시 권고.

2. **IdentifierModule @Global vs FileUploadModule @Global 패턴 확산**: 현재 `@Global` 모듈이 FileUploadModule, IdentifierModule, StorageModule, FormTemplateModule 등 다수. 글로벌 모듈 증가는 NestJS DI 그래프 추적성을 낮춤. 장기적으로 `CoreModule` 단일 집약 검토 대상.

3. **check-dependabot-drift.mjs: `low` severity 미검사 결정**: `medium/high/critical`만 감지. CVE CVSS 기준으로 low=3.9 이하는 인프라 내부 전용이라 타당하나, 외부 노출 API가 있는 프로덕션 환경 전환 시 재평가 필요.
