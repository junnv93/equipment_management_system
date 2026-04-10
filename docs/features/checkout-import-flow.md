# 반출/반입 프로세스 (Checkout & Import Flow)

장비의 반출(교정, 수리, 대여)과 외부/내부 장비 반입을 관리합니다.

## 반출 (Checkout)

### 반출 목적 (4가지)

| 목적               | 설명                         | 반입 시 검증        |
| ------------------ | ---------------------------- | ------------------- |
| `calibration`      | 외부 교정                    | 교정 결과 확인 필수 |
| `repair`           | 수리                         | 수리 결과 확인 필수 |
| `rental`           | 대여 (타 팀/기관)            | 양측 확인 프로세스  |
| `return_to_vendor` | 렌탈 장비 반납 (시스템 전용) | —                   |

### 표준 반출 플로우 (교정/수리)

```
1. 신청        TE: 반출 신청서 작성 → status = pending
                   (장비, 목적, 예상 반납일, 반출처 입력)
                   ↓
2. 승인        TM: 승인 → status = approved
               TM: 반려 → status = rejected (사유 필수)
                   ↓
3. 반출 실행   TE: 반출 확인 → status = checked_out
                   장비 상태 → checked_out
                   반출 전 상태 기록 (conditionBefore)
                   ↓
4. 반입 검사   TE: 반입 검사 수행 → status = returned
                   - 작동 상태 확인 (필수)
                   - 교정 결과 확인 (교정 목적 시)
                   - 수리 결과 확인 (수리 목적 시)
                   반입 후 상태 기록 (conditionAfter)
                   ↓
5. 반입 승인   TM: 승인 → status = return_approved
                   장비 상태 → available
               TM: 반려 → status = checked_out (재검사 필요)
```

### 대여 반출 플로우 (4-Way 양측 확인)

```
승인 후:
  ① lender_checked ──── 빌려주는 팀: 반출 전 상태 확인
  ② borrower_received ─ 빌리는 팀: 인수 확인
  ③ in_use ──────────── 사용 중
  ④ borrower_returned ─ 빌리는 팀: 반납 전 확인
  ⑤ lender_received ─── 빌려주는 팀: 반입 확인
  ⑥ returned ────────── 반입 검사
  ⑦ return_approved ─── 최종 승인
```

### 반출 상태 (13개)

| 상태                | 설명                  | 적용      |
| ------------------- | --------------------- | --------- |
| `pending`           | 승인 대기             | 공통      |
| `approved`          | 승인됨                | 공통      |
| `rejected`          | 거절됨                | 공통      |
| `checked_out`       | 반출 중               | 교정/수리 |
| `lender_checked`    | 빌려주는 측 확인      | 대여      |
| `borrower_received` | 빌리는 측 인수        | 대여      |
| `in_use`            | 사용 중               | 대여      |
| `borrower_returned` | 빌리는 측 반납        | 대여      |
| `lender_received`   | 빌려주는 측 반입      | 대여      |
| `returned`          | 반입 완료 (검사 완료) | 공통      |
| `return_approved`   | 반입 최종 승인        | 공통      |
| `overdue`           | 반입 기한 초과        | 공통      |
| `canceled`          | 취소됨                | 공통      |

---

## 반입 (Equipment Import)

외부 렌탈 장비 또는 내부 공용 장비를 시스템에 등록합니다.

### 반입 출처

| 출처              | 설명           | 필수 정보                   |
| ----------------- | -------------- | --------------------------- |
| `rental`          | 외부 렌탈 업체 | 업체명 (vendorName)         |
| `internal_shared` | 내부 공용 장비 | 소유 부서 (ownerDepartment) |

### 반입 플로우

```
1. 신청        TE: 반입 신청 → status = pending
                   (장비 정보, 출처, 사용 기간 입력)
                   ↓
2. 승인        TM: 승인 → status = approved
               TM: 반려 → status = rejected
                   ↓
3. 수령        TE: 수령 확인 → status = received
                   시스템: 임시 장비 자동 등록
                   - 관리번호: TEMP-{SITE}-{CLASS}{SERIAL}
                   - 장비 상태 = temporary
                   - 교정 정보 자동 설정 (해당 시)
                   ↓
4. 사용 중     (반입된 장비를 시스템에서 관리)
                   ↓
5. 반납 요청   반납 시 checkout 자동 생성 (purpose = return_to_vendor)
               → status = return_requested
                   ↓
6. 반납 완료   checkout 반입 승인 완료
               → status = returned
               장비 상태 → inactive
```

## 관련 모듈

| 모듈              | 경로                                          | 역할                       |
| ----------------- | --------------------------------------------- | -------------------------- |
| Checkouts         | `apps/backend/src/modules/checkouts/`         | 반출 관리 (교정/수리/렌탈) |
| Equipment Imports | `apps/backend/src/modules/equipment-imports/` | 반입 관리 (렌탈/공용)      |
| Equipment         | `apps/backend/src/modules/equipment/`         | 장비 상태 연동             |
