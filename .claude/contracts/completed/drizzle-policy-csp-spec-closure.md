# 스프린트 계약: Drizzle Manual SQL Policy 결빙 + CSP Violation E2E Wire

## 생성 시점

2026-05-09T00:00:00+09:00

## 슬러그

`drizzle-policy-csp-spec-closure`

## 처리 대상

`.claude/exec-plans/tech-debt-tracker.md` 라인 56·57 — "2026-04-17 harness: QR Phase 1-3 후속 정리"

- **라인 56** (🟢 LOW): 실제 브라우저 동선 수동 검증 — automated phase1/2/3 spec + 신규 CSP wire spec으로 OBSOLETE 종결
- **라인 57** (🟢 LOW): Drizzle snapshot 재생성 — ADR-0010 채택으로 WON'T-DO by design 종결

## 관련 ADR

- **신규**: `docs/adr/0010-drizzle-manual-sql-policy.md` (본 sprint에서 결빙)
- **참조**: ADR-0007/0008 (ADR 형식/Trigger Conditions 패턴)

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

#### Drizzle 정책 결빙 (ADR + Doc)

1. **ADR-0010 신설 + 형식 정합**
   - 검증: `test -f docs/adr/0010-drizzle-manual-sql-policy.md` 종료 코드 0
   - 검증 (분리 grep — Prettier 멀티라인 우회):
     - `grep -c "## Context" docs/adr/0010-drizzle-manual-sql-policy.md` ≥ 1
     - `grep -c "## Decision" docs/adr/0010-drizzle-manual-sql-policy.md` ≥ 1
     - `grep -c "## Consequences" docs/adr/0010-drizzle-manual-sql-policy.md` ≥ 1
     - `grep -ciE "Trigger Conditions for Reconsideration|재검토" docs/adr/0010-drizzle-manual-sql-policy.md` ≥ 1
     - `grep -c "## References" docs/adr/0010-drizzle-manual-sql-policy.md` ≥ 1
   - 검증 (정책 본문 keyword):
     - `grep -ciE "manual SQL|수동 SQL" docs/adr/0010-drizzle-manual-sql-policy.md` ≥ 2
     - `grep -ciE "drizzle-kit generate" docs/adr/0010-drizzle-manual-sql-policy.md` ≥ 1 (금지 명시 위해)
     - `grep -ciE "journal append|_journal\.json" docs/adr/0010-drizzle-manual-sql-policy.md` ≥ 1
     - `grep -c "__drizzle_migrations" docs/adr/0010-drizzle-manual-sql-policy.md` ≥ 1
   - 검증 (회피 시도 3건 명시): `grep -ciE "stdin|TTY|--force|snapshot 재생성|interactive" docs/adr/0010-drizzle-manual-sql-policy.md` ≥ 2

2. **DRIZZLE_MIGRATIONS.md 현재 상태 반영**
   - 검증: `grep -c "0057\|journal 58\|58 entries" docs/development/DRIZZLE_MIGRATIONS.md` ≥ 1
   - 검증: `grep -c "0025까지\|snapshot 26" docs/development/DRIZZLE_MIGRATIONS.md` ≥ 1

3. **DRIZZLE_MIGRATIONS.md §1 모순 지시 제거**
   - 검증: `grep -c "반드시.*drizzle-kit generate" docs/development/DRIZZLE_MIGRATIONS.md` 0건
   - 검증: `grep -c "스키마 변경은 반드시" docs/development/DRIZZLE_MIGRATIONS.md` 0건

4. **DRIZZLE_MIGRATIONS.md ADR-0010 백링크**
   - 검증: `grep -c "ADR-0010" docs/development/DRIZZLE_MIGRATIONS.md` ≥ 2
   - 검증: `grep -ciE "manual SQL|수동 SQL" docs/development/DRIZZLE_MIGRATIONS.md` ≥ 3
   - 검증 (4단계 절차 keyword 분리):
     - `grep -ciE "_journal\.json" docs/development/DRIZZLE_MIGRATIONS.md` ≥ 1
     - `grep -c "__drizzle_migrations" docs/development/DRIZZLE_MIGRATIONS.md` ≥ 1
     - `grep -ciE "sha256|hash" docs/development/DRIZZLE_MIGRATIONS.md` ≥ 1

5. **DRIZZLE_MIGRATIONS.md 기존 운영 자산 보존**
   - 검증 (§6 uuid-cast 가드): `grep -c "0006_gray_sersi\|uuid_cast_guard\|pre_NNNN_uuid_cast_guard" docs/development/DRIZZLE_MIGRATIONS.md` ≥ 1
   - 검증 (§5 squash fallback): `grep -ciE "squash|baseline" docs/development/DRIZZLE_MIGRATIONS.md` ≥ 2

#### CSP Violation E2E Wire

6. **`apps/frontend/tests/e2e/security/csp-violation.spec.ts` 존재 + 3 MUST test case**
   - 검증: `test -f apps/frontend/tests/e2e/security/csp-violation.spec.ts` 종료 코드 0
   - 검증: `grep -cE "^\s*test\(" apps/frontend/tests/e2e/security/csp-violation.spec.ts` ≥ 3
   - 검증 (case keyword 분리):
     - `grep -ciE "Content-Security-Policy|csp.*header" apps/frontend/tests/e2e/security/csp-violation.spec.ts` ≥ 1 (TC-1)
     - `grep -ciE "Report-To|report-uri|report-to" apps/frontend/tests/e2e/security/csp-violation.spec.ts` ≥ 1 (TC-2)
     - `grep -ciE "csp-report.*body|csp-violation|legacy.*reporting|reporting.*api" apps/frontend/tests/e2e/security/csp-violation.spec.ts` ≥ 1 (TC-3)

7. **CSP spec — SSOT import**
   - 검증: `grep -c "from '@equipment-management/shared-constants'" apps/frontend/tests/e2e/security/csp-violation.spec.ts` ≥ 1
   - 검증: `grep -c "API_ENDPOINTS\.SECURITY\.CSP_REPORT" apps/frontend/tests/e2e/security/csp-violation.spec.ts` ≥ 1
   - 검증: `grep -c "BASE_URLS" apps/frontend/tests/e2e/security/csp-violation.spec.ts` ≥ 1

8. **CSP spec — 하드코딩 URL 0건**
   - 검증:
     ```bash
     grep -nE "https?://[a-z0-9.-]+(:[0-9]+)?" apps/frontend/tests/e2e/security/csp-violation.spec.ts \
       | grep -vE "BASE_URLS|forbidden\.example\.invalid|^[^:]+:[^:]+:\s*(\*|//|#)"
     ```
     출력 0건. (`forbidden.example.invalid`는 RFC 6761 reserved TLD, intentional violation trigger)

9. **CSP spec — Old API 회귀 차단**
   - 검증 (deprecated):
     - `grep -nE "page\.route\(" apps/frontend/tests/e2e/security/csp-violation.spec.ts` 0건
     - `grep -nE "middleware\.ts|next-auth/middleware|getServerSideProps" apps/frontend/tests/e2e/security/csp-violation.spec.ts` 0건
     - `grep -nE "useFormState\b" apps/frontend/tests/e2e/security/csp-violation.spec.ts` 0건
   - 검증 (Playwright 최신):
     - `grep -ciE "request\.|page\.goto|expect\.poll|expect\(" apps/frontend/tests/e2e/security/csp-violation.spec.ts` ≥ 3

10. **CSP spec — Lint + Type 통과**
    - 검증: `pnpm --filter frontend run lint -- apps/frontend/tests/e2e/security/csp-violation.spec.ts` 종료 코드 0
    - 검증: `pnpm tsc --noEmit` 종료 코드 0

#### tech-debt-tracker 종결

11. **tech-debt-tracker 라인 56/57 종결 마크 + 사유 인용**
    - 검증 (1차):
      - `grep -E "^- \[x\].*수동 검증" .claude/exec-plans/tech-debt-tracker.md` 매칭 ≥ 1
      - `grep -E "^- \[x\].*Drizzle snapshot 재생성" .claude/exec-plans/tech-debt-tracker.md` 매칭 ≥ 1
    - 검증 (2차 OR-fallback): tracker `[x]` 라인이 다른 세션 cleanup으로 archive로 이동된 경우 → archive batch row가 두 항목 사유 모두 인용:
      - `grep -E "drizzle-policy-csp-spec-closure" .claude/exec-plans/tech-debt-tracker-archive.md | grep -ciE "수동 검증|csp wire|csp-violation"` ≥ 1
      - `grep -E "drizzle-policy-csp-spec-closure" .claude/exec-plans/tech-debt-tracker-archive.md | grep -ciE "snapshot|ADR-0010|won.?t.?do"` ≥ 1
    - 검증 (slug 인용): `grep -c "drizzle-policy-csp-spec-closure" .claude/exec-plans/tech-debt-tracker.md` ≥ 2 OR archive에 ≥ 1

12. **archive batch row 등재**
    - 검증: `grep -c "drizzle-policy-csp-spec-closure" .claude/exec-plans/tech-debt-tracker-archive.md` ≥ 1
    - 검증: 5월 batch 표 안 위치 — `awk '/2026년 5월/,/^## /' .claude/exec-plans/tech-debt-tracker-archive.md | grep -c "drizzle-policy-csp-spec-closure"` ≥ 1

#### 정합성 + 안전

13. **`pnpm tsc --noEmit` 에러 0**
    - 검증: 종료 코드 0

14. **backend test 회귀 0건**
    - 검증: `pnpm --filter backend test --testPathPattern=security` 종료 코드 0

15. **MEMORY.md 인덱스 등록**
    - 검증: `grep -c "drizzle-policy-csp-spec-closure" /home/kmjkds/.claude/projects/-home-kmjkds-equipment-management-system/memory/MEMORY.md` ≥ 1
    - 검증 위치: `awk '/## 프로젝트 이력/,/^## /' /home/kmjkds/.claude/projects/-home-kmjkds-equipment-management-system/memory/MEMORY.md | grep -c "drizzle-policy-csp-spec-closure"` ≥ 1

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음

16. **CSP spec — 실 violation 트리거 + backend ingest (TC-4)**
    - 검증: `pnpm --filter frontend exec playwright test security/csp-violation --project=chromium --workers=1` 출력에서 TC-4가 PASS 또는 명시적 SKIP
    - 검증 (코드 keyword): `grep -ciE "expect\.poll|page\.evaluate.*createElement|forbidden\.example\.invalid" apps/frontend/tests/e2e/security/csp-violation.spec.ts` ≥ 1
    - FAIL 시 tech-debt 1건 등록 + 통과

17. **CSP spec — chromium 외 브라우저 미실행 (의도)**
    - 검증: spec 헤더 의도 주석 — `grep -ciE "chromium.?only|단독 실행|firefox.*skip|webkit.*skip" apps/frontend/tests/e2e/security/csp-violation.spec.ts` ≥ 1

18. **DRIZZLE_MIGRATIONS.md §4 (CI 체크) 갱신**
    - 검증: `grep -ciE "drizzle-kit generate.*감지|snapshot.*변경 0건|generate.*ci.*fail|CI.*generate" docs/development/DRIZZLE_MIGRATIONS.md` ≥ 1

19. **CSP spec wall time < 60s on chromium**
    - 검증: `time pnpm --filter frontend exec playwright test security/csp-violation --project=chromium --workers=1` 의 real time < 60s

20. **ADR-0010 References 인용**
    - 검증 (분리 grep):
      - `grep -c "ADR-0002" docs/adr/0010-drizzle-manual-sql-policy.md` ≥ 1
      - `grep -ciE "DRIZZLE_MIGRATIONS" docs/adr/0010-drizzle-manual-sql-policy.md` ≥ 1
      - `grep -ciE "feedback_drizzle_kit_interactive_prompt|memory.*feedback" docs/adr/0010-drizzle-manual-sql-policy.md` ≥ 1

## 적용 verify 스킬 (Evaluator 자동 선택)

- `verify-hardcoding` — CSP spec 하드코딩 0건 강제 (criterion 8)
- `verify-ssot` — API_ENDPOINTS.SECURITY.CSP_REPORT 단일 진입점 (criterion 7)
- `verify-nextjs` — proxy.ts 패턴 회귀 차단 (criterion 9)
- `verify-e2e` — Playwright 최신 API + storageState 패턴 (criterion 9)
- `review-architecture` — ADR-0010 vs ADR-0002 충돌 / doc 모순 해소 검증

## 종료 조건

- **MUST 1-15** 전체 PASS → 성공 → exec-plan/contract `completed/` 이동
- **SHOULD 16-20** 일부 FAIL → tech-debt 등록 후 통과 (loop 비차단)
- TC-4 flaky 시 SHOULD 16에 따라 tech-debt 등록 + 통과

## 비고

- 본 sprint는 **정책 결빙 + e2e wire 검증** 목적. schema 변경 0건 / production 코드 변경 0건.
- ADR-0010은 ADR-0002 (Drizzle ORM 채택)을 *보완*함 (대체 아님). 본 레포의 운영 패턴이 업계 표준에서 의도적으로 이탈한 부분을 결빙.
- private memory feedback 정책의 ADR 승격은 review-architecture의 "Doc-vs-Memory 모순 종결" 사례로 향후 재사용 가능.
- CSP spec 인증 모델은 proxy.ts 코드 리딩 결과(CSP는 auth success path만 emit)에 따라 storageState 의존 — auth.setup.ts 사전 실행 필수.
- contract grep 패턴은 모두 분리 카운트 사용 — Prettier 멀티라인 우회 방지(`feedback_prettier_multiline_grep.md`).
- Drizzle SQL 변경 0건이므로 `drizzle/` 하위 파일 read 외 write 발생 시 즉시 FAIL.
