# 스프린트 계약: 점검/SW/교정 행 액션 aria-label SSOT 롤아웃

## 생성 시점
2026-04-08

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter frontend exec tsc --noEmit` 에러 0
- [ ] `pnpm --filter frontend run test` 통과
- [ ] `/verify-i18n` PASS — ko/en 키 대칭 + ICU 변수 이름 일치
- [ ] 변경된 모든 *AriaLabel 키는 ICU 변수를 정확히 1개 이상 포함 (date 또는 name)
- [ ] `grep -rn "name: '수정'" apps/frontend/tests/e2e` 결과에 자체점검/중간점검/케이블/SW/교정 spec 0건
- [ ] IntermediateInspectionList.tsx의 4개 행 액션 버튼(submit/review/approve/reject)에 컨텍스트 `aria-label` 속성 존재
- [ ] SoftwareTab.tsx의 linkedSoftware unlink 버튼에 SW name이 포함된 `aria-label` 존재
- [ ] CalibrationHistorySection.tsx의 delete/detail 버튼 aria-label이 ICU 변수로 교정일 컨텍스트 포함
- [ ] WF-20 self-inspection spec 회귀 통과 (`wf-20-self-inspection-confirmation`, `wf-20-self-inspection-ui`)

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] cross-component SSOT 일관성: SelfInspection/IntermediateInspection/Software/CalibrationHistory 4개 컴포넌트 모두 컨텍스트 aria-label 패턴 사용
- [ ] 변경된 e2e spec은 SelfInspectionTab spec과 동일한 helper(`clickBelowStickyHeader`, `expectToastVisible`) 사용
- [ ] review-architecture Critical 이슈 0개
- [ ] Cable 행 액션이 향후 추가될 경우 동일 패턴 적용 가능하도록 `cables.actions` 자리 예약을 tech-debt-tracker에 기록

### 적용 verify 스킬
- verify-i18n (필수)
- verify-hardcoding (한국어 라벨 검사)
- verify-frontend-state (회귀)

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록
