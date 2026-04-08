# Contract: download-file-toast-ssot

**Slug**: `download-file-toast-ssot`
**Mode**: 2
**Date**: 2026-04-08
**Branch**: main
**Exec-plan**: `.claude/exec-plans/active/2026-04-08-download-file-toast-ssot.md`
**Tech-debt ref**: `tech-debt-tracker.md` line 22

## Decisions

- **Toast SSOT**: Radix `useToast` (53파일 우세 + 공유 훅 인프라 전체)
- **downloadFile**: throw (re-throw) — Radix hook은 컴포넌트 외부 호출 불가
- **헬퍼**: 불필요
- **i18n**: `common.errors.downloadFailed` 신규

## MUST

- [ ] `pnpm tsc --noEmit` exit 0
- [ ] `pnpm --filter frontend run test` exit 0
- [ ] `grep -rn "from 'sonner'" apps/frontend/` → **0 hit**
- [ ] `grep -n "Toaster\|sonner" apps/frontend/app/layout.tsx` → Radix Toaster 1 hit, sonner 0 hit
- [ ] `grep -n "toast" apps/frontend/lib/api/utils/download-file.ts` → **0 hit**
- [ ] `download-file.ts` catch가 `throw` 포함
- [ ] `FormTemplatesTable.tsx` downloadFormTemplateById 호출에 try-catch + toast
- [ ] `EquipmentStickyHeader.tsx` downloadHistoryCard에 .catch + toast
- [ ] `CalibrationPlanDetailClient.tsx` handleExportExcel에 try-catch + toast
- [ ] `messages/ko/common.json` `errors.downloadFailed` 존재
- [ ] `messages/en/common.json` `errors.downloadFailed` 존재
- [ ] `apps/frontend/package.json`에 `"sonner"` 없음
- [ ] `apps/frontend/hooks/use-toast.ts` 미존재 유지 (재생성 금지)
- [ ] 5개 다운로드 경로 모두 에러 시 화면 토스트 (unhandled rejection 0)

## SHOULD

- [ ] verify-ssot PASS
- [ ] verify-i18n PASS (ko/en 대칭)
- [ ] verify-hardcoding PASS
- [ ] tracker line 22 `[x]` 마킹
- [ ] sonner 제거 번들 절감 확인

## Out of Scope

- 백엔드 파일
- Radix Toaster 컴포넌트 구조/스타일 변경
- 기존 도메인별 `exportError` 키 변경
- git status dirty 파일 (calibration-overdue-scheduler, next-env, tsbuildinfo, EquipmentListContent, StatusSummaryStrip, e2e helpers)
- toast UX(색상/포지션/애니메이션) 변경
- E2E 테스트 신규 추가

## Scope Boundary (변경 허용 21개)

**프론트엔드 소스 (17):**
1. `apps/frontend/lib/api/utils/download-file.ts`
2. `apps/frontend/app/(dashboard)/software/TestSoftwareListContent.tsx`
3. `apps/frontend/components/equipment/AttachmentsTab.tsx`
4. `apps/frontend/components/form-templates/FormTemplateSearchBar.tsx`
5. `apps/frontend/components/form-templates/FormTemplateUploadDialog.tsx`
6. `apps/frontend/components/data-migration/FileUploadStep.tsx`
7. `apps/frontend/components/data-migration/PreviewStep.tsx`
8. `apps/frontend/components/data-migration/ResultStep.tsx`
9. `apps/frontend/app/(dashboard)/settings/notifications/NotificationsContent.tsx`
10. `apps/frontend/app/(dashboard)/settings/admin/calibration/CalibrationSettingsContent.tsx`
11. `apps/frontend/hooks/use-notification-stream.ts`
12. `apps/frontend/app/(dashboard)/settings/display/DisplayPreferencesContent.tsx`
13. `apps/frontend/app/(dashboard)/settings/admin/system/SystemSettingsContent.tsx`
14. `apps/frontend/hooks/use-notifications.ts`
15. `apps/frontend/components/form-templates/FormTemplatesTable.tsx`
16. `apps/frontend/components/equipment/EquipmentStickyHeader.tsx`
17. `apps/frontend/components/calibration/CalibrationPlanDetailClient.tsx`

**i18n (2):**
18. `apps/frontend/messages/ko/common.json`
19. `apps/frontend/messages/en/common.json`

**패키지 (1):**
20. `apps/frontend/package.json`

**문서 (1):**
21. `.claude/exec-plans/tech-debt-tracker.md`
