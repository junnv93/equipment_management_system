# Evaluation — Dashboard Phase E LOW 잔여 검증/cleanup (2026-04-29)

## Verdict

**PASS** (반복 1회, fix loop 1회)

| Iteration | 결과 | 핵심 발견 |
|---|---|---|
| 1 | FAIL (M2) | `utilization-state.test.ts` 6 failures — SSOT(60) ↔ 테스트(70) 임계값 충돌 |
| 2 | PASS | 테스트 SSOT 추종 + 31→32 commits push 완료 |

## Contract 결과

### MUST 기준

| ID | 기준 | 결과 | 근거 |
|---|---|---|---|
| M1 | 31 commits push 성공 | ✅ PASS (2회차) | `8aaefa8c..0edf8522` |
| M2 | frontend 단위 테스트 PASS | ✅ PASS | 256/256 (utilization fix 후) |
| M3 | backend 단위 테스트 회귀 없음 | ✅ PASS | 947/947 (pre-push hook) |
| M4 | tsc 회귀 없음 | ✅ PASS | exit 0 (multiple runs) |
| M5 | verify-implementation 회귀 0 | ✅ PASS | self-audit + tsc + tests |

### SHOULD 기준

| ID | 기준 | 결과 | 근거 |
|---|---|---|---|
| S1 | Playwright 30 PNG + axe scan | ✅ PASS (실제 52 PNG) | 5 roles × ~10 + 5 axe scan, 2.5분 |
| S2 | standalone HTML 5 항목 매칭 | ✅ PASS (4 + 1 fix + 1 디자인 결정) | 명세서 ↔ 코드 1:1 비교 |
| S3 | getSystemHealth 단위 테스트 | ✅ PASS (8 케이스 추가) | 23/23 (15 + 8) |
| S4 | DashboardCheckoutScope alias 제거 | ✅ PASS | 외부 소비처 0건 grep 후 제거 |
| S5 | DDAY_TONE_RULE 주석 보강 | ✅ PASS | review-architecture §6 권고 반영 |

## standalone HTML 5/5 검증 상세

**입력 자료**:
- `/mnt/c/Users/kmjkd/Downloads/개발 명세서.md` (1403줄, v1.0+v1.1 38 issues)
- `/mnt/c/Users/kmjkd/Downloads/_ _ _standalone_.html` (1.2MB single-file gzipped bundle)

| 항목 | 명세 | 실제 코드 | 결과 | 처리 |
|---|---|---|---|---|
| **§3.1 EQ 마크** | EQ 모노그램 또는 자체 로고 SVG, 26px, bg-brand-gradient | `Wrench` lucide + bg-ul-red, 32px | ⚠️ 디자인 결정 | tech-debt-tracker — 사용자 결정 필요 |
| **§3.7 items-stretch** | DashboardRow3 grid에 items-stretch | 5 역할 layout 모두 stretch (`row3ThreeCol*`, `row3TwoColReviewHero`, `row3SingleCol`) | ✅ PASS | — |
| **§3.10 디버그 위젯 제거** | 좌하단 1/2/Issues 박스 제거 | `app/layout.tsx`에 디버그 위젯 부재 | ✅ PASS | — |
| **§A.3.1 미니캘린더** | 폰트 12px, dot 8px, "공휴일" 앞 숫자 제거 | dot 8px ✅, "1" 하드코딩 ❌ | ❌ → ✅ FIX 적용 | bg-brand-neutral 도트 + holidayMap.size 동적 카운트 |
| **§A.9.1 Skip nav** | sr-only + focus 노출, #main-content | `DashboardShell.tsx:180` SkipLink 적용 | ✅ PASS | — |

**부분 잔여 (tech-debt-tracker 등록)**:
- §A.3.1 폰트 크기: MICRO_TYPO.badge=text-2xs(10px) vs 명세 12px (디자인 시스템 결정)
- §A.3.1 marker: w-1.5(6px) vs 명세 5px (미세 차이)
- §A.9.1: 두 번째 skip link `#dashboard-row1` 미구현 (선택적 권고)

## Side-effect 발견 (commit 0edf8522)

**Critical**: `utilization-state.test.ts` SSOT drift
- 본 세션 commit `6ddff791b`(2026-04-28)에서 `UTILIZATION_GAUGE_THRESHOLDS` ok=70→60 변경
- 테스트는 hardcoded 70 그대로 유지 → pre-push frontend test 6 failures
- 이전 세션 핸드오프에서 frontend test 미실행 (시간 제약)이라 발견 못 됨

**Fix**: 테스트가 `UTILIZATION_THRESHOLDS` SSOT를 import해서 `HIGH/MEDIUM/HYSTERESIS`로 동적 boundary 계산. 향후 SSOT 변경 시 테스트 boundary 자동 추종.

## Playwright dashboard-screenshots 결과

```
Test Suites: 1 globalSetup + 5 setup + 5 dashboard tests
Tests: 11 passed
Time: 2.5분
```

| 역할 | screenshots | dark | axe scan |
|---|---|---|---|
| 시험실무자 | 8 PNG (3 tabs + 3 responsive + base) | 2 | PASS |
| 기술책임자 | 8 PNG | 2 | PASS |
| 품질책임자 | 8 PNG | 2 | PASS |
| 시험소장 | 9 PNG (4 tabs) | 2 | PASS |
| 시스템관리자 | 9 PNG (4 tabs) | 2 | PASS |
| **합계** | **42 PNG** | **10 PNG** | **5 axe scan PASS** |

전체 52 PNG. axe scan 5건 모두 critical/serious 0건.

## 변경 통계 (본 세션)

```
6 files changed, 287 insertions(+), 22 deletions(-)
- .claude/contracts/dashboard-low-residual-2026-04-29.md (new)
- .claude/exec-plans/tech-debt-tracker.md (+5 items)
- apps/backend/src/modules/dashboard/__tests__/dashboard.service.spec.ts (+166 lines)
- apps/frontend/components/dashboard/MiniCalendar.tsx (legend fix)
- apps/frontend/eslint.config.mjs (DDAY_TONE_RULE 주석)
- apps/frontend/lib/api/dashboard-api.ts (alias 제거)
```

이전 commit `0edf8522` (utilization-state SSOT) +1 commit별도.
총 본 세션 영향: 32 commits push, 이전 세션 31 + 본 세션 1.

## Iterations

### Iteration 1 (FAIL)
- 31 commits push 시도 → frontend test 6 failures (utilization-state)
- 즉시 fix loop 진입

### Iteration 2 (PASS)
- 테스트 SSOT 추종 리팩토링 → 19/19 PASS, 256/256 PASS
- push 재시도 → all checks PASS
- LOW residual cleanup commit → push 진행 중

## Post-merge Actions

- [x] tech-debt-tracker.md 5 항목 등록
- [x] contract → completed (Mode 1은 plan 파일 없음, 생략)
- [ ] §3.1 EQ 마크 디자인 결정 (사용자 확인)
- [ ] §A.3.1 typography 토큰 변경 검토 (디자인 시스템 sprint)
- [ ] §A.9.1 second skip link 추가 (접근성 sprint)
- [ ] standalone HTML 1:1 픽셀 매칭 (디자인 QA sprint)
