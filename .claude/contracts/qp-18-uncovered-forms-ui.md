# Contract: qp-18-uncovered-forms-ui

## MUST

1. `pnpm --filter frontend run tsc --noEmit` — 타입 에러 0
2. 4개 양식 (QP-18-03/05/06/10) UI 버튼 클릭으로 다운로드 가능
3. 권한 가드: `can(Permission.EXPORT_REPORTS)` false 시 버튼 비노출
4. 상태 가드:
   - QP-18-03: `approvalStatus === 'approved'` 만
   - QP-18-06/10: `pending/rejected/cancelled` 제외
5. 에러 처리: 실패 시 `toast({ variant: 'destructive' })` — silent swallow 금지 (tracker L28 맥락)
6. E2E: `wf-export-ui-download.spec.ts` 4개 신규 case PASS + 헤더 주석 미커버 목록 갱신
7. 하드코딩 금지: formNumber 는 `FORM_CATALOG` 등록 번호, permission 은 `@equipment-management/shared-constants` SSOT
8. `verify-ssot` PASS (로컬 재정의 없음)
9. 백엔드 회귀 0 (`pnpm --filter backend run test`)
10. `tech-debt-tracker.md` L23 `[~]` → `[x]`

## SHOULD

- `ExportFormButton` 공유 컴포넌트 채택 (4개 신규 call site 전부)
- ko/en i18n 동기화
- `verify-e2e` Step 5b form-level pairing 에서 03/05/06/10 이 WARN 에서 제거

## Out-of-scope

- QP-18-11 (미구현), QP-18-02 / 19-01 (dedicated endpoint)
- 기존 4개 call site (Equipment/Cable/Software/Validation) 소급 마이그레이션
- 백엔드 exporter 수정
- 신규 Permission 추가
- Cable export 15s timeout 이슈
- 브랜치 생성 (main 직접 작업)
