# 스프린트 계약: calibration created linked plan item SSE

## 생성 시점
2026-05-03T11:20:00+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `CALIBRATION_CREATED` notification payload가 직접 연결된 교정계획 item id를 `linkedPlanItemId`로 전달한다.
- [ ] approval SSE sentinel이 `linkedPlanItemId`를 받은 경우 `entityType: 'calibrationPlanItem'`, `entityId: linkedPlanItemId`로 브로드캐스트한다.
- [ ] frontend `useNotificationStream`이 해당 sentinel 수신 시 `queryKeys.calibrationPlans.all`을 무효화한다.
- [ ] 기존 approval counts 무효화 동작은 유지한다.
- [ ] `NotificationSseService` focused unit test가 통과한다.
- [ ] backend/frontend type-check가 통과한다.

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] tracker의 `calibration-created-event-linkedPlanItemId` 항목을 완료 이력으로 정리한다.
- [ ] frontend error mapper 관련 파일은 변경하지 않는다.

## 종료 조건
- 필수 기준 전체 PASS → 성공
- SHOULD 실패는 종료 조건에 영향 없음
