# Evaluation Report: UL-QP-18-02 시험설비 이력카드 아키텍처 전면 개선

## 반복 #1 (2026-04-17T16:40:00+09:00)

---

## 계약 기준 대조

### 전체 품질 게이트

| 기준 | 판정 | 상세 |
|------|------|------|
| M-1: tsc --noEmit 에러 0 | **PASS** | `pnpm --filter backend exec tsc --noEmit` exit 0, 에러 없음 |
| M-2: lint 에러 0건 | **FAIL** | `apps/backend/src/modules/data-migration/services/excel-parser.service.ts` L63: `'SPEC_MATCH_LABELS' is defined but never used` — 1 error (history-card 작업과 무관한 파일이나 lint 게이트는 전체 적용) |
| M-3: backend build 성공 | **PASS** | `dist/` 클린 후 `nest build` 성공 (초기 dist 잔류 ENOTEMPTY 오류는 클린 후 해소) |
| M-4: backend test 회귀 0건 | **PASS** | 733 tests passed, 53 suites (equipment-timeline.service.spec.ts 포함 전체 PASS) |
| M-5: history-card-export e2e PASS | **PASS** | 3/3 PASS (`should export…`, `should merge…`, `should reflect live updates`) |
| M-6: git status clean | **FAIL** | unstaged 파일 9개 (data-migration 파일들 + frontend 파일들), untracked 3개. history-card 8커밋은 origin/main..HEAD에 정상 존재 |
| M-7: 브랜치 main, 새 브랜치 없음 | **PASS** | `git branch --show-current` = main |
| M-8: 신규 any 타입 0건 | **PASS** | history-card*.ts, equipment-timeline*.ts, docx-xml-helper.ts 전체 grep 결과 없음 |
| M-9: 하드코딩 라벨/섹션명 0건 | **PASS** | 4가지 섹션 title grep 결과 layout.ts 외 파일 미검출 |

### Phase 1 — DB 마이그레이션

| 기준 | 판정 | 상세 |
|------|------|------|
| M-P1-a: packages/db/src/schema/equipment.ts에 approvedAt 컬럼 | **PASS** | L128 `approvedAt: timestamp('approved_at')` nullable 존재 |
| M-P1-b: drizzle/ 마이그레이션 SQL 1건 신규 | **PASS** | `0029_add_equipment_approved_at.sql` 존재 |
| M-P1-c: DB 실측 approved_at 컬럼 존재 | **PASS** | `\d equipment`에서 `approved_at timestamp without time zone` 확인 |
| M-P1-d: equipment-approval.service 승인 경로 양쪽 approvedAt 세팅 | **PASS** | L422, L449, L468, L581 — approveCreate/approveUpdate 모두 `approvedAt: new Date()` |

### Phase 2 — SSOT

| 기준 | 판정 | 상세 |
|------|------|------|
| M-P2-a: history-card.layout.ts 존재, 셀/섹션/빈행/체크박스 SSOT | **PASS** | 파일 존재, CELL_LABELS/SECTIONS/CHECKBOX_PATTERNS 모두 정의됨 |
| M-P2-b: history-card.service.ts 인라인 라벨 맵 4개 제거 | **PASS** | grep 결과 history-card.service.ts에 라벨 맵 잔존 없음 |
| M-P2-c: TimelineEntryTypeEnum + TIMELINE_ENTRY_TYPE_LABELS schemas 패키지 존재 | **PASS** | packages/schemas/src/equipment-history.ts L87, packages/schemas/src/enums/labels.ts L334 존재 |
| M-P2-d: layout 상수에 양식 원본 docx 추적 주석 존재 | **PASS** | `@see docs/procedure/양식/QP-18-02_시험설비이력카드.md`, "원본 docx의 실제 텍스트" 등 주석 확인 |

### Phase 3 — 통합 이력

| 기준 | 판정 | 상세 |
|------|------|------|
| M-P3-a: equipment-timeline.service.ts 존재, Promise.all 3 쿼리 | **PASS** | 파일 존재, incidentToTimelineEntry/repairToTimelineEntry/ncToTimelineEntry 어댑터 확인 |
| M-P3-b: 유닛 테스트 ≥ 4개 | **PASS** | 13 tests: DESC 정렬, NC/repair FK 중복 제거, incident priority, limit 등 |
| M-P3-c: HISTORY_CARD_QUERY_LIMIT(S) 상수 사용 (하드코딩 없음) | **PASS** | equipment-timeline.service.ts L16 `HISTORY_CARD_QUERY_LIMITS` import, history-card-data.service.ts L16 `HISTORY_CARD_QUERY_LIMIT` import |

### Phase 4 — Data Service

| 기준 | 판정 | 상세 |
|------|------|------|
| M-P4-a: history-card-data.service.ts 신규 파일 존재 | **PASS** | 파일 존재 |
| M-P4-b: checkouts 쿼리 제거 | **PASS** | 주석으로만 언급 ("제거됨"), 실제 query 없음 |
| M-P4-c: equipment_test_software 조인 쿼리 추가 | **PASS** | L12 import + L211 쿼리 확인 |
| M-P4-d: approvalDate = approvedAt ?? updatedAt fallback | **PASS** | L266 `formatDate(equipmentRow.approvedAt ?? equipmentRow.updatedAt)` |
| M-P4-e: accessories + description 병합 | **PASS** | L279 mergeAccessoriesAndFunctions 언급 및 문서 확인 |
| M-P4-f: HistoryCardData에 timeline 단일 필드 | **PASS** | L107 `timeline: TimelineEntry[]` |

### Phase 5 — Renderer/XmlHelper

| 기준 | 판정 | 상세 |
|------|------|------|
| M-P5-a: docx-xml-helper.ts 존재, ≥5 함수 export | **PASS** | 10개 export 함수: escapeXml, buildRunXml, injectTextIntoLabeledCell, injectXmlIntoLabeledCell, assertReplace, assertReplaceRegex, fillSectionEmptyRows, addImageResource, buildInlineDrawingXml, formatYmdSlash |
| M-P5-b: history-card-renderer.service.ts 존재, layout.ts 상수만 사용 | **PASS** | 파일 존재, CELL_LABELS/SECTIONS/CHECKBOX_PATTERNS 참조 확인 |
| M-P5-c: history-card.service.ts ≤60줄 | **PASS** | 43줄 |
| M-P5-d: 서명 이미지 실패 시 텍스트 fallback | **PASS** | L135-150 signaturePath null 체크 + download 실패 시 warn + fallback 로직 |
| M-P5-e: FormRenderError 구조화 예외 | **PASS** | docx-xml-helper.ts L21 FormRenderError 클래스 정의, L90/96 throw 확인 |

### Phase 6 — 캐시 일관성

| 기준 | 판정 | 상세 |
|------|------|------|
| M-P6-a: repair-history.service create/update/delete에 invalidateAfterEquipmentUpdate 추가 | **PASS** | L188, L228, L249 3개 경로 모두 추가됨 |
| M-P6-b: equipment-history.service 무효화 회귀 없음 | **PASS** | L325, L433, L782 기존 무효화 호출 유지됨 |

### Phase 7 — 시드/E2E

| 기준 | 판정 | 상세 |
|------|------|------|
| M-P7-a: SUW-E0001에 repair 1건 + NC 1건 시드 (FK 연결) | **PASS** | repair-history.seed.ts에 REPAIR_009_ID + SUW-E0001, non-conformances.seed.ts에 NC_011_ID + repairHistoryId 연결 확인 |
| M-P7-b: 신규 검증 ≥5개 추가 | **PASS** (경계) | ① repair 텍스트 [수리] prefix (L165), ② NC 중복 제거 [부적합] 미출력 (L182), ③ 승인일 YYYY/MM/DD (L185), ④ 부속품 병합 (L238), ⑤ incident 유형 라벨 (L174 \[오작동\]) — 5개 충족. 단, S/W 정보 직접 검증 없음 |
| M-P7-c: repair + NC + incident 3개 모두 DOCX 반영 e2e 확정 | **PASS** | it#2 "merge incident+repair+nonConformance" — repair/incident 검증 확인; NC는 FK 중복 제거로 직접 없음 대신 중복 제거 검증으로 간접 확인 |
| M-P7-d: 기존 e2e 회귀 없음 | **PASS** | 3/3 PASS |

### Phase 8 — 문서

| 기준 | 판정 | 상세 |
|------|------|------|
| M-P8-a: report-export-mapping.md §3.2 신규 shape로 갱신 | **PASS** | approved_at fallback, equipment_test_software, mergeAccessoriesAndFunctions, mergeManualAndSoftware, FK 역참조 등 확인됨 |
| M-P8-b: backend-patterns.md DOCX 분리 섹션 신설 ≥10줄 | **PASS** | L174 "DOCX 내보내기 3-way 분리 아키텍처" 섹션 존재, Orchestrator/DocxXmlHelper 언급 |

### SSOT/하드코딩/보안 검증

| 기준 | 판정 | 상세 |
|------|------|------|
| M-V-a: verify-ssot PASS | **PASS** (실측 대체) | inlne 라벨 맵 제거 확인, schemas 경유 import 확인 |
| M-V-b: verify-hardcoding PASS | **PASS** (실측 대체) | 4가지 섹션 title grep — layout.ts 외 미검출 |
| M-V-c: verify-cache-events PASS | **PASS** (실측 대체) | repair-history L188/228/249 invalidate 확인 |
| M-V-d: verify-sql-safety PASS | **PASS** (실측 대체) | any 타입 없음, parameterized 쿼리 사용 패턴 확인 |
| M-Sec-a: enforceSiteAccess 유지 (equipment-history.controller L69) | **PASS** | L69 `enforceSiteAccess(req, info.site, EQUIPMENT_DATA_SCOPE, info.teamId)` |
| M-Sec-b: RequirePermissions(VIEW_EQUIPMENT) 유지 | **PASS** | L57 `@RequirePermissions(Permission.VIEW_EQUIPMENT)` |
| M-Sec-c: 서명 이미지 실패 시 PII 유출 없이 text fallback | **PASS** | L150 warn 로그 + fallback 분기 (PII 미포함) |

---

## SHOULD 기준 대조

| 기준 | 판정 | tech-debt 등록 |
|------|------|--------------|
| S-1: review-architecture Critical 이슈 0개 | SKIP | tech-debt: 별도 review-architecture 호출 필요 |
| S-2: frontend test:e2e wf-history-card-export PASS | SKIP | tech-debt: 프론트엔드 E2E 별도 검증 필요 |
| S-3: DOCX 렌더링 벤치마크 +10% 이내 | SKIP | tech-debt: 벤치마크 설정 미구성 |
| S-4: docx-xml-helper.ts ≥3 유닛 테스트 | **FAIL** | tech-debt: docx-xml-helper 유닛 테스트 0건 — 10개 export 함수 대비 커버리지 없음 |
| S-5: verify-e2e PASS | SKIP | tech-debt: verify-e2e 스킬 별도 호출 필요 |

---

## 전체 판정: **FAIL** (필수 2개 미달)

### FAIL 항목 목록

#### M-2: lint 에러 1건 (FAIL)
- **파일**: `apps/backend/src/modules/data-migration/services/excel-parser.service.ts` L63
- **에러**: `'SPEC_MATCH_LABELS' is defined but never used. Allowed unused vars must match /^_/u @typescript-eslint/no-unused-vars`
- **원인**: `SPEC_MATCH_LABELS`이 `@equipment-management/schemas`에서 import되어 있으나 파일 내 미사용. data-migration 모듈의 별도 작업에서 발생한 것으로 추정되나, 해당 파일이 `git status`에서 unstaged 상태임.
- **수정 방법**: `SPEC_MATCH_LABELS` import 제거 또는 `_SPEC_MATCH_LABELS`로 rename하여 unused vars 규칙 통과.

#### M-6: git status 미정리 (FAIL)
- **unstaged 파일 9개**: data-migration 상수 파일 7개 + excel-parser.service.ts + apps/frontend 파일들
- **untracked 파일 3개**: .claude/contracts/*, .claude/exec-plans/*, data-migration/__tests__/column-mapping.spec.ts
- **원인**: history-card-qp1802 작업 외 병렬 작업(data-migration, QR 관련)이 커밋되지 않고 워킹트리에 남아 있음.
- **수정 방법**: 
  1. data-migration/QR 관련 변경사항을 별도 커밋으로 정리 또는 stash.
  2. history-card 작업 범위 외 파일이므로 해당 작업을 먼저 커밋/저장 후 history-card 완료 처리.
  3. lint 에러(excel-parser.service.ts)가 unstaged 상태이므로 함께 수정 후 커밋.

---

## 수정 지시

### 우선순위 1: M-2 lint 에러 해소
```bash
# apps/backend/src/modules/data-migration/services/excel-parser.service.ts L63에서
# SPEC_MATCH_LABELS 제거
# 이후 lint 재실행으로 0건 확인
pnpm --filter backend run lint
```

### 우선순위 2: M-6 git status clean 확보
```bash
# 옵션 A: data-migration 변경사항이 완성된 작업이면 별도 커밋
git add apps/backend/src/modules/data-migration/ && git commit -m "refactor(data-migration): ..."

# 옵션 B: 진행 중인 작업이면 stash
git stash push apps/backend/src/modules/data-migration/ ...

# 이후 history-card 관련 파일만 남도록 정리
```

### tech-debt 등록 (SHOULD 미달)
- `S-4`: `apps/backend/src/modules/reports/docx-xml-helper.ts` — 10개 export 함수에 대한 유닛 테스트 0건. 최소 3개 테스트 추가 필요 (assertReplace 경계값, fillSectionEmptyRows emptyRows 부족 시, buildInlineDrawingXml 파라미터 검증).

---

## 비고

- M-3 (build): 초기 실행 시 `dist/` 디렉토리 잔류로 ENOTEMPTY 오류 발생. `rm -rf dist/` 후 재실행 시 성공. CI 환경에서는 항상 클린 빌드이므로 문제없으나, 로컬 반복 실행 시 build script에 `rimraf dist` 전처리 추가를 권장함.
- M-5 (e2e): `--testPathPattern` 플래그가 jest-e2e.json과 호환되지 않아 직접 파일명으로 실행. `pnpm test:e2e -- history-card-export` 형식으로는 0 matches 발생하며 `npx jest --config ./test/jest-e2e.json "history-card-export"` 직접 실행 필요.
- M-P3-b (유닛 테스트 탐색): `pnpm run test -- --testPathPattern="equipment-timeline"` 명령이 jest rootDir 설정과 충돌하여 0 matches. `__tests__/` 경로 포함 패턴 필요.
