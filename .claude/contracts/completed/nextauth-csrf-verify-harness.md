# 스프린트 계약: NextAuth CSRF Verify Harness — onprem smoke + 영구 진단 (§S3 + §J1)

## 생성 시점

2026-05-05T00:00:00+09:00

## 슬러그

`nextauth-csrf-verify-harness`

## 처리 대상

`.claude/exec-plans/tech-debt-tracker.md` 라인 85·86

- **§S3** (🟡 MEDIUM): docker-compose-onprem-prod-manual-verification — 수동 curl을 SSOT 자동 smoke로 승격
- **§J1** (🟢 LOW): phase-0-reproduction-actual-network-trace — 재현 시나리오를 영구 진단 harness로 결빙

## 관련 ADR

`docs/adr/0006-frontend-backend-routing-model.md` (Same-Origin Reverse-Proxy) — 본 sprint는 ADR을 **검증**하는 인프라 결빙. ADR 변경 아님.

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

#### 인프라 진입점 (§S3)

1. **`pnpm compose:onprem:verify` 진입점 존재**
   - 검증: `grep -E '"compose:onprem:verify"\s*:' package.json` 매칭 ≥ 1
   - 검증: `node $(grep -oE '"compose:onprem:verify": "[^"]+"' package.json | sed -E 's/.*: "node ([^ "]+).*/\1/') --dry-run --json` 종료 코드 0

2. **smoke 스크립트가 ADR-0006 invariant를 자동 검증**
   - 검증: `scripts/onprem-verify.mjs` 존재
   - 검증: 스크립트 내 다음 4 체크 keyword 존재:
     - `grep -c '/api/auth/csrf' scripts/onprem-verify.mjs` ≥ 1
     - `grep -c '/api/auth/session' scripts/onprem-verify.mjs` ≥ 1
     - `grep -c '/api/auth/providers' scripts/onprem-verify.mjs` ≥ 1
     - `grep -ciE 'samesite|httponly|set-cookie' scripts/onprem-verify.mjs` ≥ 1
   - 검증: backend 분기 sanity (NextAuth handler에 backend가 응답하면 FAIL) 명시 — `grep -cE '/api/auth/login|backend.*sanity|分기.*sanity|disjoint' scripts/onprem-verify.mjs` ≥ 1

3. **fail-close on missing env (LIVE mode)**
   - 검증: `unset ONPREM_PUBLIC_ORIGIN; node scripts/onprem-verify.mjs; echo $?` 출력 마지막 줄이 `2` (LIVE 모드 fail-close)
   - 검증 (의도 검증): `unset ONPREM_PUBLIC_ORIGIN; node scripts/onprem-verify.mjs --dry-run --json | head -3 | grep -c '"DRY_RUN_PASS"'` ≥ 1 (dry-run 모드는 env 없이도 정적 검증 통과 — CI 회귀 차단 용도)
   - **rationale**: trace.mjs와 동일한 CLI 계약 의미론. fail-close는 LIVE에서, dry-run은 CI 친화적 정적 검사. iter 1 evaluator 발견(2026-05-05) 후 명시화.

4. **하드코딩 origin 0건**
   - 검증: 다음 grep이 0건이어야 함 (예외: 헤더 주석, example, localhost, test):
     ```bash
     grep -nE 'https?://[a-z0-9.-]+(:[0-9]+)?' scripts/onprem-verify.mjs scripts/diagnostics/*.mjs \
       | grep -vE '^[^:]+:[^:]+:\s*(\*|//|#|.*example\.com|.*test|.*localhost|.*\bfile:|.*placeholder)'
     ```

#### 영구 진단 harness (§J1)

5. **`scripts/diagnostics/nextauth-csrf-trace.mjs` 존재 + dry-run 통과**
   - 검증: `node scripts/diagnostics/nextauth-csrf-trace.mjs --dry-run` 종료 코드 0
   - 검증: 스크립트가 다음 추적 항목 keyword 포함:
     - 환경변수 stack: `grep -cE 'NEXT_PUBLIC_API_URL|INTERNAL_BACKEND_URL|NEXTAUTH_URL|ONPREM_PUBLIC_ORIGIN' scripts/diagnostics/nextauth-csrf-trace.mjs` ≥ 4
     - SW 검사: `grep -cE 'sw\.ts|service.?worker|NetworkOnly' scripts/diagnostics/nextauth-csrf-trace.mjs` ≥ 1
     - proxy header: `grep -cE 'X-Forwarded-Proto|X-Forwarded-Host|X-Real-IP' scripts/diagnostics/nextauth-csrf-trace.mjs` ≥ 2
     - cookie domain: `grep -ciE 'cookie.*domain|domain.*cookie|set-cookie' scripts/diagnostics/nextauth-csrf-trace.mjs` ≥ 1
     - invariant 비교: `grep -cE 'invariant|breach|ADR-0006' scripts/diagnostics/nextauth-csrf-trace.mjs` ≥ 2

6. **머신 판독 가능 invariant SSOT (JSON, not markdown)**
   - 검증: `scripts/diagnostics/csrf-invariants.json` 존재
   - 검증: `node -e "JSON.parse(require('fs').readFileSync('scripts/diagnostics/csrf-invariants.json'))"` 종료 코드 0
   - 검증: 다음 키 존재 (분리 카운트로 prettier 우회):
     - `grep -c '"nextAuthHandlerPaths"' scripts/diagnostics/csrf-invariants.json` ≥ 1
     - `grep -c '"cookieInvariants"' scripts/diagnostics/csrf-invariants.json` ≥ 1
     - `grep -c '"requiredEnvVars"' scripts/diagnostics/csrf-invariants.json` ≥ 1
     - `grep -c '"redactionPatterns"' scripts/diagnostics/csrf-invariants.json` ≥ 1
   - 검증: smoke + trace 두 스크립트 모두 invariants JSON을 import (분리 grep):
     - `grep -c 'csrf-invariants.json' scripts/onprem-verify.mjs` ≥ 1
     - `grep -c 'csrf-invariants.json' scripts/diagnostics/nextauth-csrf-trace.mjs` ≥ 1

#### ADR-0006 + tech-debt 종결

7. **ADR-0006 본문에 "Recurrence Response" 절 추가 + 진단 스크립트 링크**
   - 검증: `grep -c "Recurrence Response\|재발 시 1차 응답" docs/adr/0006-frontend-backend-routing-model.md` ≥ 1
   - 검증: `grep -c "scripts/diagnostics/nextauth-csrf-trace.mjs" docs/adr/0006-frontend-backend-routing-model.md` ≥ 1

8. **tech-debt-tracker §S3 + §J1 종결 마크 + 검증 명령 인용**
   - 검증 (1차): `grep -E "^- \[x\].*nextauth-csrf §S3" .claude/exec-plans/tech-debt-tracker.md` 매칭 ≥ 1
   - 검증 (1차): `grep -E "^- \[x\].*nextauth-csrf §J1" .claude/exec-plans/tech-debt-tracker.md` 매칭 ≥ 1
   - 검증 (2차 OR-fallback): tracker `[x]` 라인이 다른 세션 자동 정리로 archive로 이동된 경우 → archive에 batch row가 §S3·§J1 모두 인용하면 PASS. `grep -E "nextauth-csrf-verify-harness" .claude/exec-plans/tech-debt-tracker-archive.md | grep -c "§S3"` ≥ 1 + `... | grep -c "§J1"` ≥ 1
   - 검증: 두 라인 모두 완료 메시지에 `nextauth-csrf-verify-harness` 또는 `compose:onprem:verify` 또는 `csrf-trace.mjs` 중 하나를 인용
   - **rationale**: tracker [x] 라인은 본 sprint 종결 직후 등록된 SSOT 표기. 후속 세션의 cleanup 자동화가 tracker [x] 라인을 archive batch row로 합쳐 정리할 수 있으므로(2026-05-06 발견) archive 인용을 OR-fallback으로 인정.

9. **Batch 이력 표 + archive 갱신**
   - 검증: `grep -c "nextauth-csrf-verify-harness" .claude/exec-plans/tech-debt-tracker.md` ≥ 1 (Batch 표)
   - 검증: `grep -c "nextauth-csrf-verify-harness" .claude/exec-plans/tech-debt-tracker-archive.md` ≥ 1

#### nginx 네이밍 모호성 해결

10. **`infra/nginx/lan.conf`에 LAN+onprem 공용 사유 헤더 주석**
    - 검증: 분리 grep:
      - `grep -ciE "공용|shared|onprem.*lan|lan.*onprem|lan \+ on-prem" infra/nginx/lan.conf` ≥ 1
    - 검증: `infra/compose/onprem.override.yml` + `infra/compose/lan.override.yml`의 `lan.conf` mount 인근에도 동일 사실 주석 (각 1건):
      - `grep -B1 "lan\.conf:/etc/nginx/nginx.conf" infra/compose/onprem.override.yml | grep -ciE "공용|shared|lan|on-prem"` ≥ 1
      - `grep -B1 "lan\.conf:/etc/nginx/nginx.conf" infra/compose/lan.override.yml | grep -ciE "공용|shared|lan|on-prem"` ≥ 1

#### 정합성 + 안전

11. **`pnpm tsc --noEmit` 에러 0**
    - 백엔드: `pnpm --filter backend run type-check` 종료 코드 0
    - 프론트엔드: `pnpm --filter frontend run type-check` 종료 코드 0

12. **Lint 통과**
    - `pnpm --filter backend run lint` 종료 코드 0
    - `pnpm --filter frontend run lint` 종료 코드 0

13. **Token/cookie redaction 강제**
    - 검증: `node scripts/diagnostics/nextauth-csrf-trace.mjs --dry-run --json | grep -E "csrfToken['\":]\\s*['\"][a-f0-9]{16,}"` 0건 (raw csrf 토큰 노출 없음)
    - 검증: 두 스크립트 redaction 함수 keyword 존재 (분리 grep):
      - `grep -ciE "redact|<redacted len=" scripts/onprem-verify.mjs` ≥ 1
      - `grep -ciE "redact|<redacted len=" scripts/diagnostics/nextauth-csrf-trace.mjs` ≥ 1

14. **Old API 회귀 차단**
    - 검증: `grep -nE "middleware\.ts|next-auth/middleware|getServerSideProps" scripts/onprem-verify.mjs scripts/diagnostics/*.mjs` 0건 (Next.js 16 proxy.ts + Auth.js v5만 참조)
    - 검증: `pages/api/auth` 패턴 도입 0건: `grep -nE "pages/api/auth" scripts/*.mjs scripts/diagnostics/*.mjs` 0건

15. **shared-constants invariant 회귀**
    - 검증: `pnpm --filter @equipment-management/shared-constants run test -- api-routing` 종료 코드 0
    - 검증: `bash scripts/verify-routing-origin.sh` 종료 코드 0 (ADR-0006 4-layer SSOT)

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음

16. **Phase 5 CI 통합 결정 기록**
    - 검증: `grep -ciE "ci 통합|integration|deploy\.sh|github.*workflow|recurrence.*response|first.?response" docs/adr/0006-frontend-backend-routing-model.md scripts/onprem-verify.mjs` ≥ 2
    - 통과 모델: pre-push 통합 안 함 + 운영 chain 권장 + 결정 사유 ADR-0006 또는 script 헤더에 명시
    - FAIL 시 tech-debt-tracker에 "CI 통합 절차 미정착" 1건 등록

17. **`scripts/diagnostics/README.md` 1차 응답자 절차**
    - 검증: 파일 존재 + 다음 keyword 분리 grep:
      - `grep -ciE "재발|recurrence|first.?response|1차 응답" scripts/diagnostics/README.md` ≥ 1
      - `grep -c "nextauth-csrf-trace.mjs" scripts/diagnostics/README.md` ≥ 1

18. **smoke total wall time < 10s on dry-run**
    - 검증: `time node scripts/onprem-verify.mjs --dry-run` 의 real time < 10s (manual visual check OK)

19. **`infra/ONPREM_DEPLOYMENT.md` 권장 절차 갱신**
    - 검증: `grep -c "compose:onprem:verify" infra/ONPREM_DEPLOYMENT.md` ≥ 1
    - 기존 curl 레시피는 fallback으로 보존(완전 삭제 아님)

20. **`.gitignore`에 `tmp/diagnostics/`** (이미 `tmp/`이면 no-op)
    - 검증: `grep -E '^tmp/?(diagnostics)?$' .gitignore` 매칭 ≥ 1

## 적용 verify 스킬 (Evaluator 자동 선택)

- `verify-routing-origin` — ADR-0006 4-layer SSOT 회귀 차단 (필수)
- `verify-ssot` — 진입점/SSOT 분산 점검
- `verify-hardcoding` — 하드코딩 origin 0건 강제 (criterion 4와 중복 OK, 다중 방어선)
- `verify-security` — secret/token redaction 정책 (criterion 13)
- `review-architecture` — 진단 harness가 다른 모듈에 부주의한 의존성을 만들지 않는지

## 종료 조건

- **MUST 1-15** 전체 PASS → 성공 → `.claude/exec-plans/active/` → `completed/` 이동, contract `.claude/contracts/` → `.claude/contracts/completed/` 이동
- **SHOULD 16-20** 일부 FAIL → tech-debt-tracker에 1건씩 등록 후 통과 (loop 비차단)
- 실제 onprem 서버 검증은 본 sprint 범위 외 (BLOCKED 명시) — 다음 배포 직전 운영자가 수동 실행

## 비고 (Planner 메모)

- 본 sprint는 **인프라 결빙**이 목적. 실제 onprem 응답 검증은 서버/DNS/secret/포트 배정이 완료된 다음 배포 직전에 운영자가 `pnpm compose:onprem:verify`로 수행한다.
- `infra/nginx/lan.conf`는 git history 보존을 위해 rename하지 않음 — 헤더 주석으로 사실관계만 명시. rename 회귀 위험(verify-routing-origin.sh × 3 + SKILL.md + api-routing.ts 주석 + compose 2개)이 명확성 이득 초과.
- ADR-0006의 핵심 invariant(`BACKEND_AUTH_PATHS ∩ NEXTAUTH_HANDLER_PATHS = ∅`)는 `packages/shared-constants/__tests__/api-routing.spec.ts`에서 별도 테스트되며 본 sprint와 disjoint(중복 검증 OK).
- contract grep 패턴은 모두 분리 카운트(`grep -c "key1" + grep -c "key2"`) 사용 — Prettier 멀티라인 우회 방지(MEMORY.md feedback_prettier_multiline_grep).
