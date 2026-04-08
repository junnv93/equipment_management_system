# downloadFile silent swallow + Sonner→Radix SSOT 통합 — 2026-04-08

## Decisions

**A. Toast System SSOT: Radix `useToast` 채택 (Sonner 전량 제거)**
Radix 53파일 vs Sonner 14파일. `use-optimistic-mutation` / `use-form-submission` / `use-mutation-with-refresh` 등 핵심 공유 훅 전체가 이미 Radix 사용. `layout.tsx`에 Radix `<Toaster />`만 장착, Sonner `<Toaster />`는 미마운트로 현재 완전 사일런트. `sonner` 패키지 제거로 번들 절감.

**B. downloadFile 에러 계약: catch 제거 → throw (re-throw)**
Radix `useToast`는 React hook이므로 API 유틸 함수 내부에서 직접 호출 불가. `Promise<{ok}>` Result type은 5개 호출자 전체 수정 필요한 과잉 추상화. `throw`로 전환하면 이미 try-catch를 보유한 EquipmentPageHeader / CableListContent는 무수정 작동, fire-and-forget 3곳에만 최소 catch 추가.

**C. showErrorToast 헬퍼: 불필요**
`downloadFile`이 toast를 직접 호출하지 않으므로 중간 헬퍼 레이어 불필요. 각 호출자 컴포넌트가 `useToast()` 직접 보유. 최소 코드 원칙.

**D. i18n: `common.errors.downloadFailed` 키 신규 추가**
`downloadFile`은 도메인 무관 공통 유틸. fire-and-forget 3개 호출자 에러 메시지는 `common.errors.downloadFailed`로 통합. EquipmentPageHeader / CableListContent의 기존 도메인 키는 수술적 변경 원칙으로 유지.

---

## Phase 0: Pre-flight 확인

```bash
grep -rn "from 'sonner'" apps/frontend/ --include="*.ts" --include="*.tsx"
grep -n "Toaster\|sonner" apps/frontend/app/layout.tsx
grep -n "toast\|catch" apps/frontend/lib/api/utils/download-file.ts
ls apps/frontend/hooks/use-toast.ts 2>&1 || echo "정상: 파일 없음"
```

성공 기준: 분석과 일치 (Sonner 14파일, layout에 Radix만, downloadFile에 sonner toast.error 존재).

---

## Phase 1: Sonner → Radix 마이그레이션 (14개 파일)

**매핑 규칙:**
- `toast.success(msg)` → `toast({ description: msg })`
- `toast.error(msg)` → `toast({ variant: 'destructive', description: msg })`
- `toast.error(title, { description })` → `toast({ variant: 'destructive', title, description })`
- `toast(title, { description, action: { label, onClick } })` → `toast({ title, description, action: <ToastAction altText={label} onClick={onClick}>{label}</ToastAction> })`

**대상 파일 (14개):**

1. `apps/frontend/lib/api/utils/download-file.ts` — sonner import 제거 (Phase 2와 동시)
2. `apps/frontend/app/(dashboard)/software/TestSoftwareListContent.tsx`
3. `apps/frontend/components/equipment/AttachmentsTab.tsx`
4. `apps/frontend/components/form-templates/FormTemplateSearchBar.tsx`
5. `apps/frontend/components/form-templates/FormTemplateUploadDialog.tsx`
6. `apps/frontend/components/data-migration/FileUploadStep.tsx`
7. `apps/frontend/components/data-migration/PreviewStep.tsx`
8. `apps/frontend/components/data-migration/ResultStep.tsx`
9. `apps/frontend/app/(dashboard)/settings/notifications/NotificationsContent.tsx`
10. `apps/frontend/app/(dashboard)/settings/admin/calibration/CalibrationSettingsContent.tsx`
11. `apps/frontend/app/(dashboard)/settings/display/DisplayPreferencesContent.tsx`
12. `apps/frontend/app/(dashboard)/settings/admin/system/SystemSettingsContent.tsx`
13. `apps/frontend/hooks/use-notification-stream.ts` — `ToastAction` 패턴 필요
14. `apps/frontend/hooks/use-notifications.ts`

각 파일 달성 목표: `from 'sonner'` import 제거 → `import { useToast } from '@/components/ui/use-toast'`, 컴포넌트/훅 내부에서 `const { toast } = useToast()` 추가, 호출 매핑 규칙 적용. action 패턴이 있는 파일은 `import { ToastAction } from '@/components/ui/toast'` 추가.

성공 기준: `grep -rn "from 'sonner'" apps/frontend/` → 0 hit.
위험도: 낮음 (기능 동치 교체).

---

## Phase 2: downloadFile 에러 계약 변경

파일: `apps/frontend/lib/api/utils/download-file.ts`

달성 목표:
- catch 블록을 `throw error`로 교체
- sonner import 제거 (Phase 1과 동시)
- `Promise<void>` 시그니처 유지 (외부 타입 계약 무변경)
- JSDoc에 "다운로드 실패 시 throw — 호출자가 catch 필수" 명시

성공 기준: `grep -n "toast" download-file.ts` → 0 hit. catch 블록에 `throw` 존재.

---

## Phase 3: fire-and-forget 호출자 3곳 — catch 추가

### 3-A: `apps/frontend/components/form-templates/FormTemplatesTable.tsx`
현재: `onClick={() => downloadFormTemplateById(tpl.current!.id)}` (~line 142)
달성 목표: `useToast` import + hook 추가, onClick을 async로 변경 + try-catch + `toast({ variant: 'destructive', description: t('common.errors.downloadFailed') })` 추가

### 3-B: `apps/frontend/components/equipment/EquipmentStickyHeader.tsx`
현재: `.then(({ downloadHistoryCard }) => downloadHistoryCard(equipmentId))` (~line 227, catch 없음)
달성 목표: `useToast` import + hook 추가, `.catch(() => toast({ variant: 'destructive', description: t('common.errors.downloadFailed') }))` 추가

### 3-C: `apps/frontend/components/calibration/CalibrationPlanDetailClient.tsx`
현재: `handleExportExcel = () => { calibrationPlansApi.downloadExcel(planUuid) }` (~line 260)
달성 목표: handleExportExcel을 async로 + try-catch + toast (useToast는 이미 import됨)

성공 기준: 3개 파일 모두 catch 존재, unhandled rejection 0.

---

## Phase 4: i18n 키 추가

파일:
- `apps/frontend/messages/ko/common.json`: `errors.downloadFailed = "파일 다운로드에 실패했습니다."`
- `apps/frontend/messages/en/common.json`: `errors.downloadFailed = "Failed to download the file."`

성공 기준: ko/en 양쪽에 키 존재 (verify-i18n PASS).

---

## Phase 5: sonner 패키지 제거

파일: `apps/frontend/package.json`
달성 목표: `"sonner": "..."` 항목 제거. `pnpm install` 재실행으로 lockfile 정리.
전제: Phase 1 완료 + grep 0 hit 확인.

---

## Phase 6: tech-debt-tracker 갱신

파일: `.claude/exec-plans/tech-debt-tracker.md` line 22
달성 목표: `[ ]` → `[x]` + 해결 요약 추가

---

## Phase 7: 검증

```bash
pnpm tsc --noEmit
pnpm --filter frontend run test
grep -rn "from 'sonner'" apps/frontend/ --include="*.ts" --include="*.tsx"  # 0 hit
grep -n "toast" apps/frontend/lib/api/utils/download-file.ts  # 0 hit
grep "downloadFailed" apps/frontend/messages/ko/common.json apps/frontend/messages/en/common.json
grep "sonner" apps/frontend/package.json  # 0 hit
```

---

## Cross-site 영향

| 워크플로우 | 변경 |
|---|---|
| 장비/케이블 내보내기 | 사일런트 → 가시적 에러 토스트 |
| 양식 템플릿/이력카드/교정계획 다운로드 | 신규 catch 추가 |
| SSE 알림 (use-notification-stream) | Sonner → Radix ToastAction |
| 알림/마이그레이션/Settings 4개 | Sonner → Radix |

---

## 위험 평가

| Phase | 위험 |
|---|---|
| 1 14파일 마이그레이션 | 낮음 (기능 동치) |
| 2 downloadFile re-throw | 낮음 |
| 3 catch 추가 3파일 | 낮음 |
| 4-6 | 없음 |

총 변경 파일: **21개**
