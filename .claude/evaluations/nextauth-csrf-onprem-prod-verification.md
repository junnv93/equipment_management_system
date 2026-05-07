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
