# 스프린트 계약: inspection mobile 760px E2E

## 생성 시점
2026-05-03T11:40:00+09:00

## 성공 기준

### 필수 (MUST)
- [ ] WF-20 자체점검 UI spec에 `page.setViewportSize({ width: 760, height: 1024 })` 회귀 시나리오가 추가된다.
- [ ] 시나리오는 자체점검 row/card가 760px에서 가로 overflow 없이 표시되는지 검증한다.
- [ ] 기존 WF-20 create/edit/submit/approve serial workflow를 깨지 않는다.
- [ ] frontend type-check가 통과한다.

### 권장 (SHOULD)
- [ ] `tech-debt-tracker.md`의 `s1-mobile-760px-viewport-e2e` 항목을 완료 이력으로 정리한다.

## 종료 조건
- MUST 전체 PASS.
