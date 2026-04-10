# 중간점검 RBAC 세분화 + 삭제/재제출 워크플로우

## 배경

현재 중간점검(Intermediate Inspection) 승인 워크플로우가 `Permission.UPDATE_CALIBRATION` 하나에 묶여 있어, 시험실무자·기술책임자·시험소장이 모든 액션(create/submit/review/approve/reject)을 수행할 수 있음. UL-QP-18 절차서의 역할 분리를 위반하고 있음.

### 현재 문제

1. **권한 미분리**: 시험실무자가 자기 기록을 스스로 승인 가능
2. **시험실무자 반려 버튼**: 제출자인데 반려 권한도 있음 — "제출 취소"와 혼동
3. **삭제 기능 미구현**: 전체 검사 기록 삭제 엔드포인트 없음
4. **반려 후 재제출 불가**: rejected 상태에서 재제출 경로 없음

### 목표 상태 (UL-QP-18 기준)

| 역할 | 권한 |
|------|------|
| 시험실무자 | 작성, 제출, 제출취소(submitted→draft), 승인 전 삭제 |
| 기술책임자 | 검토, 승인, 반려, 승인 후에도 삭제 가능 |
| 시험소장 | (필요 시) 최종 승인 |

### 상태 전이 다이어그램

```
draft ──submit──→ submitted ──review──→ reviewed ──approve──→ approved
  ↑                  │                    │
  └──withdraw────────┘                    │
  ↑                                       │
  └──────────────reject───────────────────┘
  ↑
  └──resubmit──── rejected
```

- `withdraw` (제출 취소): 시험실무자가 submitted → draft
- `reject` (반려): 기술책임자만 submitted/reviewed → rejected
- `resubmit` (재제출): 시험실무자가 rejected → draft

## 구현 범위

### Phase 1: Permission 상수 추가 (packages/shared-constants)

```typescript
// 신규 Permission 상수 추가
SUBMIT_INTERMEDIATE_INSPECTION     // 시험실무자
WITHDRAW_INTERMEDIATE_INSPECTION   // 시험실무자 (제출 취소)
REVIEW_INTERMEDIATE_INSPECTION     // 기술책임자
APPROVE_INTERMEDIATE_INSPECTION    // 기술책임자 + 시험소장
REJECT_INTERMEDIATE_INSPECTION     // 기술책임자 + 시험소장
DELETE_INTERMEDIATE_INSPECTION     // 시험실무자(승인 전) + 기술책임자(항상)
```

기존 `UPDATE_CALIBRATION`은 교정 기록 CRUD용으로 유지. 중간점검 액션에서는 분리.

### Phase 2: 백엔드 컨트롤러 가드 변경

`intermediate-inspections.controller.ts`의 각 엔드포인트에 신규 Permission 적용:

- `POST /create` → SUBMIT_INTERMEDIATE_INSPECTION
- `PATCH /:id/submit` → SUBMIT_INTERMEDIATE_INSPECTION
- `PATCH /:id/withdraw` → WITHDRAW_INTERMEDIATE_INSPECTION (신규 엔드포인트)
- `PATCH /:id/review` → REVIEW_INTERMEDIATE_INSPECTION
- `PATCH /:id/approve` → APPROVE_INTERMEDIATE_INSPECTION
- `PATCH /:id/reject` → REJECT_INTERMEDIATE_INSPECTION
- `DELETE /:id` → DELETE_INTERMEDIATE_INSPECTION (신규 엔드포인트)

### Phase 3: 서비스 로직

1. **withdraw**: submitted → draft 전환, submittedAt/submittedBy 초기화
2. **resubmit**: rejected → draft 전환, rejectedAt/rejectedBy/rejectionReason 초기화
3. **delete**: soft-delete 또는 hard-delete
   - 시험실무자: approvalStatus가 draft/submitted/rejected일 때만
   - 기술책임자: 항상 가능 (approved 포함)
4. **reject**: 기술책임자만 (서비스 레벨에서 본인이 제출자가 아닌지 검증)

### Phase 4: 프론트엔드 버튼 조건

`IntermediateInspectionList.tsx`의 액션 버튼:

| 상태 | 시험실무자 | 기술책임자 |
|------|-----------|-----------|
| draft | [제출] [삭제] | [삭제] |
| submitted | [제출 취소] | [검토 승인] [반려] |
| reviewed | — | [최종 승인] [반려] |
| approved | — | [삭제] |
| rejected | [재제출] [삭제] | [삭제] |

### Phase 5: 감사 로그

모든 상태 전이에 AuditLog 기록 (기존 패턴 따라).

## 관련 파일

| 파일 | 변경 |
|------|------|
| `packages/shared-constants/src/permissions.ts` | 신규 Permission 6개 추가 |
| `packages/shared-constants/src/role-permissions.ts` | 역할별 매핑 |
| `apps/backend/src/modules/intermediate-inspections/intermediate-inspections.controller.ts` | 가드 변경 + withdraw/delete 엔드포인트 |
| `apps/backend/src/modules/intermediate-inspections/intermediate-inspections.service.ts` | withdraw/resubmit/delete 로직 |
| `apps/frontend/components/equipment/IntermediateInspectionList.tsx` | 버튼 조건 변경 |
| `apps/frontend/messages/ko/calibration.json` | 제출취소/재제출/삭제 i18n |
| `apps/frontend/messages/en/calibration.json` | 동일 |

## 검증 기준

- `pnpm tsc --noEmit` PASS
- `pnpm --filter backend run test` PASS (기존 559개 + 신규)
- verify-auth: 모든 엔드포인트에 적절한 Permission 가드
- verify-security: 본인 제출 기록 본인 승인 불가 검증
- 프론트엔드: 역할에 따라 올바른 버튼만 노출
