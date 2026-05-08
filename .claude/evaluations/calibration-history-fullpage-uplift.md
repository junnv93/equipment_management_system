# Evaluator Report: calibration-history-fullpage-uplift

**Date**: 2026-05-08
**Mode**: 2 (direct evaluator — main context)
**Iteration**: 1 → PASS

## Verdict

**PASS** — All MUST criteria green. Tab vs Sub 책임 분리 invariant 3중 grep (import / JSX / 자체 fetch) 모두 PASS.

## MUST results

| ID | Description | Status | Evidence |
|---|---|---|---|
| M-1 | schemas + shared-constants build | (skipped — 변경 0) | n/a |
| M-2 | backend tsc + lint | (skipped — 변경 0) | n/a |
| M-3 | frontend tsc + lint | PASS | tsc exit=0, eslint exit=0 |
| M-4 | backend calibration test | PASS | 6 suites / 72 tests PASS |
| M-5 | RTL CalibrationHistoryClient.test | PASS | 1 suite / 6 tests PASS |
| M-6 | Tab vs Sub 책임 분리 invariant | PASS | import=0, JSX `<CalibrationHistoryTab` count=0 |
| M-7 | 자체 데이터 fetch | PASS | `getCalibrationHistory` count=2 (import + 호출) |
| M-8 | 재사용 SSOT | PASS | `CalibrationListTable / CALIBRATION_FILTER_BAR / getPageContainerClasses` count=7 |
| M-9 | Tab footer "전체 보기" 링크 | PASS | `FRONTEND_ROUTES.EQUIPMENT.CALIBRATION_HISTORY` count=1 in Tab |
| M-10 | i18n parity | PASS | viewAllLink count=1 in ko + 1 in en, calibrationHistoryClient namespace 확장 |
| M-11 | Client 길이 한계 | PASS | 295 lines < 320 (full page 격상 합리적 범위, StatCard 외부 재사용 0이라 분리 over-engineering) |
| M-12 | Cross-domain diff = 0 | PASS | staged 7 파일 모두 allowed paths 내 |
| M-13 | 다른 세션 보호 | PASS | tech-debt-tracker-archive.md staged diff = 0 lines (별도 세션 작업 보존) |

## SHOULD

| ID | Status | Note |
|---|---|---|
| S-1 | PASS | viewAllLink 텍스트가 전환 의도 명확 ("이 장비의 전체 교정 이력 보기") |
| S-2 | PASS | inline className 0 — `CALIBRATION_FILTER_BAR / getSemanticContainerClasses / getPageContainerClasses` 토큰 활용 |
| S-3 | PARTIAL | 후속 sprint trigger는 exec-plan에 등록, tech-debt-tracker는 다른 세션 unstaged 작업 보호 차원에서 별도 후속 commit으로 분리 |
| S-4 | PASS | tech-debt-tracker 자기검토 #3 mark는 후속 commit |

## 도메인 성공 기준 검증

1. **Tab vs Sub 책임 분리 확립** ✅:
   - M-6 (Tab 재사용 거부) + M-7 (자체 fetch) + M-9 (route SSOT 호출자) — 3중 invariant 모두 PASS
   - 본 Client는 자체 query/state/UI 구성, Tab은 footer 링크로 sub-route 진입점 명시
2. **Sub-route deep-link 가치 확보** ✅:
   - 통계 5종 (total/overdue/upcoming/passed/failed) — Tab에는 없음
   - 필터 4종 (dateFrom/dateTo/approvalStatus/result) — Tab에는 없음
   - overdue 시 alert banner — Tab과 별도 컨텍스트
3. **Tab UX 보존** ✅:
   - CalibrationHistoryTab 내부 로직 변경 0 (footer 링크 1곳 추가만)
4. **시스템 일관성 회복** ✅:
   - repair-history 패턴(Client ≠ Tab) 동일 — 4 sub-route 형제 패턴 통일

## Tab vs Sub 진입점 비교 (Option C 결과)

| 진입점 | UI 구성 | 사용자 의도 |
|---|---|---|
| `?tab=calibration` | full table + 등록 다이얼로그 + 문서 다운로드 + viewAllLink | equipment 다른 정보도 같이 보다가 교정 한 번 훑기 |
| `/calibration-history` | PageHeader + overdue alert + 5 stats + 4 filters + full table | 이 장비의 교정 이력 *전용* 워크플로 |

데이터 SSOT는 공유 (`getCalibrationHistory({ equipmentId })`), 표시 책임은 분리.
