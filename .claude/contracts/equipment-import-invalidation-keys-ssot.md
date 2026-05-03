# 스프린트 계약: Equipment Import invalidateKeys SSOT

## 생성 시점
2026-05-03T11:20:33+09:00

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입
- [ ] `EquipmentImportDetail.tsx`의 4개 상태 mutation에서 `invalidateKeys: [queryKeys.equipmentImports.lists()]` 인라인 중복을 제거해야 한다.
- [ ] 기존 `EquipmentImportCacheInvalidation`에 공통 optimistic invalidate key surface를 두어 detail 컴포넌트가 이를 재사용해야 한다.
- [ ] query key canonical source는 계속 `queryKeys.equipmentImports.lists()`여야 하며, 새 hardcoded array/string key를 만들면 안 된다.
- [ ] mutation function, optimistic status transition, success/error callback 의미는 변경하지 않아야 한다.
- [ ] `pnpm --filter frontend type-check` 성공.
- [ ] focused grep 검증에서 `EquipmentImportDetail.tsx` 내 `invalidateKeys: [queryKeys.equipmentImports.lists()]`가 0건이어야 한다.

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음
- [ ] 관련 tracker open item `equipment-import-invalidation-keys-ssot`이 완료 기록으로 이동되어야 한다.
- [ ] 캐시 무효화 책임이 `cache-invalidation.ts`에 집중되어야 한다.

### 적용 verify 스킬
- verify-hardcoding
- verify-ssot
- verify-implementation

## 종료 조건
- 필수 기준 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
