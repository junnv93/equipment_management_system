# 부적합 관리 (Non-Conformance Management)

장비의 부적합 상태를 등록하고, 시정조치를 추적하며, 종결 승인까지 관리합니다.

## 부적합 유형 (6가지)

| 유형                  | 설명           | 등록 방법           | 시정 전제조건    |
| --------------------- | -------------- | ------------------- | ---------------- |
| `damage`              | 손상           | 수동                | 수리 이력 필수   |
| `malfunction`         | 오작동         | 수동                | 수리 이력 필수   |
| `calibration_failure` | 교정 실패      | 수동                | 없음             |
| `calibration_overdue` | 교정 기한 초과 | **자동** (스케줄러) | 재교정 기록 필수 |
| `measurement_error`   | 측정 오류      | 수동                | 없음             |
| `other`               | 기타           | 수동                | 없음             |

## 부적합 상태 (3개)

```
open ──────→ corrected ──────→ closed
  ↑               │
  └───────────────┘ (시정조치 반려 시: open으로 복귀)
```

## 프로세스

### 1. 부적합 등록 (open)

```
TE: 부적합 등록
    - 발견일, 발견자, 부적합 유형, 원인, 조치 계획
    ↓
시스템: 장비 상태 → non_conforming
        감사 로그 기록
```

### 2. 시정조치 완료 (open → corrected)

```
TE: 시정조치 수행 후 완료 보고
    ↓
시스템: 전제조건 검증 (유형별)
    ├─ damage / malfunction → 수리 이력(repairHistoryId) 연결 확인
    ├─ calibration_overdue → 교정 기록(calibrationId) 연결 확인
    └─ calibration_failure / measurement_error / other → 조건 없음
    ↓
검증 통과: status = corrected
           시정 내용, 조치자, 조치일 기록
```

### 3. 종결 승인 (corrected → closed)

```
TM: 시정조치 결과 검토
    ├─ 승인 → status = closed
    │         장비 상태 → available (다른 open NC가 없는 경우만)
    │         종결자, 종결일, 종결 비고 기록
    │
    └─ 반려 → status = open (재시정 필요)
              반려 사유 기록
              장비 상태 = non_conforming 유지
```

### 장비 상태 복원 조건

```
NC 종결 시 장비 상태 복원 로직:
  IF 해당 장비에 다른 open/corrected NC가 없음
  THEN 장비 상태 → available
  ELSE 장비 상태 = non_conforming 유지
```

## 자동 생성 케이스

교정 기한 초과 시 스케줄러가 자동으로 부적합 기록을 생성합니다.

```
CalibrationOverdueScheduler:
  교정 기한 초과 감지
  ↓
  부적합 기록 자동 생성
  - ncType = calibration_overdue
  - discoveredBy = system
  - cause = "교정 기한 초과"
  ↓
  장비 상태 → non_conforming
  알림 발송
```

## 관련 모듈

| 모듈             | 경로                                         | 역할                        |
| ---------------- | -------------------------------------------- | --------------------------- |
| Non-Conformances | `apps/backend/src/modules/non-conformances/` | 부적합 CRUD, 시정조치, 종결 |
| Equipment        | `apps/backend/src/modules/equipment/`        | 장비 상태 연동              |
| Calibration      | `apps/backend/src/modules/calibration/`      | 교정 기록 연결 (전제조건)   |
