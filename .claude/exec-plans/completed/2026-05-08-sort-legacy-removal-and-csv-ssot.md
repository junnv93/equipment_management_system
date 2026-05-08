# Exec Plan: sort-legacy-removal-and-csv-ssot

## 메타
- 생성: 2026-05-08T00:00:00+09:00
- 모드: Mode 2 (Full)
- Slug: sort-legacy-removal-and-csv-ssot
- 예상 변경: 6개 파일 (backend 3 + frontend 2 + SKILL 1)

## Summary

2026-05-07 query-r3-closure 자기검토 #2 라운드에서 식별된 LOW tech-debt 3건을 통합 closure.

1. **backend-equipment-import-legacy-sort-removal** — frontend hard-cut(Round 3) 후 backend equipment-imports 도메인의 분리형 `sortBy` + `sortOrder` dual-accept fallback이 dead code. DTO/mapper/service 3 layer에서 일괄 제거.
2. **frontend-domain-sort-combine-migration** — `equipment-api.ts` + `calibration-api.ts` 의 분리형 `sortBy` / `sortOrder` 잔존(명시적 "레거시 호환성" 주석). Equipment는 단순 제거(UI 미도입), Calibration은 결합형 `sort?: CalibrationSortValue` 격상(backend 이미 지원).
3. **verify-zod-step-21-toCsvParam-ssot** — Round 3 신규 SSOT helper `toCsvParam` 회귀 차단을 verify-frontend-state Step 41로 등록. `lib/api/` 내 `.join(',')` 0건 + `toCsvParam` import 경로 SSOT.

## 설계 철학

본 sprint는 **dead code 제거** + **SSOT 격상** + **회귀 차단 SKILL 등록** 3-axis closure. backend는 dual-accept fallback이 frontend hard-cut 후 호출자 0건으로 검증된 상태이므로 안전하게 제거. frontend calibration은 backend가 이미 결합형 enum 지원 중이므로 incremental migration이 아닌 hard-cut 가능. SKILL Step 41은 향후 인라인 `.join(',')` 회귀를 grep invariant로 영구 차단.

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| Equipment sort 제거 방식 | 단순 삭제(결합형 sort 미추가) | EquipmentQuery는 sort UI 미도입 — Round 3 자기검토 결정 (LOW tech-debt 분리 등록 사유). 추후 UI 도입 시 별도 sprint에서 격상. |
| Calibration sort 격상 방식 | 결합형 `CalibrationSortValue` hard-cut | backend `calibration-query.dto.ts` 이미 `CalibrationSortEnum.optional().default('calibrationDate.desc')` 지원 중 — frontend type만 정합화하면 즉시 동작. |
| Backend dual-accept 제거 안전성 | 즉시 제거 | Round 3 frontend hard-cut(commit `e9c52ca7` 부근)으로 분리형 호출자 0건 — grep `sortBy=\|sortOrder=` apps/frontend 0건 확인됨. |
| SKILL Step 번호 | Step 41 | 기존 Step 40까지 사용 중 (verify-cas Step 12/13 흡수 후). Step 41 신규 할당. |
| SKILL grep 위치 | `apps/frontend/lib/api/` 한정 | 전역 grep은 dev script/spec/legacy 위양성 위험. CSV query param 생성 책임은 lib/api 레이어에 한정 — toCsvParam SSOT 진입점 일치. |

## 구현 Phase

### Phase 1: Backend equipment-imports 레거시 sort 제거

**목표:** equipment-imports 도메인 3 파일에서 분리형 `sortBy` + `sortOrder` 코드 경로 완전 제거. 결합형 `sort` 필드 단일 진입점화.

**변경 파일:**
1. `apps/backend/src/modules/equipment-imports/dto/equipment-import-query.dto.ts` — 수정
   - Zod schema에서 `sortBy` (lines 36-40) + `sortOrder` (line 41) 필드 제거
   - DTO class에서 `sortBy?: EquipmentImportSortField` (lines 103-110) + `sortOrder?: SortOrder` (lines 112-119) 필드 + ApiProperty 데코레이터 제거
   - `sort` 필드 JSDoc(lines 29-33)에서 legacy fallback 언급 제거 — 결합형 단일 경로 설명만 유지
   - `sort` ApiProperty `description` 단순화 — legacy 언급 제거
   - import 정리: `SortOrderEnum`, `type EquipmentImportSortField`, `type SortOrder` 제거 (DTO에서 더 이상 필요 없음 — mapper에서만 사용)

2. `apps/backend/src/modules/equipment-imports/utils/equipment-import-sort-mapper.ts` — 수정
   - `resolveEquipmentImportOrderBy` 함수 시그니처 단순화 — `legacySortBy`, `legacySortOrder` 파라미터 제거. 단일 `sort` 파라미터만 유지.
   - `else if (legacySortBy)` 분기 제거. 결합형 `sort` parsing 경로만 유지.
   - JSDoc에서 legacy 관련 설명 제거. 결합형 enum SSOT 단일 경로 설명만 유지.
   - **유지**: `type EquipmentImportSortField` import (`COLUMN_MAP` 타입 강제 — `Record<EquipmentImportSortField, PgColumn>`).
   - **유지**: `type SortDirection` import (내부 변수 타입).

3. `apps/backend/src/modules/equipment-imports/equipment-imports.service.ts` — 수정
   - `resolveEquipmentImportOrderBy(query.sort, query.sortBy, query.sortOrder)` 호출 → `resolveEquipmentImportOrderBy(query.sort)` 단일 인자 호출
   - 관련 인접 주석 업데이트 (legacy 언급 제거)

**완료 기준:**
- `pnpm --filter backend run tsc --noEmit` PASS (DTO class + service + mapper 타입 정합)
- `grep -c "sortBy\|sortOrder" apps/backend/src/modules/equipment-imports/dto/equipment-import-query.dto.ts` = 0
- `grep -c "legacySortBy\|legacySortOrder" apps/backend/src/modules/equipment-imports/utils/equipment-import-sort-mapper.ts` = 0
- `grep -c "query.sortBy\|query.sortOrder" apps/backend/src/modules/equipment-imports/equipment-imports.service.ts` = 0
- `pnpm --filter backend run test` 회귀 0건 (equipment-imports 테스트 PASS 유지)

**검증:** `pnpm --filter backend run tsc --noEmit && pnpm --filter backend run test`

---

### Phase 2: Frontend API 타입 레거시 sort 제거 + calibration sort 결합형 격상

**목표:** `equipment-api.ts` / `calibration-api.ts` 두 파일의 분리형 sort 필드 제거. calibration은 결합형 `CalibrationSortValue` 격상으로 backend 결합형 enum과 정합.

**변경 파일:**
1. `apps/frontend/lib/api/equipment-api.ts` — 수정
   - `EquipmentQuery` type에서 `sortBy?: string; // 레거시 호환성` 라인 제거
   - `EquipmentQuery` type에서 `sortOrder?: 'asc' | 'desc'; // 레거시 호환성` 라인 제거
   - **유지**: `category?: string;` 필드 + 주석 (별도 tech-debt scope)
   - sort 결합형 신규 추가 **금지** (UI 미도입 — Round 3 자기검토 결정에 따라 추후 sprint에서 격상)

2. `apps/frontend/lib/api/calibration-api.ts` — 수정
   - `CalibrationQuery`에서 `sortBy?: string;` 제거
   - `CalibrationQuery`에서 `sortOrder?: 'asc' | 'desc';` 제거
   - `CalibrationQuery`에 `sort?: CalibrationSortValue;` 신규 필드 추가 (backend 이미 `CalibrationSortEnum.optional().default('calibrationDate.desc')` 지원)
   - import 추가: `import type { CalibrationSortValue } from '@equipment-management/schemas';` (또는 기존 schemas import 그룹에 병합)

**완료 기준:**
- `pnpm --filter frontend run tsc --noEmit` PASS (CalibrationQuery 사용처 호출자 타입 정합)
- `grep -c "sortBy\|sortOrder" apps/frontend/lib/api/equipment-api.ts` = 0
- `grep -c "sortBy\|sortOrder" apps/frontend/lib/api/calibration-api.ts` = 0
- `grep -c "sort?: CalibrationSortValue" apps/frontend/lib/api/calibration-api.ts` ≥ 1
- `grep -c "CalibrationSortValue" apps/frontend/lib/api/calibration-api.ts` ≥ 2 (import + 사용)
- `pnpm --filter frontend run lint` PASS

**검증:** `pnpm --filter frontend run tsc --noEmit && pnpm --filter frontend run lint`

---

### Phase 3: verify-frontend-state Step 41 SKILL 등록 — `toCsvParam` SSOT 회귀 차단

**목표:** Round 3 신설 SSOT helper `toCsvParam` (`apps/frontend/lib/api/query-csv.ts`)을 verify-frontend-state Step 41로 등록. 인라인 `.join(',')` 회귀를 grep invariant로 영구 차단.

**변경 파일:**
1. `.claude/skills/verify-frontend-state/SKILL.md` — 수정
   - Step 40 섹션 직후 Step 41 신규 추가
   - 형식: 기존 Step 38/39/40 패턴 mirror (date suffix `(2026-05-08 추가)` 명시)
   - 본문 grep invariant:
     - `apps/frontend/lib/api/` 내 `\.join\(['\"],['\"]\)` 0 hits — CSV 직렬화 인라인 차단
     - `apps/frontend/lib/api/` 내 `toCsvParam` import 경로 = `'./query-csv'` (또는 SSOT relative path) 추적
     - `apps/frontend/lib/api/query-csv.ts` `export function toCsvParam` 진입점 1건 정합 검증
   - "Output Format" 표(lines 395-437)에도 Step 41 행 추가 — 다른 Step 행 형식 mirror

**완료 기준:**
- `grep -c "^### Step 41" .claude/skills/verify-frontend-state/SKILL.md` = 1
- Step 41 섹션 본문에 `toCsvParam` SSOT + `\.join\(['\"],['\"]\)` 0 hits grep 규칙 모두 명시
- Output Format 표에 `| 41 | toCsvParam SSOT |` 행 추가
- 날짜 표기 `(2026-05-08 추가)` 또는 동등한 etymology 명시

**검증:** SKILL.md grep으로 Step 41 + table row 동시 존재 확인

---

### Phase 4: 검증

**명령:**
```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
pnpm --filter backend run test
pnpm --filter frontend run lint
```

**기대 결과:**
- backend tsc: 에러 0
- frontend tsc: 에러 0
- backend test: 기존 PASS 유지 (회귀 0)
- frontend lint: 0 errors

추가 grep 검증:
- backend equipment-imports 도메인 3 파일에서 `sortBy` / `sortOrder` 식별자 production 코드 0건
- frontend `lib/api/equipment-api.ts` + `lib/api/calibration-api.ts` 분리형 sort 필드 0건
- frontend `lib/api/calibration-api.ts` 결합형 `sort?: CalibrationSortValue` 1건 이상
- `verify-frontend-state/SKILL.md` Step 41 섹션 + Output Format table row 정합

---

## 전체 변경 파일 요약

### 신규 생성
없음

### 수정
| 파일 | 변경 의도 |
|------|----------|
| `apps/backend/src/modules/equipment-imports/dto/equipment-import-query.dto.ts` | 분리형 `sortBy` + `sortOrder` 필드 제거 (Zod schema + DTO class), import 정리 |
| `apps/backend/src/modules/equipment-imports/utils/equipment-import-sort-mapper.ts` | `resolveEquipmentImportOrderBy` 시그니처 단순화 (legacy 파라미터 + 분기 제거) |
| `apps/backend/src/modules/equipment-imports/equipment-imports.service.ts` | mapper 호출 단일 인자화 + 인접 주석 정리 |
| `apps/frontend/lib/api/equipment-api.ts` | `EquipmentQuery` 분리형 sort 필드 제거 (UI 미도입 → 단순 제거) |
| `apps/frontend/lib/api/calibration-api.ts` | `CalibrationQuery` 분리형 sort 제거 + 결합형 `sort?: CalibrationSortValue` 격상 |
| `.claude/skills/verify-frontend-state/SKILL.md` | Step 41 `toCsvParam` SSOT 회귀 차단 등록 + Output Format 표 행 추가 |

---

## Tech-debt Tracker

완료 후 다음 항목을 [x] 표시:
- backend-equipment-import-legacy-sort-removal (line 42)
- frontend-domain-sort-combine-migration (line 43)
- verify-zod-step-21-toCsvParam-ssot (line 44)

> verify-zod-step-21 항목은 실제 등록 위치를 verify-frontend-state Step 41로 결정 (CSV 직렬화는 frontend lib/api 레이어 책임 — verify-zod는 backend Zod schema 검증 SKILL이라 scope 불일치). tracker entry는 그대로 [x] 처리하되 archive batch row §S 인용에서 SKILL 위치 정정 명시.

---

## 의사결정 로그

- **2026-05-08 00:00 — Equipment 결합형 sort 격상 보류**: Round 3 자기검토 결정 + UI 미도입 상태 — 단순 제거가 시스템 일관성 우선. 추후 UI 도입 sprint에서 결합형 enum 신설 + 격상.
- **2026-05-08 00:00 — verify-zod-step-21 → verify-frontend-state Step 41 위치 변경**: tech-debt 항목명은 "verify-zod-step-21"이지만 SSOT 회귀 차단 책임은 frontend lib/api 레이어 → verify-frontend-state SKILL이 정확한 scope. tracker entry [x] 처리 시 archive에 위치 정정 명시.
- **2026-05-08 00:00 — Backend dual-accept 즉시 제거 결정**: frontend Round 3 hard-cut commit 후 grep `sortBy=\|sortOrder=` apps/frontend 0건 검증됨 — 호출자 부재 + dead code 보존 정당화 사유 없음 → 즉시 제거.
