# 스프린트 계약: IntermediateInspectionList 디자인 토큰 적용

## 생성 시점
2026-04-13T00:00:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `pnpm --filter frontend run tsc --noEmit` 에러 0
- [ ] `pnpm --filter frontend run build` 성공
- [ ] Design Token import: `from '@/lib/design-tokens'` 1회 이상
- [ ] INSPECTION_TABLE 토큰 적용: stripe, rowHover, numericCell 중 2개 이상 사용
- [ ] INSPECTION_EMPTY_STATE 토큰 적용: container + icon + title 3계층 이상
- [ ] INSPECTION_MOTION 또는 TRANSITION_PRESETS/ANIMATION_PRESETS 1회 이상 사용
- [ ] INSPECTION_SPACING 토큰 1회 이상 사용
- [ ] 시멘틱 상태 헬퍼 사용: getResultBadgeClasses 또는 getSemanticBadgeClasses 1회 이상
- [ ] sr-only 라벨 1개 이상 (chevron 또는 아이콘 전용 요소)
- [ ] 기존 기능 보존: renderActions, expandedId toggle, ResultSectionsPanel 렌더링 변경 없음

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] review-design 재평가 시 50점 이상
- [ ] sticky 헤더 적용
- [ ] focus-visible 클래스 적용
- [ ] getSemanticLeftBorderClasses로 행 상태 보더 적용

### 적용 verify 스킬
- verify-design-tokens (토큰 활용도)
- verify-implementation (전반)

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음
