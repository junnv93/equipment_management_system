# Evaluation Report: result-sections-arch-refactor

## Iteration: 2
## Verdict: **PASS**

## Summary
Batch A (ResultSectionsPanel 아키텍처 재정비) 2차 평가.
1차 FAIL 사유(라우트 순서 역전)가 수정되었고 모든 MUST/SHOULD 기준 충족.

## MUST Results
| Criterion | Result | Evidence |
|---|---|---|
| MUST1 frontend tsc | PASS | `pnpm --filter frontend exec tsc --noEmit` exit 0 |
| MUST2 backend tsc | PASS | exit 0 |
| MUST3 backend test | PASS | 559/559 passed (44 suites) |
| MUST4 frontend build | PASS | Next.js 라우트 트리 정상 생성 |
| MUST5 backend build | PASS | nest build 성공 |
| MUST6 Rule 0 위반 0건 | PASS | grep 결과 source 0건 (`.next/dev` 소스맵은 stale) |
| MUST7 handleMove 1회 호출 | PASS | reorderMutation.mutate 단일 호출 |
| MUST8 QUERY_CONFIG.RESULT_SECTIONS spread | PASS | ResultSectionsPanel.tsx:69 |
| MUST9 expandedId + 조건부 렌더 | PASS | SelfInspectionTab.tsx state + `{isExpanded && <ResultSectionsPanel}` |
| MUST10 isConflictError 참조 | PASS | 2회 (import + handleMutationError) |
| MUST11 reorder 엔드포인트 (2 controller) | PASS | 양쪽 모두 선언 + **정적 경로가 `/:sectionId` 앞에** 위치 |
| MUST12 SimpleCacheService 주입 | PASS | constructor + import |
| MUST13 REORDER 키 양쪽 | PASS | api-endpoints.ts intermediate/self 두 그룹 |
| MUST14 FileInterceptor limits | PASS | 양 controller 모두 `CSV_MAX_FILE_SIZE` 적용 |
| MUST15 CSV_MAX_FILE_SIZE 상수 | PASS | file-types.ts:154 |
| MUST16 batch inArray | PASS | form-template-export.service.ts — `inArray(documents.id, documentIds)` + `Promise.allSettled` |
| MUST17 RESULT_SECTIONS 엔트리 | PASS | query-config.ts:262 |

## SHOULD Results
| Criterion | Result |
|---|---|
| SHOULD3 ko/en conflict toast | PASS |
| SHOULD4 self cache skip 주석 정합 | PASS (early return + 주석) |

## Architectural Review
- (a) **라우트 순서 수정 확인**: intermediate L410 `/reorder` → L424 `/:sectionId`. self L271 `/reorder` → L286 `/:sectionId`. 양쪽 다 정적 경로가 파라미터 경로 앞에 선언됨. 경고 주석(`⚠️ 라우트 순서 주의`) 포함.
- (b) tx 외부 invalidate: `.then()` 체인으로 tx 커밋 성공 후만 캐시 무효화 (rollback 시 오염 없음).
- (c) 중복 ID 방지: Set 검출 후 BadRequestException.
- (d) 전체 순서 검증: totalCount 불일치 시 BadRequestException (부분 reorder 금지).
- (e) parent cache key 정합: `CACHE_KEY_PREFIXES.CALIBRATION + 'inspections:'` prefix + detail/list/list-equip 3개 정리.
- (f) self cache skip: `if (inspectionType !== 'intermediate') return;` + 클래스 주석.
- (g) SelfInspectionTab toggle aria: `aria-expanded={isExpanded}` + i18n `selfInspection.actions.toggleResultSections` (ko/en).
- (h) conflict toast: `calibration.resultSections.toasts.conflict` 양쪽 i18n.

## Verdict
**ALL MUST PASS. PASS with no blockers.**

## Post-merge Actions
- Batch B (rich_table UI + Export UI E2E) 계속
- Batch C (접근성 + Partial 타입) 계속
- Batch D (직전 중간점검 prefill) 신규 착수
