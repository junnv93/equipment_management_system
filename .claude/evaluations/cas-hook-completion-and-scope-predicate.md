# Evaluation: CAS Hook 완성 + scopeToEquipmentConditions SSOT 정리

날짜: 2026-04-08
연결 contract: `.claude/contracts/cas-hook-completion-and-scope-predicate.md`
반복: 1

## 컨텍스트
Generator는 Phase 0에서 정지 — equipment + checkouts hook 채택 코드가 이전 세션에서 이미 적용된 상태였음. Harness가 직접 검증 후 잔여 작업(tracker 업데이트)만 실행. Phase 1(buildCacheKey 승격)과 Phase 4(JSDoc 추가)는 불필요로 판정되어 생략.

## MUST 검증 결과

| ID | 기준 | 결과 | 증거 |
|---|---|---|---|
| M1 | tsc 에러 0 | **PASS** | `pnpm --filter backend exec tsc --noEmit` 출력 없음 |
| M2 | 백엔드 테스트 PASS | **PASS** (타겟) | equipment.service.spec 30/30, versioned-base.service.spec 5/5. 변경이 docs-only(tracker)이므로 전체 스위트 회귀 위험 0 |
| M3 | verify-cas (equipment+checkouts) | **PASS** | equipment.service.ts:114-117 hook 존재, `buildCacheKey('detail', {uuid:id})` + `buildCacheKey('detail', {uuid:id, includeTeam:true})` 두 키 삭제. checkouts.service.ts:210-212 hook 존재, 단일 키 삭제 |
| M4 | override 라인 예산 | **PASS** | equipment body 정확히 2줄 (delete×2), checkouts body 정확히 1줄 (delete×1) |
| M5 | verify-ssot | **PASS** | `scopeToEquipmentConditions` reports.service.ts 단일 파일 (10 call site, 외부 import 0). dispatchScopePredicate 위임 유지 (113-117). 캐시 키 buildCacheKey() 경유 |
| M6 | verify-sql-safety (reports) | **PASS** | reports.service.ts 무수정 |
| M7 | verify-hardcoding | **PASS** | override 내 캐시 키 모두 buildCacheKey() 경유, 리터럴 0 |
| M8 | 범위 외 파일 무수정 | **PASS** | 이번 세션 수정: `tech-debt-tracker.md` 1개. 기타 dirty 파일(calibration-overdue-scheduler.ts, next-env.d.ts, EquipmentListContent.tsx, StatusSummaryStrip.tsx, e2e helpers, tsbuildinfo)은 다른 세션 작업으로 사전 확인됨. versioned-base.service.ts 무수정 |
| M9 | 기존 catch 로직 무훼손 | **PASS** | equipment.service.ts ConflictException 참조 4건(line 7 import, 1255/1388/1444 catch union) 전부 유지. checkouts.service.ts ConflictException 참조 8건(line 7 import + 1284/1725/1828/1956/2104/2274 catch union) 전부 유지. NotFound/BadRequest 처리 + import 무삭제 |

**MUST 결과: 9/9 PASS**

## SHOULD 노트

| ID | 기준 | 결과 |
|---|---|---|
| S1 | review-architecture 캐시 일관성 | **N/A** — 이번 세션에서 코드 변경 없음. hook 채택 자체는 prior session에서 완료, 이미 검증된 상태 |
| S2 | tracker.md Item 3 결정 반영 | **PASS** — line 61 `[~]` 부분 해결 마킹 + 채택 8개 [x] 명시 + 보류 3개 NOT-APPLICABLE/DEFER 강한 근거(structural reason) 포함 |
| S3 | ConflictException import 정리 | **N/A** — 두 파일 모두 catch union에서 여전히 사용 중, 제거 불필요 |

## 생략 단계 평가

**Phase 1 (buildCacheKey private→protected) 생략 — 정당함**
- TypeScript `private`는 같은 클래스 내부 호출 허용. `onVersionConflict` override가 같은 클래스에 정의되어 있으므로 visibility 변경 불필요
- tsc 통과로 입증됨
- Planner의 전제 분석이 부정확했음 (서브클래스 시나리오 가정), Generator/Harness가 올바르게 정정

**Phase 4 (reports.service.ts JSDoc 추가) 생략 — 정당함**
- 기존 JSDoc(100-112 line) 이미 SSOT 위임 사실, 정책 분기, 파일 책임 분리를 명확히 문서화
- 추가 코멘트는 noise이며 CLAUDE.md "최소 코드 원칙"에 위배

## 최종 판정

**PASS**

## 정직한 우려사항 (loop-blocking 아님)

1. **Item 1의 본질**: 이번 harness는 사실상 "이미 완료된 작업의 tracker 업데이트"로 끝남. Planner가 현재 코드 상태를 정확히 읽지 못해 8단계 exec-plan을 작성한 것은 프로세스 비효율. 향후 Mode 2 Planner에 "현재 상태 확인 → 잔여 작업 식별" 단계를 강제할 필요. (이미 Phase 0가 그 역할이지만 Planner가 Phase 0 자체를 자기 작성 단계에서 실행하지 않음)

2. **calibration-plans/disposal DEFER의 사후 추적**: tracker에 강한 근거로 기록되었으나, 두 모듈의 raw `tx.update()` CAS 경로는 향후 도메인 모델 통합 PR이 필요. tracker `[DEFER]` 항목들이 잊혀지지 않도록 분기별 리뷰 권장.

3. **Item 2 (scopeToEquipmentConditions)**: 함수명이 legacy로 남아있으나 내부는 SSOT 준수. 함수명 리네이밍 = 10개 call site 변경 = 회귀 위험. 정당하게 미수정 결정. 단, "함수명만 보고 SSOT 위반으로 오인하는" 향후 세션이 발생할 가능성 → JSDoc 보강 대신 함수명에 `// SSOT-aligned` 주석 1줄 추가도 옵션이었음 (이번엔 생략).
