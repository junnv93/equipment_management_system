# Contract: checkout-purpose-init

## Problem
장비 상세페이지 → 반출신청 네비게이션 시 purpose Select가 placeholder를 표시.
새로고침 시에만 "타팀 장비 대여"가 채워지는 race condition.

## Root Cause
- `useState<UserSelectableCheckoutPurpose>('calibration')` 고정 초기값
- navigation 시 TanStack Query 캐시 + NextAuth 세션이 동기적으로 available
- 첫 렌더에서 `purposeAvailability.calibration.enabled = false` (cross-team)
- Radix UI Select: `value='calibration'` + item disabled → placeholder 렌더링
- Effect 2가 사후 수정하지만 첫 paint에 이미 placeholder 노출

## Solution
`useState` lazy initializer로 `queryClient.getQueryData()` 동기 조회 → 첫 렌더부터 올바른 초기값.
Effect 2는 캐시 미스(새로고침) 경로 fallback으로 유지.

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | cross-team 장비로 navigation 시 purpose='rental' 초기화 (placeholder X) | 코드 리뷰: lazy init 로직 |
| M2 | own-team 장비로 navigation 시 purpose='calibration' 초기화 (regression X) | 코드 리뷰: teamId 비교 |
| M3 | selectedSite/selectedTeamId도 동기 초기화 (rental 진입 시 팀/사이트 즉시 표시) | 코드 리뷰 |
| M4 | Effect 2 fallback 유지 (캐시 미스 경로: 새로고침/직접 URL 진입) | 코드 리뷰: effect 보존 |
| M5 | `tsc --noEmit` frontend 통과 | 실행 결과 |
| M6 | SSOT: `getAvailablePurposes` 미사용 (CPVal.RENTAL 직접 할당이지만 내부 로직 동일) | 코드 리뷰 |
| M7 | `queryClient.getQueryData` 호출이 render phase에서 안전하게 사용됨 | 코드 리뷰 |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | 변경된 파일이 1개 (CreateCheckoutContent.tsx) — page.tsx 불변 |
| S2 | 기존 handlePurposeChange 핸들러 미변경 |
| S3 | 기존 Effect 2의 `hasInitializedPurpose.current` 로직 미변경 |
