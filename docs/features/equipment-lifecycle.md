# 장비 수명주기 (Equipment Lifecycle)

장비의 등록부터 폐기까지 전체 수명주기를 관리합니다.

## 장비 상태 (11개)

```
available ─────────── 사용 가능 (기본 상태)
checked_out ───────── 반출 중 (교정/수리/대여)
calibration_scheduled  교정 예정 (D-day 배지 표시)
calibration_overdue ── 교정 기한 초과 → 자동으로 non_conforming 전환
non_conforming ─────── 부적합 (수리/시정조치 후 복귀 가능)
spare ─────────────── 여분 (보유하지만 상시 관리 안 함)
pending_disposal ───── 폐기 대기 (시험소장 승인 전)
disposed ──────────── 폐기 완료
retired ───────────── 사용 중지 (deprecated, disposed 사용 권장)
temporary ─────────── 임시 등록 (렌탈/공용 장비)
inactive ──────────── 비활성 (임시 장비 사용 완료)
```

## 주요 프로세스

### 1. 장비 등록

```
시험실무자(TE): 장비 생성 폼 작성 → 제출
  ↓
시스템: 관리번호 자동 생성 (예: SUW-E0001)
        상태 = available
        감사 로그 기록
  ↓
장비 목록에 표시
```

**관리번호 형식:** `{사이트코드}-{분류}{일련번호}` (예: SUW-E0001, UIW-R0023)

- 사이트: SUW(수원), UIW(의왕), PYT(평택)
- 분류: E(전자), R(RF), W(무선), S(안전), A(자동차), P(소프트웨어)

### 2. 장비 수정 (CAS 기반)

```
사용자: 장비 정보 수정 → 제출 (version 포함)
  ↓
백엔드: WHERE version = expectedVersion 조건으로 UPDATE
  ├─ 성공: version + 1, 감사 로그 기록
  └─ 실패 (409 Conflict): "다른 사용자가 먼저 수정했습니다" → 재조회 유도
```

### 3. 장비 폐기 (2-step 승인)

```
시험실무자(TE): 폐기 신청 → 장비 상태 = pending_disposal
  ↓
기술책임자(TM): 검토 → 승인/반려
  ↓
시험소장(LM): 최종 승인 → 장비 상태 = disposed
              반려 → 장비 상태 복원
```

### 4. 교정 기한 초과 자동 처리

```
스케줄러 (매시간 실행):
  교정 기한 초과 장비 검색
  ↓
  장비 상태 → non_conforming
  부적합 기록 자동 생성 (ncType = calibration_overdue)
  관리자 알림 발송
```

## 상태 전이 다이어그램

```
                    ┌─── calibration_scheduled ───┐
                    │         (D-day 배지)        │
                    ↑                              ↓ (기한 초과)
 등록 → available ←──────────────────── non_conforming
          │    ↑                              ↑
          │    └── return_approved ────────────┘ (시정조치 완료)
          │
          ├── checked_out (반출) → returned → available
          │
          ├── pending_disposal → disposed (폐기 승인)
          │                   → available  (폐기 반려)
          │
          └── spare / retired (수동 전환)

 반입 → temporary → inactive (반납 완료)
```

## 관련 모듈

| 모듈          | 경로                                      | 역할                      |
| ------------- | ----------------------------------------- | ------------------------- |
| Equipment     | `apps/backend/src/modules/equipment/`     | 장비 CRUD, 폐기, 수리이력 |
| Calibration   | `apps/backend/src/modules/calibration/`   | 교정 기록, 기한 추적      |
| Notifications | `apps/backend/src/modules/notifications/` | 교정 만료 알림, 스케줄러  |
