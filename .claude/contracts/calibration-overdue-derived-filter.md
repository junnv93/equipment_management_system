---
slug: calibration-overdue-derived-filter
mode: 1
created: 2026-04-08
---

# Contract: 교정기한초과 필터를 derived 기준으로 전환

## 문제

`StatusSummaryStrip`의 "교정기한초과" 칩은 `status='calibration_overdue'` enum 값으로 카운트하고
필터링한다. `CalibrationOverdueScheduler`가 해당 장비를 즉시 `non_conforming`으로 전환하므로,
이 칩의 카운트는 항상 0에 가깝고 클릭해도 빈 결과가 나온다.

부적합 장비 중에서도 교정기한이 초과된 장비를 보고싶다는 사용자 요구를 충족하지 못한다.

## 해결 방향

"교정기한초과"를 status enum이 아니라 **`nextCalibrationDate < today`** 라는 사실(derived)로 정의.
백엔드 `calibrationOverdue=true` 파라미터는 이미 derived로 동작 중이므로, 이를 칩에 연결한다.

## MUST 기준

1. **백엔드 statusCounts에 `calibration_overdue` 키가 derived 기준으로 계산된다**
   - 정의: `nextCalibrationDate IS NOT NULL AND nextCalibrationDate < today AND status NOT IN (disposed, pending_disposal, retired, inactive)`
   - 기존 status 컬럼 기준 카운트는 덮어쓴다 (실질적으로 의미 없는 값)
   - status 필터를 제외한 다른 필터(site/teamId/search/classification 등)는 동일하게 적용

2. **StatusSummaryStrip의 "교정기한초과" 칩 클릭 시 derived 필터를 적용한다**
   - `status` 필터가 아닌 `calibrationDueFilter='overdue'`로 라우팅
   - status 필터는 비움(`status=''`)
   - 결과: 부적합/이용가능 등 어떤 status든 `nextCalibrationDate < today`인 장비 모두 표시

3. **`calibrationDueFilter='overdue'` 활성 시 칩의 active 상태 동기화**
   - "교정기한초과" 칩이 시각적으로 active로 표시
   - status 칩과 calibration overdue 칩의 active 상태가 mutually exclusive하지 않아도 됨

4. **타입체크 통과**: `pnpm tsc --noEmit` 0 errors

5. **변경 라인이 사용자 요청에 직접 매핑** — adjacent 코드 개선/리팩토링 금지

## SHOULD 기준

- 기존 e2e 테스트(`group-a-filter-status.spec.ts`, `wf-10-*`)가 깨지지 않음 (혹은 깨지면 의도적인지 확인)
- 시드 데이터의 SUW-E0008(`status='calibration_overdue'`)이 NC 생성된 이후에도 칩 카운트에 잡혀야 함

## 비-범위 (Non-Goals)

- `EquipmentStatusEnum.calibration_overdue` enum 값 deprecate (별도 작업)
- DB 스키마 변경
- 스케줄러 status 전이 로직 변경 (이미 직전 커밋에서 EXCLUDED_STATUSES 수정 완료)
- non_conforming 외 다른 derived 필터(예: due_soon) 통합

## 영향 파일 (예상 4-6개)

| File | Change |
|---|---|
| `apps/backend/src/modules/equipment/equipment.service.ts` | statusCounts 쿼리에서 calibration_overdue 키를 derived로 덮어쓰기 |
| `apps/frontend/components/equipment/StatusSummaryStrip.tsx` | calibration_overdue 칩 클릭 시 다른 콜백 호출 (props 확장) 또는 부모에서 라우팅 |
| `apps/frontend/components/equipment/EquipmentListClient.tsx` (또는 부모) | onStatusChange에서 calibration_overdue 키 분기 처리 |
| 관련 테스트 (옵션) | snapshot/assertion 업데이트 |

## 검증 명령

```bash
pnpm --filter backend exec tsc --noEmit
pnpm --filter frontend exec tsc --noEmit
pnpm --filter backend run test -- equipment
```

## 수동 확인

1. SUW-E0008 페이지: 부적합 배너 + D+45 표시 (NC 생성 후)
2. 장비 목록: "교정기한초과" 칩에 SUW-E0001, SUW-E0008 등 모두 카운트됨
3. 칩 클릭: 부적합 상태인 장비도 결과에 포함
4. status="부적합" 필터 + calibrationDueFilter="overdue" 조합도 동작
