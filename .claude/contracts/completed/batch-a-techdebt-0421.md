# Contract: batch-a-techdebt-0421

## Task
tech-debt-tracker 정리 + S6 쿼리키 바인딩 + ValidationDocumentsSection/EditDialog SHOULD 해소

## Scope
- apps/frontend/lib/api/calibration-api.ts — useCalibrationDetail 훅 추가 (S6)
- apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/_components/ValidationDocumentsSection.tsx — DocumentTable 추출 후 ≤150줄
- apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/_components/ValidationDocumentsSection/_components/DocumentTable.tsx — 신규 (또는 동일 _components 폴더)
- apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/_components/ValidationEditDialog.tsx — VendorEditFields 추출 후 ≤150줄
- apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/_components/VendorEditFields.tsx — 신규 (동일 _components 폴더)
- .claude/exec-plans/tech-debt-tracker.md — completed 항목 체크

## MUST Criteria

| # | Criterion | Pass Condition |
|---|-----------|----------------|
| M1 | tsc --noEmit | frontend exit 0 |
| M2 | frontend lint | exit 0 |
| M3 | S6 쿼리키 바인딩 | calibration-api.ts에 `useCalibrationDetail` export, `queryKeys.calibrations.detail` 사용 |
| M4 | DocumentsSection 크기 | ValidationDocumentsSection.tsx ≤ 150줄 |
| M5 | EditDialog 크기 | ValidationEditDialog.tsx ≤ 150줄 |
| M6 | 기존 동작 보존 | ValidationDocumentsSection: useQuery + mutations 자체 보유, 부모로부터 docs 미수신 |
| M7 | 기존 동작 보존 | ValidationEditDialog: CAS mutation + open/onOpenChange 콜백 패턴 유지 |
| M8 | SSOT 우회 없음 | 신규 파일에 role/permission/URL 리터럴 없음 |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | DocumentTable props interface 명시적 (인라인 타입 아님) |
| S2 | VendorEditFields props에 `editForm`과 `setEditForm` callback 수신 (React.Dispatch 직접 전달 가능) |
| S3 | 신규 서브컴포넌트 각 ≤ 120줄 |

## OUT-OF-SCOPE
- ValidationDocumentsSection 이외의 Documents 관련 공통 컴포넌트 추출
- useCalibrationDetail을 기존 컴포넌트에 적용 (훅 정의만)
- tech-debt-tracker 미완료 항목 실제 구현

## Verification Commands
```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run lint
```
