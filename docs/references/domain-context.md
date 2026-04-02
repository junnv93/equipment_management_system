# Domain Context (UL-QP-18)

> 이 파일은 CLAUDE.md에서 분리된 상세 참조 문서입니다.

### Role Hierarchy (4 역할)

| Role                | Korean     | Level | 특이사항                                           |
| ------------------- | ---------- | ----- | -------------------------------------------------- |
| `test_engineer`     | 시험실무자 | 1     | 기본 CRUD, 교정 등록 가능                          |
| `technical_manager` | 기술책임자 | 2     | 승인/반려, 교정계획 생성                           |
| `quality_manager`   | 품질책임자 | 3     | 교정계획 검토 (대부분 읽기 전용)                   |
| `lab_manager`       | 시험소장   | 4     | 전체 권한 (단, 교정 등록 불가 — UL-QP-18 직무분리) |

### Equipment Status (12개) / Checkout Status (13개)

SSOT: `@equipment-management/schemas`의 `EquipmentStatus`, `CheckoutStatus`. 전체 값은 코드 참조.

**프론트엔드에서 주의할 상태 전이 규칙:**

| 상태                    | 표시                     | UI 동작                                                          |
| ----------------------- | ------------------------ | ---------------------------------------------------------------- |
| `calibration_scheduled` | "사용 가능" + D-day 배지 | `retired`, `non_conforming`, `spare`, `disposed`에서는 배지 숨김 |
| `calibration_overdue`   | **"부적합"** (빨간 배지) | 스케줄러가 자동으로 `non_conforming` 전환                        |
| `overdue` (checkout)    | "기한 초과"              | 승인/반려 버튼 없음 — 승인 테스트에 사용 금지                    |

**Checkout 플로우:** 표준(교정/수리) 6단계 + 렌탈 4-Step + 공통 3개 = 13개 상태

### Approval Workflows

| Flow   | 단계                        | 예시                            |
| ------ | --------------------------- | ------------------------------- |
| 1-step | technical_manager 승인      | Checkout, Calibration, Software |
| 2-step | TM 검토 → LM 승인           | Disposal                        |
| 3-step | TM 제출 → QM 검토 → LM 승인 | Calibration Plan                |

### Calibration Display Logic

**교정 기한 초과 자동 처리 (CalibrationOverdueScheduler):**

- 백엔드 스케줄러가 **매시간** 교정기한 초과 장비를 자동으로 `non_conforming` 상태로 전환
- 앱 시작 시 `onModuleInit`에서 즉시 점검
- 부적합 기록(non-conformance) 자동 생성 및 사고 이력 등록
- 관리자 수동 트리거: `POST /api/notifications/trigger-overdue-check`

**프론트엔드 상태 표시:**

- `calibration_overdue` → **"부적합"** (빨간색 배지)
- `calibration_scheduled` → "사용 가능" + D-day 배지 (D-7, D-3 등)
- D-day 배지는 `retired`, `non_conforming`, `spare`, `disposed` 등에서 숨김

### Management Number Format

```
XXX – X YYYY
 │    │  └── Serial number
 │    └───── Classification (E/R/W/S/A/P)
 └────────── Site code (SUW/UIW/PYT)
```
