# 스프린트 계약: sort-legacy-removal-and-csv-ssot

## 생성 시점
2026-05-08T00:00:00+09:00

## Slug
sort-legacy-removal-and-csv-ssot

## 모드
Mode 2 (Full) — backend equipment-imports 분리형 sort 제거 + frontend API 타입 정합 + verify-frontend-state Step 41 SSOT 회귀 차단 SKILL 등록

## 변경 범위
- backend: 3 파일 (`apps/backend/src/modules/equipment-imports/`)
- frontend: 2 파일 (`apps/frontend/lib/api/`)
- SKILL: 1 파일 (`.claude/skills/verify-frontend-state/SKILL.md`)

---

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

#### 빌드/테스트/린트 게이트

- [ ] **M-1** `pnpm --filter backend run tsc --noEmit` 에러 0
- [ ] **M-2** `pnpm --filter frontend run tsc --noEmit` 에러 0
- [ ] **M-3** `pnpm --filter backend run test` 기존 테스트 통과 (equipment-imports 도메인 회귀 0)
- [ ] **M-4** `pnpm --filter frontend run lint` 에러 0

#### Backend equipment-imports 분리형 sort 제거

- [ ] **M-5** `apps/backend/src/modules/equipment-imports/dto/equipment-import-query.dto.ts`: Zod schema + DTO class에서 분리형 sort 필드 0건
  - 검증: `grep -c "sortBy" apps/backend/src/modules/equipment-imports/dto/equipment-import-query.dto.ts` = 0
  - 검증: `grep -c "sortOrder" apps/backend/src/modules/equipment-imports/dto/equipment-import-query.dto.ts` = 0
  - 주의: 결합형 `sort` 필드는 유지 — 두 grep은 분리형 식별자에 한정 (위 식별자가 결합형 enum 이름에 포함되지 않음 확인됨)

- [ ] **M-6** `apps/backend/src/modules/equipment-imports/utils/equipment-import-sort-mapper.ts`: `resolveEquipmentImportOrderBy` 함수 시그니처 파라미터 1개 (sort만)
  - 검증: `grep -c "legacySortBy" apps/backend/src/modules/equipment-imports/utils/equipment-import-sort-mapper.ts` = 0
  - 검증: `grep -c "legacySortOrder" apps/backend/src/modules/equipment-imports/utils/equipment-import-sort-mapper.ts` = 0
  - 검증: `grep -c "else if (legacySortBy)" apps/backend/src/modules/equipment-imports/utils/equipment-import-sort-mapper.ts` = 0

- [ ] **M-7** `apps/backend/src/modules/equipment-imports/equipment-imports.service.ts`: 분리형 query 필드 참조 0건
  - 검증: `grep -c "query.sortBy" apps/backend/src/modules/equipment-imports/equipment-imports.service.ts` = 0
  - 검증: `grep -c "query.sortOrder" apps/backend/src/modules/equipment-imports/equipment-imports.service.ts` = 0

#### Frontend API 타입 정합

- [ ] **M-8** `apps/frontend/lib/api/equipment-api.ts`: `EquipmentQuery` 내 분리형 sort 필드 0건
  - 검증: `grep -c "sortBy" apps/frontend/lib/api/equipment-api.ts` = 0
  - 검증: `grep -c "sortOrder" apps/frontend/lib/api/equipment-api.ts` = 0

- [ ] **M-9** `apps/frontend/lib/api/calibration-api.ts`: `CalibrationQuery` 내 분리형 sort 필드 0건
  - 검증: `grep -c "sortBy" apps/frontend/lib/api/calibration-api.ts` = 0
  - 검증: `grep -c "sortOrder" apps/frontend/lib/api/calibration-api.ts` = 0

- [ ] **M-10** `apps/frontend/lib/api/calibration-api.ts`: 결합형 `sort?: CalibrationSortValue` 필드 + import 존재
  - 검증: `grep -c "sort?: CalibrationSortValue" apps/frontend/lib/api/calibration-api.ts` ≥ 1
  - 검증: `grep -c "CalibrationSortValue" apps/frontend/lib/api/calibration-api.ts` ≥ 2 (import 1 + 사용 ≥ 1)
  - 검증: `grep -c "from '@equipment-management/schemas'" apps/frontend/lib/api/calibration-api.ts` ≥ 1

#### verify-frontend-state Step 41 SKILL 등록

- [ ] **M-11** `.claude/skills/verify-frontend-state/SKILL.md`: Step 41 섹션 신규 추가
  - 검증: `grep -c "^### Step 41" .claude/skills/verify-frontend-state/SKILL.md` = 1
  - 검증: `grep -c "toCsvParam" .claude/skills/verify-frontend-state/SKILL.md` ≥ 1

- [ ] **M-12** Step 41 섹션 본문에 SSOT 회귀 차단 grep 규칙 명시
  - 검증: Step 41 섹션 본문에 `toCsvParam` SSOT 헬퍼 명시
  - 검증: Step 41 섹션 본문에 `apps/frontend/lib/api/` 한정 + `\.join\(',\)\|\.join\(\",\"\)` 0 hits 또는 동등한 grep invariant 명시
  - awk 추출 검증: `awk '/^### Step 41/,/^### Step|^## /' .claude/skills/verify-frontend-state/SKILL.md` 결과에 `toCsvParam` + `.join(','`) 또는 `\\.join` 패턴 모두 포함

- [ ] **M-13** Output Format 표(SKILL.md lines 395~)에 Step 41 행 추가
  - 검증: `grep -c "| 41 " .claude/skills/verify-frontend-state/SKILL.md` ≥ 1
  - 검증: 해당 행에 `toCsvParam` 또는 `CSV` 키워드 포함

---

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록, 루프 차단 없음

- [ ] **S-1** `apps/backend/src/modules/equipment-imports/utils/equipment-import-sort-mapper.ts` JSDoc에서 legacy 관련 설명 제거
  - 검증: mapper 파일 JSDoc 블록에서 `legacy` / `레거시` / `legacySortBy` / `legacySortOrder` 키워드 0건
  - 검증 명령: `awk '/\/\*\*/,/\*\//' apps/backend/src/modules/equipment-imports/utils/equipment-import-sort-mapper.ts | grep -ic "legacy\|레거시"` = 0

- [ ] **S-2** `apps/backend/src/modules/equipment-imports/dto/equipment-import-query.dto.ts` 미사용 import 정리 (`SortOrderEnum`, `EquipmentImportSortField`, `SortOrder`)
  - 검증: DTO 파일 import 블록에서 분리형 sort 관련 type/enum import 0건
  - 검증 명령: `awk '/^import/,/^[a-zA-Z@]/' apps/backend/src/modules/equipment-imports/dto/equipment-import-query.dto.ts | grep -c "SortOrderEnum\|EquipmentImportSortField\|SortOrder[^V]"` = 0
  - 주의: mapper에서는 `EquipmentImportSortField` 타입이 여전히 필요 (COLUMN_MAP 강제) — DTO에서만 제거

- [ ] **S-3** `apps/backend/src/modules/equipment-imports/dto/equipment-import-query.dto.ts` `sort` 필드 ApiProperty `description` 단순화 (legacy 언급 제거)
  - 검증: `sort` 필드 ApiProperty description 라인에서 `legacy` / `레거시` 키워드 0건

- [ ] **S-4** `apps/backend/src/modules/equipment-imports/equipment-imports.service.ts` mapper 호출 인접 주석에서 legacy 언급 제거

---

## 적용 verify 스킬

자동 선택 기준:
- backend modules 변경 → verify-zod (DTO Zod schema 검증) + verify-implementation
- frontend lib/api/*.ts 변경 → verify-frontend-state (Step 18: lib/api에 React Hook 금지) + verify-implementation
- SKILL.md 변경 → 검증 스킬 자체 변경이므로 grep invariant 자체 검증

---

## contract grep 패턴 작성 규칙 적용

본 contract는 다음 5원칙 준수:

1. **메서드 본체 검증은 awk + grep** — M-12 Step 41 본문 검증은 `awk '/^### Step 41/,/^### Step|^## /'` 추출 후 grep 적용 (인접 Step 위양성 차단).
2. **정당 위치 enumeration** — `EquipmentImportSortField` 타입은 mapper에서 유지(COLUMN_MAP 타입 강제) — DTO에서만 제거 (S-2 명시).
3. **production runtime 한정** — backend grep은 `apps/backend/src/modules/equipment-imports/` 도메인 production 코드 한정 (test 파일 별도 회귀 검증).
4. **주석 라인 제외** — S-1/S-3는 awk JSDoc 블록 추출 후 grep으로 주석 내 legacy 언급 회귀 차단.
5. **Prettier 멀티라인 회피** — M-10은 `sort?: CalibrationSortValue` 단일 라인 grep + import 라인 별도 grep 분리 카운트.

---

## 종료 조건
- MUST 13개 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — `.claude/exec-plans/tech-debt-tracker.md`에 기록

---

## Tech-debt Tracker 완료 처리

본 sprint 완료 후 `.claude/exec-plans/tech-debt-tracker.md` 다음 3개 항목을 `[ ]` → `[x]` 전환:

- line 42: `backend-equipment-import-legacy-sort-removal`
- line 43: `frontend-domain-sort-combine-migration`
- line 44: `verify-zod-step-21-toCsvParam-ssot` — **위치 정정 주석 추가**: 실제 등록 위치는 `verify-frontend-state` Step 41 (CSV 직렬화 책임은 frontend lib/api 레이어 — verify-zod는 backend Zod schema 검증 scope이므로 SKILL 위치 불일치)

archive batch row 인용 시 위 SKILL 위치 변경 명시.
