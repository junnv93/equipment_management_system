# 스프린트 계약: Calibration action button aria-labels

## 생성 시점
2026-05-03T11:24:47+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `CalibrationFactorsClient.tsx`의 승인/반려 action button에 명시적 `aria-label`이 있어야 한다.
- [ ] `CalibrationApprovalActions.tsx`의 승인/반려 action button에 명시적 `aria-label`이 있어야 한다.
- [ ] `aria-label` 문자열은 ko/en i18n namespace에서 가져와야 하며 하드코딩하면 안 된다.
- [ ] label은 행별 대상 정보를 포함해야 한다.
- [ ] 버튼의 클릭 핸들러, loading/disabled, mutation 로직은 변경하지 않아야 한다.
- [ ] `pnpm --filter frontend type-check` 성공.

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] 관련 tracker open item `action-button-aria-label-gap`이 완료 기록으로 이동되어야 한다.
- [ ] ko/en equipment namespace parity가 유지되어야 한다.

### 적용 verify 스킬
- verify-implementation
- verify-i18n
- verify-a11y

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
