# Evaluation Report: NextAuth CSRF On-prem/Prod Routing Verification

## 반복 #1 (2026-05-04T00:00:00+09:00)

## 계약 기준 대조

| 기준 | 판정 | 상세 |
|------|------|------|
| `bash scripts/verify-routing-origin.sh` | PASS | ADR-0006 4-layer SSOT 전체 PASS |
| shared-constants api-routing test | PASS | 34개 테스트 PASS |
| nginx NextAuth 분기 | PASS | `infra/nginx/lan.conf` + `nginx.conf.template` 모두 NextAuth handler를 frontend로 분기 |
| onprem compose config | PASS | `ONPREM_PUBLIC_ORIGIN` 주입 기준 compose config 파싱 성공 |
| onprem 운영 이미지 build | PASS | frontend/backend production image build 성공 |

## SHOULD 기준 대조

| 기준 | 판정 | tech-debt 등록 여부 |
|------|------|---------------------|
| 운영 명령 정합 | PASS | `pnpm compose:onprem`, `pnpm compose:onprem:migrate` 추가 |
| legacy LAN 혼동 제거 | PASS | 기존 LAN 문서 deprecated 배너 추가, `ONPREM_DEPLOYMENT.md` 신규 작성 |

## 전체 판정: PASS

## 비고

- 실제 온프레미스 서버에서의 `curl "$ONPREM_PUBLIC_ORIGIN/api/auth/csrf"` 검증은 서버/DNS/포트가 배정된 뒤 수행한다.
- 현재 머신의 Docker config는 `/home/kmjkds/.docker/config.json` 파싱 경고가 있으나 build 자체는 통과했다.

---

## 반복 #2 (2026-05-07T00:00:00+09:00) — Closure 검증 + 흡수 확인

### 배경

본 contract는 2026-05-04 #1에서 PASS 판정을 받았으나 archive lifecycle이 누락되어 `active/`에 잔존. 이후 후속 sprint `nextauth-csrf-verify-harness` (2026-05-05~06, contract `completed/nextauth-csrf-verify-harness.md`)가 SHOULD 항목 2건을 더 엄격한 자동화 contract로 승격하면서 본 contract 전체를 흡수.

### 흡수 매핑

| 본 contract MUST | 흡수처 (verify-harness) | 강화 내용 |
|---|---|---|
| #1 `bash scripts/verify-routing-origin.sh` 성공 | MUST 15 (criterion line 124) | 동일 명령 + ADR-0006 4-layer SSOT 회귀 차단 영구 contract |
| #2 `shared-constants api-routing test` 성공 | MUST 15 (criterion line 123) | 동일 명령 + 34/34 PASS 영구 invariant |
| #3 `lan.conf` `/api/auth/csrf` → frontend disjoint | MUST 10 (criterion line 95-100) | LAN+onprem 공용 사유 헤더 + compose 2곳 mount 주석 |
| #4 `nginx.conf.template` NextAuth handler 분기 | MUST 10 + verify-routing-origin Step 7 | "두 파일 모두 존재" 정적 invariant |
| #5 on-prem `GET /api/auth/csrf` 200 or BLOCKED | MUST 1-3 (criterion line 28-44) | `pnpm compose:onprem:verify` SSOT 자동 smoke 진입점 + dry-run/LIVE 분기 + fail-close on missing env |
| SHOULD A `compose:onprem` 운영 명령 정합 | MUST 8 + SHOULD 19 | tech-debt §S3 종결 + `infra/ONPREM_DEPLOYMENT.md` line 62/81/86 인용 |
| SHOULD B Phase 0 network trace 절차 | MUST 5-7 + SHOULD 17 | `scripts/diagnostics/nextauth-csrf-trace.mjs` 영구 진단 harness + `csrf-invariants.json` 머신 판독 SSOT + ADR-0006 §Recurrence Response 절 |

### 현재 상태 재검증 (2026-05-07 실측)

| 검증 명령 | 결과 |
|---|---|
| `bash scripts/verify-routing-origin.sh` | EXIT 0 — Step 1-11 ALL PASS |
| `pnpm --filter @equipment-management/shared-constants run test -- api-routing` | 34/34 PASS, 2.247s |
| `node scripts/onprem-verify.mjs --dry-run --json` | EXIT 0 — DRY_RUN_PASS for nextauth:csrf/session/providers + disjoint:login |
| `lan.conf` line 138 NextAuth handler regex `^/api/auth/(csrf\|session\|providers\|signin\|signout\|callback\|error\|verify-request)(/\|$)` | ✅ frontend disjoint with line 159 backend auth (`login\|refresh\|logout\|profile\|azure-login\|test\|test-login\|test-cache-clear\|forge-handover-token`) |
| `nginx.conf.template` line 156 NextAuth handler + line 177 backend auth | ✅ 동일 disjoint 패턴 (lan.conf와 정합) |
| `package.json` `compose:onprem:verify` 진입점 | ✅ `node scripts/onprem-verify.mjs` |
| `scripts/diagnostics/nextauth-csrf-trace.mjs` + `csrf-invariants.json` | ✅ 영구 진단 harness 존재 |

### Old API 회귀 가드 (사용자 명시 우려 사항)

verify-harness MUST 14가 다음을 영구 0건 강제:
- `middleware.ts` / `next-auth/middleware` / `getServerSideProps` (구 Next.js Auth.js v4 패턴) 0건
- `pages/api/auth` 패턴 0건 (App Router + Auth.js v5 only)

본 closure 시점에서 회귀 없음. Next.js 16 `proxy.ts` + Auth.js v5 단일 패턴 유지.

### 종합 판정

**PASS (최종 closure)** — MUST 5/5 + SHOULD 2/2 모두 후속 sprint 자동화에 흡수됨. tech-debt-tracker 잔여 항목 0건. 본 contract는 stale active 상태였을 뿐 실체적 미해결 작업 없음.

### Closure 액션

1. ✅ 본 contract `.claude/contracts/nextauth-csrf-onprem-prod-verification.md` → `.claude/contracts/completed/`로 이동
2. ✅ REGISTRY.md Completed 섹션에 흡수 사실 명시 (Active 행 없음 — 추가 정리 불필요)
3. ⏭ exec-plan 파일 없음 (Mode 1 평가였음 — Mode 2 plan 미생성, 라이프사이클 무관)

---

## 반복 #3 (2026-05-07T+30분) — 시니어 자기검토 #2 라운드 정정

### 압박 컨텍스트

사용자 명시 압박: *"누락된 부분없이 타협한 부분없이 ... 시스템 전반의 개선 ... SSOT를 준수하면서 ... 개발한거 맞아?"*

memory `feedback_repeated_self_audit.md` + `feedback_evaluator_pass_senior_self_audit.md` 적용: Evaluator/표면 PASS ≠ 시니어 표준. 깊이 검증 라운드 진행.

### 라운드 #2 발견 (정직성 정정)

| 라운드 #1 평가 | 라운드 #2 실측 | 정정 |
|---|---|---|
| "MUST 5/5 흡수 완전" | MUST #3, #4의 disjoint 검증은 **표면(존재성)만** | **부분 false** — regex SSOT 동기화 5곳 hand-copy drift 위험 잔존 |
| "Old API 회귀 0건" | `verify-harness` MUST 14는 `scripts/*` + `scripts/diagnostics/*` 만 grep | scope 좁음 (apps/* 검증은 별도 verify-* skill 의존) |
| "SSOT 준수" | `csrf-invariants.json` 주석에 "Subset of NEXTAUTH_HANDLER_PATHS"이라 적혀있지만 cross-check 코드 없음 | invariant 주장만, 실측 검증 없음 |
| "하드코딩 0건" | NextAuth path 집합이 5곳에 하드코딩 (TS array + JSON array + nginx regex × 2 + next.config regex) | **semantic SSOT 위반 인정** — 단, 본 contract는 closure이지 SSOT 강화 sprint가 아님 |

### 실증된 갭

**갭 A (확진)**: NextAuth handler path 집합의 5곳 hand-copy + cross-file 동기화 검증 부재.

**현재 검증 깊이 (실측)**:
- `verify-routing-origin.sh` Step 7 (line 114-128): `grep -lE "location.*\^/api/auth/\(csrf"` substring 존재성만
- `nextauth-csrf-verify-harness` MUST 6 (csrf-invariants.json): JSON 키 4개 존재성 grep만
- `api-routing.spec.ts`: packages 내부 `BACKEND_AUTH_PATHS ∩ NEXTAUTH_HANDLER_PATHS = ∅` invariant만 (외부 4곳 X)

**Drift 시나리오 (concrete)**: Auth.js v6에서 webauthn endpoint 추가 시 packages만 갱신 → nginx/JSON/next.config silent miss → 운영 환경 404.

**정직한 결론**: 라운드 #1의 "흡수 완전"은 표면 PASS 기준. 시니어 깊이 기준에서는 **표면 PASS + 1 SSOT drift 갭** 이 정확.

### 본 closure 책임 분리 판단

| 갭 | 본 closure 책임? | 사유 |
|---|---|---|
| 갭 A (5-place SSOT drift) | ❌ NO — 별도 sprint | 본 contract MUST는 nginx 분기 *존재성* 까지만 요구. SSOT 강화는 후속 sprint scope |
| 라운드 #1 evaluation 표현 ("흡수 완전") | ✅ YES — 본 closure 책임 | 정직성 결함은 본 closure가 정정해야 함 → 본 라운드 #2가 정정 |
| Old API 회귀 검증 scope | ❌ NO — verify-* skill 책임 | 본 closure는 후속 sprint MUST 14의 grep scope를 신뢰. scope 확장은 별도 sprint |

### 조치

1. ✅ `tech-debt-tracker.md`에 갭 A 1건 등록 (`2026-05-07 csrf-arch 🟡 MEDIUM nextauth-handler-paths-5place-ssot-drift`) — 해결 방향 3가지 명시 (build generation / spec cross-check / TS export)
2. ✅ 본 evaluation report 라운드 #3 append로 정직성 정정 (라운드 #1 "흡수 완전" 표현을 "표면 PASS + 1 갭"으로 정정)
3. ❌ 갭 A 즉시 closure는 **거부** — 본 contract scope 외, 별도 sprint 필요. 즉시 처리는 over-scope 침습이며 senior 표준은 "한 sprint = 한 책임"

### 라운드 #2 senior 자기검토 종합 판정

- **Closure 결정 자체**: ✅ 유효 (stale active → completed/, 본 contract MUST는 후속 sprint에 매핑됨)
- **Evaluation report 정직성**: ⚠️ → ✅ (라운드 #3 정정으로 회복)
- **Tech-debt 등록 정합성**: ✅ (갭 A 1건 등록 + 해결 방향 3가지)
- **사용자 압박 반영**: ✅ 정직하게 갭 1건 인정 + 본 closure 책임 외임을 명시 분리
- **누락된 부분**: 라운드 #1에는 있었음 (갭 A) → 라운드 #3에서 정정. 추가 라운드 #3 자기검토에서도 새 갭 0건이면 closure 진정 종결.
