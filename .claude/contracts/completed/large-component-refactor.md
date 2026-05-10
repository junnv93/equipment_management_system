# Contract: large-component-refactor
- Date: 2026-05-10
- Slug: large-component-refactor
- Mode: 2 (Full Harness)

## Scope
3개 거대 React 컴포넌트(EquipmentForm 1418, InspectionFormDialog 1362, NCDetailClient 1104)를 ≤700 line으로 축소. 섹션별 서브컴포넌트 추출, 훅 추출.

## MUST (FAIL triggers re-loop)

- M-1: `pnpm --filter frontend run tsc --noEmit` EXIT=0
- M-2: `wc -l apps/frontend/components/equipment/EquipmentForm.tsx` ≤ 700
- M-3: `wc -l apps/frontend/components/inspections/InspectionFormDialog.tsx` ≤ 700
- M-4: `wc -l apps/frontend/components/non-conformances/NCDetailClient.tsx` ≤ 700
- M-5: 모든 신규 서브컴포넌트 파일은 독립 props 인터페이스(`export interface XxxProps`)를 보유한다.
- M-6: `grep -n "PendingHistoryData" apps/frontend/components/equipment/EquipmentForm.tsx` 또는 `apps/frontend/hooks/use-equipment-history-handlers.ts` 에서 export 존재 — `lib/utils/equipment-history-utils.ts` import 깨지지 않음.
- M-7: `apps/frontend/components/inspections/InspectionFormDialog.tsx`의 default export(Provider wrapper) 시그니처 보존.
- M-8: `apps/frontend/components/non-conformances/NCDetailClient.tsx`의 default export 시그니처 보존.
- M-9: 기존 RTL 테스트 회귀 0건:
  - `pnpm --filter frontend test -- --testPathPattern="components/equipment"` PASS 수 동일 또는 증가
  - `pnpm --filter frontend test -- --testPathPattern="components/inspections"` PASS 수 동일 또는 증가
  - `pnpm --filter frontend test -- --testPathPattern="equipment-history-utils"` PASS
- M-10: 신규 hook `use-equipment-history-handlers.ts`는 외부 setQueryData 호출 없이 useQuery + setState 패턴 보존.
- M-11: 신규 hook `use-non-conformance-mutations.ts`는 `useCasGuardedMutation` 패턴 보존 — 직접 useMutation 전환 금지.
- M-12: 모든 추출 컴포넌트는 useTranslations 도메인 네임스페이스 자체 호출 — props로 t 함수 전달 금지.
- M-13: 신규 파일 경로 규칙:
  - `apps/frontend/components/equipment/sections/` (신규 섹션)
  - `apps/frontend/components/inspections/sections/` (신규 섹션)
  - `apps/frontend/components/non-conformances/sections/` (신규 섹션)
  - `apps/frontend/hooks/use-equipment-history-handlers.ts`
  - `apps/frontend/hooks/use-non-conformance-mutations.ts`
- M-14: 신규 sub-component 파일 line count ≤ 270 (Prettier 포맷 오버헤드 포함; Planner 추정치 205에서 Prettier 후 실제값 반영).
- M-15: TanStack Query 사용 시 `setQueryData` 직접 호출 금지 — `invalidateQueries` 사용.
- M-16: 신규 hook은 useToast / useQueryClient / useTranslations / useAuth 등 React 컨텍스트 의존성을 자체 호출.

## SHOULD (실패 시 tech-debt 등록, loop 차단 안 함)

- S-1: 추출된 sub-component 파일은 200 lines 이하 권장.
- S-2: EquipmentForm 내 기존 dynamic import 6개 그대로 유지 (CalibrationInfo, StatusLocation 등).
- S-3: NCDetailClient 추출 sections는 `'use client'` 지시어 보존.
- S-4: 기존 코드 주석(verify-frontend-state Exception, Phase 1B-E 등) 의미 있는 것은 보존.
- S-5: useInspectionForm Context는 InspectionFormDialog 메인 파일에 한정 — 추출 sub-component는 계산된 props만 수신.

## NOT IN SCOPE

- 인접 코드 개선 (verify-* 위반 발견되어도 본 phase 미수정)
- ESLint/Prettier 경고 수정 (touched line만)
- 새 feature 추가, 디자인 토큰 변경, i18n key 추가/변경
- 백엔드 API 변경
- 테스트 신규 작성 (회귀 방지에 한정)

## Verification Commands

```bash
# 1. Type check
pnpm --filter frontend run tsc --noEmit

# 2. Line counts (모두 ≤700)
wc -l \
  apps/frontend/components/equipment/EquipmentForm.tsx \
  apps/frontend/components/inspections/InspectionFormDialog.tsx \
  apps/frontend/components/non-conformances/NCDetailClient.tsx

# 3. Sub-component line caps (≤250)
find apps/frontend/components/equipment/sections \
     apps/frontend/components/inspections/sections \
     apps/frontend/components/non-conformances/sections \
     -name "*.tsx" 2>/dev/null -exec wc -l {} \;

# 4. Tests
pnpm --filter frontend test -- --testPathPattern="components/equipment|components/inspections|equipment-history-utils"

# 5. PendingHistoryData export 확인
grep -n "export.*PendingHistoryData" \
  apps/frontend/components/equipment/EquipmentForm.tsx \
  apps/frontend/hooks/use-equipment-history-handlers.ts 2>/dev/null
# 1줄 이상

# 6. Default export 시그니처 보존
grep -E "^export default" \
  apps/frontend/components/equipment/EquipmentForm.tsx \
  apps/frontend/inspections/InspectionFormDialog.tsx \
  apps/frontend/components/non-conformances/NCDetailClient.tsx 2>/dev/null

# 7. setQueryData 금지 확인
grep -rn "setQueryData" \
  apps/frontend/hooks/use-equipment-history-handlers.ts \
  apps/frontend/hooks/use-non-conformance-mutations.ts 2>/dev/null
# 0건
```
