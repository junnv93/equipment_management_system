# 교정 관리 워크플로우 (Calibration Workflow)

장비의 교정 계획 수립, 교정 기록 관리, 교정 인자 추적을 포함합니다.

## 교정 관리 방법 (Management Method)

| 방법                   | 설명      | 대상                    |
| ---------------------- | --------- | ----------------------- |
| `external_calibration` | 외부 교정 | 공인 교정 기관에 의뢰   |
| `self_inspection`      | 자체점검  | 내부에서 자체 점검 수행 |
| `not_applicable`       | 해당 없음 | 교정이 필요 없는 장비   |

## 교정 계획 (Calibration Plan) — 3단계 승인

연간 교정 계획을 수립하고 승인받는 프로세스입니다.

### 상태 흐름

```
draft ──────→ pending_review ──────→ pending_approval ──────→ approved
  ↑              │                        │
  └──── rejected ←────────────────────────┘
```

### 승인 단계

```
Step 1: 제출 (기술책임자 TM)
  TM: 교정 계획서 작성 → 검토 요청
  status: draft → pending_review
  ↓
Step 2: 검토 (품질책임자 QM)
  QM: 계획 적절성 검토
  승인 → status: pending_approval
  반려 → status: rejected (반려 사유 + 반려 단계 = 'review' 기록)
  ↓
Step 3: 최종 승인 (시험소장 LM)
  LM: 최종 승인
  승인 → status: approved
  반려 → status: rejected (반려 사유 + 반려 단계 = 'approval' 기록)
```

### 반려 후 재제출

```
rejected 상태에서 TM이 수정 후 재제출 가능
→ 반려 정보 초기화 (rejectedBy, rejectionReason 등)
→ status: pending_review (Step 1부터 다시)
```

### 계획 항목 확인 (Plan Item Confirmation)

```
승인 완료 후, 각 교정 항목의 실행 완료를 TM이 확인
→ confirmedBy, confirmedAt 기록
```

---

## 교정 기록 (Calibration Record)

실제 교정 수행 결과를 기록합니다.

```
TE: 교정 기록 등록
    - 교정일, 교정 기관, 교정 결과 (합격/불합격)
    - 교정 인증서 첨부
    - 다음 교정일 자동 계산
    ↓
TM: 승인 (1-step)
    ↓
시스템: 장비의 다음 교정일 업데이트
        교정 이력에 추가
```

---

## 교정 인자 (Calibration Factor)

교정 결과에서 도출된 보정값, 불확도 등을 관리합니다.

```
TE: 교정 인자 등록
    - 측정 포인트별 보정값, 불확도
    - 교정 기록과 연결
    ↓
장비 상세 페이지에서 조회 가능
```

---

## 중간점검 (Intermediate Inspection)

교정 주기 사이에 수행하는 정기 점검입니다.

```
시스템: 중간점검 알림 발송 (교정 주기의 중간 시점)
    ↓
TE: 점검 수행 → 결과 기록
    - 합격: 이력 기록
    - 불합격: 부적합 등록 연계
```

---

## 교정 기한 초과 자동 처리

```
CalibrationOverdueScheduler (매시간 + 앱 시작 시):
  1. 교정 기한 초과 장비 검색
  2. 장비 상태 → non_conforming
  3. 부적합 기록 자동 생성 (ncType = calibration_overdue)
  4. 관리자 알림 발송

수동 트리거: POST /api/notifications/trigger-overdue-check
```

## 관련 모듈

| 모듈                     | 경로                                                 | 역할                       |
| ------------------------ | ---------------------------------------------------- | -------------------------- |
| Calibration Plans        | `apps/backend/src/modules/calibration-plans/`        | 교정 계획 (3단계 승인)     |
| Calibration              | `apps/backend/src/modules/calibration/`              | 교정 기록 관리             |
| Calibration Factors      | `apps/backend/src/modules/calibration-factors/`      | 교정 인자 (보정값, 불확도) |
| Intermediate Inspections | `apps/backend/src/modules/intermediate-inspections/` | 중간점검                   |
| Self Inspections         | `apps/backend/src/modules/self-inspections/`         | 자체점검 (비교정 대상)     |
