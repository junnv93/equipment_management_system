# Contract: QP-18-10 Equipment Import Export

**Slug**: qp-18-10-export
**Date**: 2026-04-08
**Reference contract**: .claude/contracts/qp-18-06-export.md

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

- [ ] **TypeCheck (backend)**: `pnpm --filter backend exec tsc --noEmit` exit 0
- [ ] **Build (backend)**: `pnpm --filter backend run build` exit 0
- [ ] **Backend tests**: `pnpm --filter backend run test` exit 0 (회귀 0)
- [ ] **TypeCheck (frontend)**: `pnpm --filter frontend exec tsc --noEmit` exit 0
- [ ] **Catalog 플래그 활성**: `packages/shared-constants/src/form-catalog.ts`의 `'UL-QP-18-10'` 항목이 `implemented: true`
      검증: `grep -n "UL-QP-18-10" packages/shared-constants/src/form-catalog.ts -A 7 | grep "implemented: true"` 1건 이상
- [ ] **exporters 맵 등록**: `apps/backend/src/modules/reports/form-template-export.service.ts`에서 `'UL-QP-18-10'` 키가 exporters 객체 내에 존재하고 `exportEquipmentImport`를 호출
- [ ] **exportEquipmentImport 메서드 존재**: 동일 파일 내에 `private async exportEquipmentImport(` 포함 라인 1건 이상
- [ ] **equipmentImports import 추가**: 동일 파일 상단에 `equipmentImports` 식별자가 import됨
- [ ] **핵심 필드 참조**: `exportEquipmentImport` 본문이 `usagePeriodStart`, `usagePeriodEnd`, `quantityOut`, `sourceType`을 모두 참조
- [ ] **서명 헬퍼 재사용**: `exportEquipmentImport` 본문이 `insertDocxSignature(`를 호출
- [ ] **날짜 헬퍼 재사용**: 신규 날짜 포맷 메서드 작성 없이 기존 `formatQp1806Date` 재사용
- [ ] **신규 파일 생성 금지**: `git diff --name-status main...HEAD | grep '^A' | grep -v '\.claude/' | wc -l` == 0
- [ ] **컨트롤러 비변경**: `git diff main...HEAD -- apps/backend/src/modules/reports/reports.controller.ts | wc -l` == 0
- [ ] **CAS/cache 영향 없음**: read-only export — `CacheInvalidationHelper`, `version` 신규 추가 0건

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음

- [ ] **E2E Step 3 추가**: `wf-20b-self-inspection-export.spec.ts`에 QP-18-10 export Step 추가, 단독 실행 통과
- [ ] **review-architecture Critical 0건** (변경 영역 한정)
- [ ] **verify-ssot PASS** — `FORM_CATALOG` SSOT import, 로컬 재정의 없음
- [ ] **verify-sql-safety PASS** — N+1 없음
- [ ] **수술적 변경**: diff에 무관한 포맷팅/리팩터 0건

### 적용 verify 스킬

- `apps/backend/src/modules/reports/**` → verify-ssot, verify-sql-safety, review-architecture
- `packages/shared-constants/**` → verify-ssot
- `apps/frontend/tests/e2e/**` → verify-e2e

## 종료 조건

- 필수 기준 전체 PASS → 성공, exec-plan을 `active/` → `completed/` 이동
- 동일 이슈 2회 연속 FAIL → 설계 문제, 수동 개입 요청
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — `.claude/exec-plans/tech-debt-tracker.md`에 기록

## Out of Scope

- 새로운 헬퍼 함수/파일 작성
- equipment-imports 도메인 로직(서비스/컨트롤러) 변경
- 다른 양식 export 수정
- QP-18-10 DOCX 템플릿 파일 자체 생성 (템플릿은 관리자가 UI에서 업로드)
