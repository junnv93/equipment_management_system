# 본 세션 manage-skills 분석 보고서

분석 일자: 2026-04-28  
세션 범위: HEAD~10 (checkouts Phase 3 + dashboard ConfigService + eslint 개선 + bundle 측정)

---

## 패턴별 커버리지

### Pattern 1: ESLint ignores globstar 패턴
- `apps/frontend/eslint.config.mjs`: `lib/design-tokens/**` → `**/lib/design-tokens/**` + `**/lib/brand-assets/**` 추가
- 커버 스킬: verify-hardcoding (Step 21/24의 ESLint 상보 언급) + self-audit (② eslint-disable 규칙이 간접 커버)
- 판정: **Defer** — lint-staged 워킹 디렉토리 이슈는 인프라 설정이며 코드 패턴이 아님. ESLint ignores 변경은 회귀 탐지가 아닌 CI/인프라 영역. 예외사항 8(CI/CD 설정) 적용.
- 신규 Step 불필요.

### Pattern 2: file-level eslint-disable 제거 (5건)
- 본 세션 F1에서 design-tokens 파일 내 5건 제거됨
- 커버 스킬: `self-audit.mjs` ② 규칙이 이미 pre-commit 단계에서 탐지. verify-hardcoding은 eslint-disable 직접 검증 없음
- 판정: **Defer** — self-audit.mjs pre-commit hook이 기존 SSOT. verify-hardcoding에 새 Step 추가 시 중복 탐지 발생. 예외사항 8 적용.

### Pattern 3: Next.js 16 build artifacts 측정
- `scripts/check-bundle-size.mjs`: stdout 파싱 → `.next/build-manifest.json` + `app-paths-manifest.json` + `zlib.gzipSync` 방식 교체
- 커버 스킬: verify-ssot Step 29 (prebuild guard 스크립트 연결)가 스크립트 존재 + package.json 연결을 커버하나, Next.js 버전별 manifest 형식 변경 탐지는 미커버
- 판정: **Defer** — manifest 형식 변경은 Next.js 버전 업그레이드 시 발생하는 일회성 이슈이며 패턴 안정화 전. 스크립트 내부 주석에 의존성 명시됨. 별도 스킬은 과잉.

### Pattern 4: shared-constants Zod enum + ValidationPipe SSOT
- `packages/shared-constants/src/dashboard-scope.ts`: `DASHBOARD_SCOPES` const → `DashboardScope` 타입 export
- `apps/backend/src/modules/dashboard/dto/dashboard-scope.dto.ts`: `z.enum(DASHBOARD_SCOPES)` + `ZodValidationPipe(schema, { targets: ['query'] })`
- 커버 스킬: verify-ssot (Step 없음), verify-zod Step 3 (query targets 부분 커버)
- 판정: **업데이트 — verify-ssot** (Step 37 신규) + verify-zod는 이미 Step 3에서 targets:['query'] 커버
- 신규 Step: shared-constants에서 정의된 const array를 `z.enum()` 통해 소비하고, FE는 타입만 import하는 패턴 회귀 탐지

### Pattern 5: Dual-mode hook with optional descriptor
- `apps/frontend/hooks/use-checkout-progress-steps.ts`: `descriptor?: NextStepDescriptor | null` — descriptor 부재 시 status-only fallback
- 커버 스킬: verify-frontend-state Step 24 (dual-mode props 2026-04-28 추가됨)
- 판정: **이미 커버** — Step 24가 동일 컴포넌트 수준 패턴 탐지. verify-checkout-fsm은 hook 자체의 FSM 로직 검증으로 보완. 추가 불필요.

### Pattern 6: Brand-asset 외부 모듈 분리 (lib/brand-assets/)
- `apps/frontend/lib/brand-assets/microsoft-logo.tsx`: 외부 브랜드 자산 분리 + ESLint ignores에 `**/lib/brand-assets/**` 추가
- 커버 스킬: verify-hardcoding (HEX_COLOR_RULE ESLint 규칙이 브랜드 컬러 직접 사용 차단) — 그러나 brand-assets 디렉토리 구조 자체 검증 없음
- 판정: **업데이트 — verify-hardcoding** (Step 30 신규) — 외부 브랜드 로고/자산이 컴포넌트 인라인 추가되지 않고 `lib/brand-assets/` 모듈 경유를 강제

### Pattern 7: Bundle baseline gzip 측정
- `scripts/check-bundle-size.mjs`: `zlib.gzipSync` 기반 gzip kB 측정 + `tolerancePct` 5% 회귀 검사
- 커버 스킬: verify-ssot Step 29 (prebuild guard)가 스크립트 연결 여부를 커버
- 판정: **Defer** — gzip 측정 단위 일관성은 스크립트 내부 로직이며 외부 패턴 규칙 아님. bundle baseline 갱신 누락은 CI 게이트(check-bundle-size.mjs exit 1)로 이미 방어됨.

### Pattern 8: ConfigService 도입 (process.env → typed config)
- `apps/backend/src/modules/dashboard/dashboard.service.ts`: ConfigService 주입 + `configService.get<number>()` 경유
- `apps/backend/src/config/env.validation.ts`: Zod schema 추가 (`DASHBOARD_STORAGE_CAPACITY_BYTES`)
- 커버 스킬: verify-ssot (process.env 직접 접근 탐지 없음), verify-security (환경변수 관련 부분 커버)
- 판정: **업데이트 — verify-ssot** (Step 38 신규) — 신규 백엔드 서비스에서 `process.env.*` 직접 접근 금지 + `env.validation.ts` Zod schema 등록 필수 패턴 강제

---

## 우선순위별 권고 목록

### P1 (HIGH — 즉시 업데이트)

**verify-ssot Step 38: ConfigService 도입 패턴 — process.env 직접 접근 금지**
- 근거: 신규 서비스가 `process.env.*` 직접 사용 시 (1) Zod 타입 보장 우회 (2) 단위 테스트 시 환경변수 주입 불가 (3) env.validation.ts 누락 시 undefined 반환 silent bug
- 파일: `apps/backend/src/modules/dashboard/dashboard.service.ts` (ConfigService 도입 모범 사례), `apps/backend/src/config/env.validation.ts`

**verify-ssot Step 37: shared-constants const → z.enum SSOT 패턴**
- 근거: query enum이 shared-constants를 우회하고 인라인 `z.enum(['me','team','lab','all'])` 정의 시 FE/BE 드리프트 위험
- 파일: `packages/shared-constants/src/dashboard-scope.ts`, `apps/backend/src/modules/dashboard/dto/dashboard-scope.dto.ts`

### P2 (MEDIUM — 다음 세션)

**verify-hardcoding Step 30: 외부 브랜드 자산 lib/brand-assets/ 모듈 분리 강제**
- 근거: 다른 외부 브랜드 자산(Google OAuth 로고 등)이 향후 컴포넌트 인라인 추가될 가능성
- 파일: `apps/frontend/lib/brand-assets/microsoft-logo.tsx`

### P3 (LOW — 신규 스킬 후보)

없음 — 8개 패턴 모두 기존 스킬 확장 또는 defer로 처리 가능.

---

## 요약 테이블

| 우선순위 | 대상 스킬 | 액션 | 패턴 | 근거 |
|---|---|---|---|---|
| P1 | `verify-ssot` | Step 38 추가 | Pattern 8: ConfigService SSOT | process.env 직접 접근 → 테스트 불가 + Zod 우회 |
| P1 | `verify-ssot` | Step 37 추가 | Pattern 4: shared-constants z.enum | 인라인 union 드리프트 방지 |
| P2 | `verify-hardcoding` | Step 30 추가 | Pattern 6: brand-assets 모듈 분리 | 컴포넌트 인라인 브랜드 자산 금지 |
| — | Pattern 1 | Defer | ESLint globstar | CI/인프라 설정, 예외사항 8 |
| — | Pattern 2 | Defer | file-level eslint-disable 제거 | self-audit.mjs ② 규칙 이미 커버 |
| — | Pattern 3 | Defer | bundle artifacts 측정 | 패턴 미안정, 스크립트 내부 로직 |
| — | Pattern 5 | 이미 커버 | dual-mode hook | verify-frontend-state Step 24 |
| — | Pattern 7 | Defer | bundle baseline gzip | CI gate 이미 방어, 스킬 과잉 |

---

## CLAUDE.md 변경 필요 여부

**불필요** — 신규 스킬 없음, 기존 스킬(verify-ssot, verify-hardcoding) 업데이트만.  
manage-skills SKILL.md의 verify-ssot/verify-hardcoding 설명 행은 Step 번호 추가 후 업데이트 필요.
