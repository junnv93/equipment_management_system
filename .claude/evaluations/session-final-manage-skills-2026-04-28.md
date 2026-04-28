# 본 세션 manage-skills 분석 보고서 (2026-04-28)

분석 일자: 2026-04-28
세션 범위: dashboard-low-residual + ul-logo (변경 파일 7개)

---

## 패턴별 커버리지 분석

### Pattern 1: 테스트 파일 SSOT 상수 import 패턴
- 파일: `apps/frontend/lib/utils/__tests__/utilization-state.test.ts`
- 변경: hardcoded 70/40 → `UTILIZATION_THRESHOLDS` import해서 동적 boundary 계산
- 회귀 사례: 본 세션 1차 push 시 utilization SSOT 변경(70→60)을 테스트가 hardcoded 70으로 유지 → frontend test 6 fail
- 커버 스킬: verify-ssot Step 35(대시보드 임계값 SSOT)는 코드 사용처만 커버, 테스트 파일 미커버
- 판정: **Update verify-ssot — Step 40 신규** (P2)
- 신규 Step grep 패턴:
  ```
  # 테스트 파일에서 toBe(N)·toEqual(N) 매직넘버 vs SSOT 토큰 import 부재
  rg '__tests__|\.test\.(ts|tsx)$' --files | xargs rg -l 'toBe\([0-9]+\)|toEqual\([0-9]+\)'
  # cross-check: 같은 파일이 packages/shared-constants나 lib/config import하는지
  ```

### Pattern 2: Date.now mockReturnValueOnce + db.execute chain mocking
- 파일: `apps/backend/src/modules/dashboard/__tests__/dashboard.service.spec.ts`
- 패턴: getSystemHealth 단위 테스트에서 Date.now 시퀀스 시뮬레이션 + Drizzle chain mocking
- 일회성: 특정 메서드 시간 측정 테스트 패턴
- 일반화 어려움: 다른 서비스 메서드의 mocking 패턴은 다양
- 판정: **Defer** — 패턴 안정화 전, 일회성. 예외사항 #2 적용

### Pattern 3: holidayMap.size 의미 정확성 (연도 vs 월)
- 파일: `apps/frontend/components/dashboard/MiniCalendar.tsx`
- 변경: `holidayMap.size`(연도 전체 ~16개) → currentMonth prefix 필터 (월 단위)
- 일회성: 단일 컴포넌트 버그 fix
- 일반화 어려움: Map.size 잘못된 사용은 컨텍스트별 다양
- 판정: **Defer** — 단발성 fix. 예외사항 #2

### Pattern 4: ESLint config 디렉토리 단위 룰 예외
- 파일: `apps/frontend/eslint.config.mjs`
- 변경: `lib/brand-assets/**`에 `@next/next/no-img-element: 'off'` 추가
- 인프라성: ESLint 설정 자체
- 판정: **Defer** — 예외사항 #8 (CI/CD 인프라 설정)

### Pattern 5: @deprecated export alias 즉시 제거 패턴
- 파일: `apps/frontend/lib/api/dashboard-api.ts`
- 변경: `DashboardCheckoutScope` deprecated alias export 제거 (외부 소비처 0건 grep 후)
- 일반화 가능: 누적된 deprecated alias는 SSOT 분산 + import 혼동
- 회귀 위험: 다른 deprecated export가 외부 소비처 0건인데 잔존
- 판정: **Update verify-ssot — Step 41 신규** (P3 LOW)
- 신규 Step grep 패턴:
  ```
  # @deprecated alias export 검색 + 외부 소비처 grep
  rg '@deprecated.*\n.*export type [A-Z][A-Za-z]+ =' apps packages -A 1
  # 각 alias 이름으로 외부 사용처 검색 (소비처 0건이면 제거 권고)
  ```

### Pattern 6: lib/brand-assets/ 외부 브랜드 자산 컴포넌트
- 파일: `apps/frontend/lib/brand-assets/ul-logo.tsx` (신규)
- 패턴: 디자이너 공급 SVG `<img>` 단순 래퍼 + ariaHidden prop
- 이미 커버: verify-hardcoding Step 30이 `lib/brand-assets/` 모듈 분리 강제
- 보완 후보: 컴포넌트가 SVG path inline 직접 편집 금지 — grep 어렵고 일반화 X
- 판정: **이미 커버** — verify-hardcoding Step 30 충분

### Pattern 7: sidebar footer 외부 브랜드 로고 적용
- 파일: `apps/frontend/components/layout/DashboardShell.tsx`
- 변경: design-token EQ 박스 → 외부 브랜드 SVG 컴포넌트 사용
- 이미 커버: verify-hardcoding Step 30이 외부 브랜드 자산 인라인 추가 차단
- 판정: **이미 커버**

---

## 우선순위별 권고 목록

### P2 (MEDIUM — 다음 세션 권장)

**verify-ssot Step 40: 테스트 파일 hardcoded threshold vs SSOT import**

- 근거: SSOT 토큰 변경 시 테스트가 hardcoded 매직넘버로 fail. 본 세션 1차 push 시 utilization-state SSOT(70→60) drift로 frontend test 6 fail 실측 사례.
- 파일: `apps/frontend/**/__tests__/**`, `apps/backend/**/__tests__/**`, `*.test.ts(x)`
- 회귀 자동 방지 효과 큼: 테스트가 SSOT를 import하면 boundary case 자동 추종

### P3 (LOW — 다음 cleanup sprint)

**verify-ssot Step 41: @deprecated export alias 외부 소비처 0건 정리**

- 근거: deprecated alias 누적 시 SSOT 분산 + import 혼동. 본 세션에서 `DashboardCheckoutScope` 0건 grep 후 즉시 제거 사례.
- 파일: `apps/frontend/lib/api/**`, `apps/backend/src/**/dto/**`, `packages/**`
- 자동 cleanup 가능: 외부 소비처 grep 0건이면 제거 권고

---

## 요약 테이블

| 우선순위 | 대상 스킬 | 액션 | 패턴 | 근거 |
|---|---|---|---|---|
| P2 | `verify-ssot` | Step 40 신규 | Pattern 1: 테스트 SSOT import | utilization SSOT drift 실측 사례 |
| P3 | `verify-ssot` | Step 41 신규 | Pattern 5: @deprecated alias 정리 | DashboardCheckoutScope 제거 사례 |
| — | Pattern 2 | Defer | Date.now + db.execute mock | 패턴 미안정, 일회성 |
| — | Pattern 3 | Defer | Map.size 의미 정확성 | 단발성 fix, 일반화 어려움 |
| — | Pattern 4 | Defer | ESLint config 룰 예외 | CI/인프라 설정, 예외 #8 |
| — | Pattern 6 | 이미 커버 | brand-assets 모듈 분리 | verify-hardcoding Step 30 |
| — | Pattern 7 | 이미 커버 | 외부 브랜드 자산 사용 | verify-hardcoding Step 30 |

---

## CLAUDE.md / SKILL.md 업데이트 필요 여부

- **CLAUDE.md**: 변경 불필요 — 신규 스킬 없음, 기존 verify-ssot Step 추가만
- **manage-skills SKILL.md**: verify-ssot 설명 행에 Step 40, 41 번호 추가 필요
- **verify-ssot SKILL.md**: Step 40, 41 본문 추가

본 세션은 권고만 작성. 실제 SKILL.md 업데이트는 본 evaluation의 P2/P3 권고를 다음 세션에서 적용할지 사용자 결정 후 진행.

---

## 영향없는 스킬 (skipped)

- verify-cas — 본 세션 변경에 CAS 적용 영역 없음 (테스트 + UI 위주)
- verify-auth — 백엔드 controller 변경 없음
- verify-zod — DTO 변경 없음 (alias 제거만)
- verify-cache-events — emit/emitAsync 변경 없음
- verify-frontend-state — useState/setQueryData 변경 없음
- verify-i18n — 메시지 키 변경 없음 (legendHoliday 기존 키 사용)
- verify-nextjs — page.tsx/layout.tsx 변경 없음
- verify-design-tokens — 디자인 토큰 추가/변경 없음 (footer는 토큰 사용 중단으로 단순화)
- verify-security — XSS/secret 패턴 변경 없음
- verify-sql-safety — SQL 변경 없음 (테스트는 mock)
- verify-e2e — E2E spec 변경 없음
- verify-seed-integrity — seed 변경 없음
- verify-workflows — workflow 추가 없음
- verify-handover-security — 변경 없음
- verify-qr-ssot — 변경 없음
- verify-checkout-fsm — 변경 없음
- verify-filters — 변경 없음

---

## 미커버 변경사항 (UNCOVERED)

없음 — 모든 변경 파일이 등록된 스킬의 커버 영역 또는 예외 사항(인프라/일회성)에 해당.

P2/P3 권고는 회귀 자동 방지 가치가 있으므로 다음 세션에 적용 권장.
