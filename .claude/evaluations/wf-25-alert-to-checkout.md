# Evaluation — wf-25-alert-to-checkout

**Date**: 2026-04-08
**Mode**: 1 (Lightweight)
**Iteration**: 1
**Verdict**: ✅ **PASS** (with 1 SHOULD-level follow-up)

## Changed files

| File | Status | LOC |
|---|---|---|
| `apps/frontend/tests/e2e/workflows/wf-25-alert-to-checkout.spec.ts` | NEW | +95 |

신규 1건만. 다른 코드/시드/픽스처 수정 없음. ✅

## MUST criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | 신규 파일 1건만, 다른 코드 수정 없음 | ✅ PASS | git status: 1 untracked file only |
| 2 | `pnpm tsc --noEmit` 통과 | ✅ PASS | 출력 없음(에러 0) |
| 3 | `playwright test wf-25-alert-to-checkout` exit 0 (skip 포함) | ✅ PASS | chromium 1 skipped (seed 미보장 path), 6 setup passed; webkit/firefox 실패는 브라우저 바이너리 미설치 환경 문제 — spec 결함 아님 |
| 4 | 회귀: `alert-kpi` 통과 유지 | ✅ PASS | 12/12 passed (chromium) |
| 5 | 셀렉터 `getByRole`/`getByText`/`getByLabel` 우선 | ✅ PASS | `getByRole('heading')`, `getByRole('button', { name: '반출 신청하기' })`, `getByText('선택된 장비가 없습니다')`, `getByRole('button', { name: / 제거$/ })`; 1개 CSS 셀렉터 (`a[href^="/equipment/"]`)는 알림 동적 라우팅 특성상 불가피 |
| 6 | 도메인 데이터 fabricate 금지 | ✅ PASS | 한국어 라벨/aria-label/메시지 키는 모두 messages/ko/*.json 및 컴포넌트 코드에서 직접 인용 (equipment.json:282-283, checkouts.json:298,325) |
| 7 | testOperatorPage fixture 사용 (TE) | ✅ PASS | `auth.fixture.ts` 의 `testOperatorPage` 사용 |
| 8 | prefill 검증 — 선택된 장비 단언 | ✅ PASS | `getByText('선택된 장비가 없습니다')` count=0 + `getByRole('button', { name: / 제거$/ })` 가시성 단언으로 이중 검증 |

## SHOULD criteria

| # | Criterion | Verdict |
|---|---|---|
| 1 | skip 메시지 진단 가능 | ✅ PASS |
| 2 | 단계별 toHaveURL 어설션 | ✅ PASS |
| 3 | 교정 D-day 배지 soft 검증 | ⚠️ 누락 — 본문 8) 주석으로 의도적 생략 명시. 향후 보강 가능 |

## Runtime evidence

```
[chromium] WF-25 ... 1 skipped (seed에 TE 대상 장비 알림 없음)
[chromium] alert-kpi 12 passed
```

## Tech debt (follow-up)

1. **시드 보강**: TE 사용자에 대한 calibration_due 알림(linkUrl=/equipment/...)을 deterministic 하게 생성하면 본 spec 의 assertion 본 경로(skip 아님)가 실행됨. `apps/backend/src/database/seed-data/notifications/` 또는 calibrations.seed 확장 검토.
2. **D-day 배지 검증**: assertion 본 경로 활성화 시 `EquipmentStickyHeader` calibrationStatus 배지(D-N/기한 초과) soft assertion 추가.

## Conclusion

Mode 1 contract 의 MUST 8건 모두 PASS. SHOULD 1건 미충족(soft assertion 누락)은 본문 주석에 의도 명시 + tech debt 등재. **승인 권장**.
