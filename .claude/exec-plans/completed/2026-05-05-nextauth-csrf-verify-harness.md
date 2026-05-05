# 2026-05-05 nextauth-csrf-verify-harness — Mode 2 Plan

## 메타

- 생성: 2026-05-05T00:00:00+09:00
- 모드: Mode 2 (Planner → Generator → Evaluator harness)
- 슬러그: `nextauth-csrf-verify-harness`
- 기반 ADR: ADR-0006 Same-Origin Reverse-Proxy
- 처리 대상 tech-debt: §S3 (MEDIUM) + §J1 (LOW), `.claude/exec-plans/tech-debt-tracker.md` 라인 85·86
- 예상 신규 파일: 4개 / 수정 파일: ~6개

## Goal (2~3 줄)

§S3·§J1 두 항목을 "수동 실행 레시피"에서 **상시 실행 가능한 SSOT-respecting 인프라**로 승격한다.
- §S3 → `pnpm compose:onprem:verify` 단일 진입점 + 머신 판독 가능한 invariant 스펙 + dry-run 모드.
- §J1 → `scripts/diagnostics/nextauth-csrf-trace.mjs` 영구 진단 harness + ADR-0006의 "재발 시 1차 응답" 절차 링크.
환경별 origin/port/host는 모두 env(`ONPREM_PUBLIC_ORIGIN`, `INTERNAL_BACKEND_URL` 등)에서만 조회한다.

## 설계 철학

1. 운영 검증을 **사람이 잊어버릴 수 있는 5-line recipe**에서 **CI-friendly 단일 명령**으로 승격.
2. Phase 0 재현 시나리오는 다음 인시던트에서 즉시 재실행 가능한 코드로 결빙 — 5페이지 마크다운 절차 따라하지 않음.
3. nginx `lan.conf`의 "legacy 파일명" 모호성을 명시적 결정으로 해결 (rename vs 헤더 주석으로 보존).
4. 모든 invariant는 `scripts/diagnostics/csrf-invariants.json` 단일 SSOT에서 도출. smoke와 trace harness가 동일 정의 공유.

## Pre-plan reality check

| 항목 | 발견 사실 |
|------|-----------|
| nginx confs | `infra/nginx/lan.conf` (HTTP, port 9000), `infra/nginx/nginx.conf.template` (HTTPS+Certbot, prod) |
| `lan.conf` 사용처 | `infra/compose/lan.override.yml:164` **AND** `infra/compose/onprem.override.yml:164` 둘 다 동일 파일 마운트 → "lan" 이름이 LAN+onprem 공유의 실체와 불일치 |
| 하드코딩 origin (nginx) | `lan.conf` 0건 (server_name `_`), `nginx.conf.template`의 `DOMAIN_PLACEHOLDER`는 `setup-docker-prod.sh`가 치환 — env-driven OK |
| docker compose | `infra/compose/base.yml` + `lan.override.yml` + `onprem.override.yml` + `prod.override.yml` |
| ADR-0006 위치 | `docs/adr/0006-frontend-backend-routing-model.md` (95 lines) — `${ONPREM_PUBLIC_ORIGIN}` 환경변수 SSOT 명시 |
| proxy.ts vs middleware.ts | `apps/frontend/proxy.ts` 존재 ✅ Next.js 16 컨벤션. middleware.ts 부재 |
| NextAuth handler | `apps/frontend/app/api/auth/[...nextauth]/route.ts` (Auth.js v5 named exports `GET, POST` from `handlers`) |
| api-config.ts SSOT | `apps/frontend/lib/config/api-config.ts` (client) + `api-config.server.ts` (server, INTERNAL_BACKEND_URL) — verify-routing-origin Step 5에서 검증 중 |
| 기존 scripts/ 컨벤션 | `.mjs` Node ESM (ultrareview-preflight·advisor 패턴), 헤더 주석 + 종료 코드 명시 + `--verbose`/`--json` 플래그 옵션 |
| 기존 진단 스크립트 | `scripts/verify-routing-origin.sh` (정적 grep 검사, 11 step), `scripts/diagnostics/` 디렉터리 미존재 (신규) |
| env SSOT | `ONPREM_PUBLIC_ORIGIN` (compose에서 `:?` 강제), `INTERNAL_BACKEND_URL` (4개 env 파일), `NEXTAUTH_URL`, `NEXT_PUBLIC_API_URL` (빈 값) |
| 기존 SSOT 모듈 | `packages/shared-constants/src/api-routing.ts` — `NEXTAUTH_HANDLER_PATHS`, `BACKEND_AUTH_PATHS`, `API_ROUTING_ENV` |
| 선행 계약 | `.claude/contracts/nextauth-csrf-onprem-prod-verification.md` — onprem curl 실측은 BLOCKED, S3·J1로 분리되어 본 sprint로 이관 |
| 운영 문서 | `infra/ONPREM_DEPLOYMENT.md` 라인 78-84에 수동 curl 레시피 존재 — Phase 4에서 신규 npm script로 갱신 |
| review-architecture references | `scripts/ultrareview-advisor.mjs`가 차용한 SSOT-derive 패턴(SSOT 파일 grep → 동적 trigger 파생)을 본 sprint도 재사용 |

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| 진입점 형식 | `pnpm compose:onprem:verify` (root package.json) | 기존 `compose:onprem` / `compose:onprem:migrate` 네이밍과 일관 |
| 스크립트 언어 | `.mjs` Node ESM | repo 컨벤션, JSON 파싱·Promise.all 자연스러움. Bash는 SameSite/HttpOnly 파싱이 fragile |
| invariant SSOT | `scripts/diagnostics/csrf-invariants.json` (신규) | 머신 판독 가능 단일 파일. smoke·trace 두 스크립트가 import |
| `lan.conf` 모호성 해결 | **헤더 주석 보존**(rename 안 함) | 5+ 위치 참조: `lan.override.yml`, `onprem.override.yml`, `verify-routing-origin.sh` × 3, `verify-routing-origin/SKILL.md`, `api-routing.ts` 주석. rename blast radius > 헤더 주석 추가. 다만 파일명에 "lan" 잔존 사유를 헤더에 명시 |
| smoke 실행 모델 | parallel `Promise.all` fetch + 5s timeout per check | < 10s budget 보장 |
| dry-run | `--dry-run` 플래그: env 검증·invariant 스펙 로드만 수행, 네트워크 호출 skip | CI에서 onprem 미접근 환경에서도 회귀 차단 가능 |
| 비밀 redaction | csrfToken 값/Set-Cookie 값/JWT 본문 → `<redacted len=N>` | NextAuth CSRF 토큰은 사실상 short-lived지만 로그 누출 방지 표준 적용 |
| 진단 결과 저장 | `tmp/diagnostics/<ISO-timestamp>-trace.json` | repo 루트 `.gitignore`에 `tmp/` 등재 가정. 등재 안 됐으면 Generator가 추가 |
| ADR-0006 링크 갱신 | "Recurrence first-response" 절을 **References 섹션 아래**에 추가 | 기존 본문 구조 보존 |
| CI 통합 (Phase 5) | **Decision-only**: `pre-push` hook 통합 안 함(외부 네트워크 의존 → solo trunk-based 원칙 위배). 대신 `infra/scripts/deploy.sh`(존재 시) 또는 `compose:onprem` 직후 `&& pnpm compose:onprem:verify` chain 권장. 결정 내용을 ADR-0006 본문 + script 헤더에 기록 |

## 구현 Phase

### Phase 1 — 네이밍 모호성 해결 (`lan.conf`)

**목표:** "lan.conf가 onprem에도 쓰인다"는 사실을 코드 진입자가 즉시 인지하도록 헤더 주석 추가.

**변경 파일:**
1. `infra/nginx/lan.conf` — 수정. 1번 라인 주석을 "LAN + on-prem 공용 single-VM HTTP 설정. SSL 종단(prod 도메인)은 `nginx.conf.template` 별도 파일." 형태로 확장. 파일명 `lan.conf`는 git history 보존을 위해 유지하되 사유를 명시.
2. `infra/compose/onprem.override.yml`, `infra/compose/lan.override.yml` — 수정. `volumes:` 섹션의 mount line(`../nginx/lan.conf:/etc/nginx/nginx.conf:ro`) 위에 한 줄 주석 추가: `# 공용 HTTP nginx 설정 — lan/onprem이 같은 single-VM 토폴로지를 사용`.

**검증:**
- `grep -c "공용\|shared\|LAN + on-prem" infra/nginx/lan.conf` ≥ 1
- 운영 의미 변화 없음(`docker compose config` 차이 0)

**의도적으로 안 하는 것:**
- 파일 rename. blast radius 5+ 파일이며 git blame 손실 + verify-routing-origin.sh 회귀 위험 > 명확성 이득.

### Phase 2 — Onprem 검증 SSOT 진입점 (§S3)

**목표:** `pnpm compose:onprem:verify` 단일 명령이 ADR-0006 invariant를 자동 검증한다.

**변경 파일:**
1. `scripts/diagnostics/csrf-invariants.json` — 신규. 머신 판독 가능 invariant 스펙. 다음 키를 포함:
   - `nextAuthHandlerPaths`: `[/api/auth/csrf, /api/auth/session, /api/auth/providers]` (NEXTAUTH_HANDLER_PATHS 부분집합 — smoke 대상은 GET-safe 3개)
   - `expectedJsonShape`: `{ csrf: { csrfToken: 'string' }, session: { object: true }, providers: { object: true } }`
   - `cookieInvariants`: `{ samesite: ['Lax', 'Strict'], httpOnlyRequired: true, secureWhen: 'https' }`
   - `requiredEnvVars`: `['ONPREM_PUBLIC_ORIGIN']` (smoke), `['ONPREM_PUBLIC_ORIGIN' or 'NEXTAUTH_URL', 'INTERNAL_BACKEND_URL']` (trace)
   - `redactionPatterns`: `csrfToken`, `next-auth.csrf-token`, `next-auth.session-token`, `Set-Cookie`
   - 각 invariant에 `ref: 'ADR-0006#...'` 백링크
2. `scripts/onprem-verify.mjs` — 신규. 진입점 스크립트.
   - **fail-close**: `ONPREM_PUBLIC_ORIGIN` 미설정 시 즉시 종료 코드 2.
   - **flags**: `--dry-run` (네트워크 호출 skip), `--json` (CI-friendly), `--verbose`.
   - **체크 항목** (csrf-invariants.json에서 import한 SSOT를 토대로):
     - `GET /api/auth/csrf` → 200 + `csrfToken: string` JSON shape
     - `GET /api/auth/session` → 200 + JSON (null body 허용)
     - `GET /api/auth/providers` → 200 + JSON object
     - csrf 응답의 `Set-Cookie`: `HttpOnly` 필수, `SameSite=Lax|Strict`, origin이 `https://`이면 `Secure` 필수
     - csrf 응답의 `Cache-Control`을 비교 — NextAuth는 보통 `private` 또는 `no-store`를 기대 (정확한 값은 invariant JSON에서 정의)
     - origin echo: 응답 헤더의 `X-Forwarded-Host` 또는 `Host` echo가 환경변수와 일치 (가능한 경우)
     - 4번째 sanity check: `/api/auth/login`(BACKEND_AUTH_PATHS 1건)이 NextAuth handler 응답이 아니라 backend 응답으로 분기 (404 또는 405 expected, 200 with `csrfToken` JSON 응답이면 FAIL = nginx 라우팅 깨짐)
   - **redaction**: `csrfToken: '...'` → `csrfToken: '<redacted len=N>'`. `Set-Cookie` 값 부분(`=` 뒤)도 redact.
   - **performance**: `Promise.all` 4 체크 동시 실행, 각 5s timeout, 총 < 10s 보장.
   - **출력**: `--json`이면 `{ status: 'PASS'|'FAIL', checks: [...], origin: ..., elapsedMs: ... }`. 기본은 사람 읽기용 with green/red 컬러.
3. `package.json` — 수정. `scripts` 블록에 다음 추가:
   - `"compose:onprem:verify": "node scripts/onprem-verify.mjs"`
   - 기존 `compose:onprem` 라인 변경 없음.

**검증:**
- `node scripts/onprem-verify.mjs --dry-run --json | jq .status` → `"DRY_RUN_PASS"` 또는 `"PASS"`
- `unset ONPREM_PUBLIC_ORIGIN; node scripts/onprem-verify.mjs --dry-run` → 종료 코드 2
- `grep -E "https?://[a-z0-9.-]+" scripts/onprem-verify.mjs | grep -v "^.*\\*\\|//\\|example\\|test"` → 0건 (하드코딩 origin 없음)

**Out of scope:**
- 실제 onprem 서버 접근. 본 sprint는 dry-run + 로컬 mock 검증까지만. 운영 검증은 다음 배포 직전.

### Phase 3 — 영구 진단 harness (§J1)

**목표:** "동일 증상 재발 시 즉시 실행 가능"한 trace 스크립트 결빙. ADR-0006 invariant 위배 자동 탐지.

**변경 파일:**
1. `scripts/diagnostics/nextauth-csrf-trace.mjs` — 신규.
   - **flags**: `--dry-run`, `--origin <url>` (override), `--out tmp/diagnostics/<timestamp>-trace.json`, `--verbose`.
   - **추적 항목** (Phase 0 재현 시나리오 결빙):
     - **1. 환경변수 stack**: `NEXT_PUBLIC_API_URL`, `INTERNAL_BACKEND_URL`, `NEXTAUTH_URL`, `ONPREM_PUBLIC_ORIGIN` 값 + 절대 URL 잠입 여부 (api-routing.ts SSOT 비교).
     - **2. legacy SW 정적 검사**: `apps/frontend/app/sw.ts` 파일 grep — `/api/*` NetworkOnly 룰 존재 + matcher가 NEXTAUTH 핸들러 경로를 가로채는지(`workbox-precaching` 룰 false-positive).
     - **3. NextAuth client basePath 추론**: `apps/frontend/lib/auth.ts` (또는 export 위치) grep — Auth.js v5 `basePath` 명시값 vs default `/api/auth`.
     - **4. external proxy 헤더 chain**: `--origin`으로 fetch 후 응답의 `X-Forwarded-Proto`, `X-Forwarded-Host`, `X-Real-IP`, `Host`, `Server`, `Via` 수집. invariant: `X-Forwarded-Proto` value match scheme of `origin`.
     - **5. cookie domain 관찰**: csrf 응답 `Set-Cookie`의 `Domain` attribute. invariant: 미설정(host-only) 또는 origin host 일치.
     - **6. ADR-0006 invariant evaluation**: csrf-invariants.json 룰을 4·5번 관측치에 적용 → 위배 항목 리스트.
   - **출력**: `tmp/diagnostics/<ISO>-trace.json` (machine-readable) + stdout 휴먼 요약. JSON shape:
     ```json
     {
       "timestamp": "...",
       "origin": "...",
       "envVars": { ... redacted },
       "swSnapshot": { ... },
       "nextAuthBasePath": "/api/auth",
       "responseHeaders": { csrf: {...}, session: {...} },
       "cookieDomain": "...",
       "invariantBreaches": [{ id, message, ref: "ADR-0006#..." }],
       "verdict": "OK"|"BREACH"
     }
     ```
   - **redaction**: Phase 2와 동일 SSOT(csrf-invariants.json `redactionPatterns`).
2. `scripts/diagnostics/README.md` — 신규(SHOULD). "재발 시 first-response 절차". 다음을 포함:
   - 트리거: backend 콘솔 `Cannot GET /api/auth/csrf` 5초 주기 발생 / signin 페이지 무한 로딩 / `/api/auth/session` 503
   - 1단계: `node scripts/diagnostics/nextauth-csrf-trace.mjs --origin <ONPREM_PUBLIC_ORIGIN>`
   - 2단계: 결과 JSON에서 `invariantBreaches` 확인 → ADR-0006 매핑
   - 3단계: 회귀가 frontend 코드인지 nginx 분기인지 SW인지 판정
3. `package.json` — 수정. `scripts` 블록에 추가:
   - `"diagnostics:csrf": "node scripts/diagnostics/nextauth-csrf-trace.mjs"`
4. `.gitignore` — 수정. `tmp/diagnostics/` 추가(이미 `tmp/` 등재 시 no-op).

**검증:**
- `node scripts/diagnostics/nextauth-csrf-trace.mjs --dry-run` → 종료 코드 0, env stack 출력
- 토큰 redaction grep: `node ...trace.mjs --dry-run --json | grep -E "csrfToken['\":]\\s*['\"][a-f0-9]{16}"` → 0건

### Phase 4 — ADR-0006 링크 + tech-debt-tracker 종결

**변경 파일:**
1. `docs/adr/0006-frontend-backend-routing-model.md` — 수정. `## References` 절 위에 **`## Recurrence Response (재발 시 1차 응답 절차)`** 신설. 다음 줄 포함:
   - `scripts/diagnostics/nextauth-csrf-trace.mjs` 링크
   - `pnpm compose:onprem:verify` 정상화 검증 명령
   - 트리거 조건 3가지(Phase 3 README와 동일 — 중복 OK, ADR이 진입점)
2. `infra/ONPREM_DEPLOYMENT.md` — 수정. 라인 78-84의 수동 curl 레시피 위에 **"권장: `pnpm compose:onprem:verify` 사용"** 한 줄 + 신규 명령 예시 추가. 기존 curl 레시피는 트러블슈팅 fallback으로 유지.
3. `.claude/exec-plans/tech-debt-tracker.md` — 수정.
   - 라인 85 (§S3): `[ ]` → `[x]`. 끝에 `완료(2026-05-05 nextauth-csrf-verify-harness): pnpm compose:onprem:verify로 자동화. ADR-0006 Recurrence Response 절 추가.` 추가.
   - 라인 86 (§J1): `[ ]` → `[x]`. 끝에 `완료(2026-05-05 nextauth-csrf-verify-harness): scripts/diagnostics/nextauth-csrf-trace.mjs 영구 진단 harness 결빙.` 추가.
   - Batch 이력 표(라인 ~10-40)에 새 row 추가: `| nextauth-csrf-verify-harness | 2026-05-05 | 2 | 완료 |`.
4. `.claude/exec-plans/tech-debt-tracker-archive.md` — 수정. 동일 batch row append (Batch 표 카피).

**검증:**
- `grep -c "Recurrence Response\|재발 시 1차 응답" docs/adr/0006-frontend-backend-routing-model.md` ≥ 1
- `grep -c "compose:onprem:verify" infra/ONPREM_DEPLOYMENT.md` ≥ 1
- tech-debt-tracker.md 85·86 라인이 `[x]` 시작
- Batch 이력에 `nextauth-csrf-verify-harness` row 존재

### Phase 5 — CI 통합 평가 (§S3.4 — Decision-only)

**목표:** 어디에 `compose:onprem:verify`를 wiring할지 결정 + 결정 사유 기록. 코드 변경은 결정이 명확할 때만.

**평가 항목:**
- pre-push hook 통합 — **No**. 외부 네트워크 의존 + solo trunk-based 원칙(`.husky/pre-push`는 tsc/test만)과 어긋남.
- `.github/workflows/*.yml` 통합 — **검토만**. 현재 GitHub Actions 사용 패턴 미확인 → repo 탐색 후 결정. 있으면 deploy job에 wiring, 없으면 skip.
- `infra/scripts/deploy.sh` 통합 — **존재 시 wiring**. 없으면 ONPREM_DEPLOYMENT.md에 "deploy 직후 verify 실행" 절차 명시(Phase 4 적용).
- 권장 모델: `compose:onprem` 명령이 끝난 직후 운영자가 `compose:onprem:verify`를 chain. 자동화는 향후 deploy.sh 표준화 시점 trigger.

**결과물:**
- 결정 사항을 `scripts/onprem-verify.mjs` 헤더 주석 + ADR-0006 `## Recurrence Response`에 명시.
- `.github/workflows/*.yml` 또는 `infra/scripts/deploy.sh`가 존재하면 PR로 wiring.
- 위 둘 다 없으면 Phase 5는 결정 기록만(코드 변경 0).

## 전체 변경 파일 요약

### 신규 생성

| 파일 | 목적 |
|------|------|
| `scripts/onprem-verify.mjs` | onprem CSRF/session/providers 자동 smoke (§S3) |
| `scripts/diagnostics/nextauth-csrf-trace.mjs` | 재발 시 영구 진단 harness (§J1) |
| `scripts/diagnostics/csrf-invariants.json` | smoke + trace 공유 invariant SSOT |
| `scripts/diagnostics/README.md` | 1차 응답자용 절차 (SHOULD) |

### 수정

| 파일 | 변경 의도 |
|------|----------|
| `package.json` | `compose:onprem:verify`, `diagnostics:csrf` scripts 추가 |
| `infra/nginx/lan.conf` | 헤더 주석 — LAN + on-prem 공용 사유 명시 |
| `infra/compose/onprem.override.yml` | nginx mount 위 1줄 주석 |
| `infra/compose/lan.override.yml` | nginx mount 위 1줄 주석 |
| `docs/adr/0006-frontend-backend-routing-model.md` | `## Recurrence Response` 절 신설 |
| `infra/ONPREM_DEPLOYMENT.md` | `pnpm compose:onprem:verify` 권장 절차 추가 |
| `.claude/exec-plans/tech-debt-tracker.md` | §S3·§J1 [x] 처리 + Batch 이력 row |
| `.claude/exec-plans/tech-debt-tracker-archive.md` | Batch 이력 row append |
| `.gitignore` | `tmp/diagnostics/` 추가 (이미 `tmp/`면 no-op) |

## Verification commands (Generator가 끝나고 실행)

```bash
# 1. 정합성
pnpm tsc --noEmit
pnpm --filter backend run lint
pnpm --filter frontend run lint

# 2. 신규 스크립트 dry-run
node scripts/onprem-verify.mjs --dry-run --json
node scripts/diagnostics/nextauth-csrf-trace.mjs --dry-run

# 3. fail-close 검증 (env 미설정)
unset ONPREM_PUBLIC_ORIGIN
node scripts/onprem-verify.mjs --dry-run; echo "exit=$?"  # 기대: exit=2

# 4. 하드코딩 origin grep (URL SSOT 위반 0건)
grep -nE "https?://[a-z0-9.-]+(:[0-9]+)?" scripts/onprem-verify.mjs scripts/diagnostics/*.mjs \
  | grep -vE "^[^:]+:[^:]+:\\s*(\\*|//|#|.*example\\.com|.*test|.*localhost)" || echo "PASS: 하드코딩 0건"

# 5. token redaction
node scripts/diagnostics/nextauth-csrf-trace.mjs --dry-run --json \
  | grep -E "csrfToken['\":]\\s*['\"][a-f0-9]{16,}" && echo "FAIL: redaction" || echo "PASS: redacted"

# 6. SSOT 회귀
bash scripts/verify-routing-origin.sh

# 7. ADR-0006 Recurrence 섹션 존재
grep -c "Recurrence Response\\|재발 시 1차 응답" docs/adr/0006-frontend-backend-routing-model.md  # ≥ 1

# 8. tech-debt-tracker 종결 표시
grep -E "^\\- \\[x\\].*nextauth-csrf §S3" .claude/exec-plans/tech-debt-tracker.md
grep -E "^\\- \\[x\\].*nextauth-csrf §J1" .claude/exec-plans/tech-debt-tracker.md

# 9. shared-constants 단위 테스트
pnpm --filter @equipment-management/shared-constants run test -- api-routing
```

## 의사결정 로그 (Planner 라운드)

1. **2026-05-05 lan.conf rename vs 헤더 주석**: rename 시 5+ 위치(verify-routing-origin.sh × 3, SKILL.md, api-routing.ts 주석, lan.override.yml, onprem.override.yml) 동시 갱신 필요. blast radius 〉 명확성 이득 → 헤더 주석 채택. SSOT 명시(`api-routing.ts`)는 이미 두 파일을 모두 언급하고 있어 grep으로 추적 가능.
2. **2026-05-05 Bash vs Node 선택**: Set-Cookie SameSite/HttpOnly/Secure 파싱은 Bash regex가 fragile. JSON shape 검증·timeout·redaction 모두 Node가 자연스러움. ultrareview-* 패턴 따름.
3. **2026-05-05 invariants 위치**: smoke와 trace가 분리된 파일이지만 invariants는 동일 — JSON SSOT 1개로 통합. JS 모듈로 만들지 않은 이유: 향후 다른 언어(예: Go diagnostics) 재사용 가능성.
4. **2026-05-05 dry-run 모델**: CI에서 onprem 미접근 환경에서도 회귀 차단(스크립트 자체 deserialize 오류, env 검증 누락 등). `--dry-run` 시 fetch는 skip하되 invariant JSON 로드·env 검증은 수행.
5. **2026-05-05 Phase 5 보수성**: pre-push hook 통합은 solo trunk-based 원칙(`.husky/pre-push`는 tsc/test만, 외부 네트워크 의존 금지)과 어긋남. 운영자 manual chain + ONPREM_DEPLOYMENT.md 절차 갱신으로 대응.
6. **2026-05-05 redaction 정책**: NextAuth CSRF 토큰은 short-lived지만 production 로그/CI artifact에 누출되면 신뢰 경계 모호. `<redacted len=N>` 형식으로 길이 정보만 보존(트러블슈팅 시 길이 비정상 탐지 가능).

## Out of scope (Generator가 절대 건드리면 안 되는 것)

- 실제 onprem 서버 deploy 검증 (DNS·secret·호스트 권한 필요)
- NextAuth handler 코드(`apps/frontend/lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`) 수정
- Same-origin 모델 자체(ADR-0006) 변경 — 본 sprint는 ADR을 검증하는 인프라일 뿐
- nginx `lan.conf` rename(Phase 1 결정에 따라 헤더 주석만)
- `apps/frontend/lib/config/api-config.ts` 수정 — MEMORY.md 회귀 위험 명시(`grep -rn "INTERNAL_BACKEND_URL\\|API_BASE_URL"` 전체 영향 파악 없이 건드리면 ERR_INVALID_URL 회귀)
- backend `enableCors` 정책 — 본 sprint와 무관, ADR-0006 §Mitigations에서 이미 처리됨
- `verify-routing-origin.sh` 11 step 변경 — 이미 정착, 본 sprint는 보강이지 대체 아님

## Senior self-audit (pre-plan)

| 점검 항목 | 상태 |
|----------|------|
| SSOT — origin/port/host 모두 env에서 조회 | ✅ Phase 2/3에서 ONPREM_PUBLIC_ORIGIN/INTERNAL_BACKEND_URL만 사용, json invariants도 env 키 명시 |
| 하드코딩 — 0건 보장 | ✅ Verification command 4번이 grep으로 강제 |
| Workflow 재사용 — docker compose 명령 재구현 안 함 | ✅ 기존 `compose:onprem` 그대로, verify는 별도 진입점 |
| 성능 — < 10s | ✅ Promise.all + 5s timeout, 4 체크 max |
| 보안 — 토큰 redaction | ✅ csrf-invariants.json `redactionPatterns` SSOT, 두 스크립트 공유 |
| Old API 회귀 — middleware.ts/v4 패턴 도입 | ✅ proxy.ts만 참조, `app/api/auth/[...nextauth]/route.ts` v5 named exports 그대로 |
| Stale-fact — ADR-0006 본문 read 완료 | ✅ Pre-plan에서 95 라인 전체 읽음, `Recurrence Response` 절 신설은 기존 구조 보존 |
| Memory awareness — api-config.ts 수정 시 grep-impact | ✅ Out of scope에 명시, Generator가 건드리지 않음 |
| L0 inferred — 진단 스크립트가 만질 파일 사전 식별 | ✅ Phase 3에서 `apps/frontend/app/sw.ts`, `apps/frontend/lib/auth.ts` 정적 read만 (수정 X) |
| 관측성 — JSON 출력 + tmp/diagnostics/ artifact | ✅ Phase 3에서 timestamped trace.json 저장 |
| WCAG SC | N/A (script-only sprint, UI 변경 없음) |
| CAS 영향 | N/A (DB 미관여) |
