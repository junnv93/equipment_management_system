---
slug: report-export-mapping
contract: report-export-mapping
date: 2026-04-09
result: PASS
---

# Evaluation: Report Export Mapping 검증 및 개선

## MUST Criteria

### MUST-1: `pnpm tsc --noEmit` 통과 (에러 0)
**PASS** — 출력 없이 정상 종료 확인.

### MUST-2: 수리이력 보고서에서 DB에 존재하지 않는 `cost` 컬럼이 제거됨
**PASS** — `getMaintenanceData` (line 901~961)에서 `cost`, `costStr`, `비용(원)` 관련 코드가 완전히 제거됨.
- columns 배열: 7개 컬럼만 존재 (관리번호, 장비명, 팀, 수리일자, 수리내용, 수리결과, 비고)
- rows.map: `costStr` 매핑 없음
- DB select: `repairHistoryTable`에서 cost 조회 없음
- 스키마 확인: `packages/db/src/schema/calibrations.ts:58`에 `cost` 필드 존재하지만, `repair_history` 스키마에는 `cost` 필드 없음 — 제거 정당.

참고: `getCalibrationStatusData` (line 689~759)에서는 `calibrations.cost`를 정상적으로 사용 중 — 이는 DB 스키마에 실제 존재하는 필드이므로 올바름.

### MUST-3: 장비현황 보고서에 `serialNumber` 컬럼이 추가되어 DB 조회 결과와 일치
**PASS** — `getEquipmentInventoryData` (line 618~687):
- DB select: `serialNumber: equipmentTable.serialNumber` (line 641) — 이미 조회됨
- columns 배열: `{ header: 'S/N', key: 'serialNumber', width: 16 }` (line 655) 추가됨
- rows.map: `serialNumber: r.serialNumber ?? '-'` (line 684) 포함
- 3곳 모두 정합성 확인.

### MUST-4: `docs/manual/report-export-mapping.md` 문서 존재 및 정확성
**PASS** — 문서 존재 확인. 525줄 규모. 스팟체크 결과:

**범용 레포트 (reports.service.ts 대비):**
- 장비현황 보고서 (2.1): 12개 컬럼 매핑 — 코드와 일치 (S/N 포함)
- 교정현황 보고서 (2.2): 11개 컬럼 — 코드와 일치 (비용(원) 포함, calibrations.cost 사용)
- 수리이력 보고서 (2.5): 7개 컬럼 — 코드와 일치 (cost 제거 반영됨)
- 감사로그 보고서 (2.6): 9개 컬럼 — 코드와 일치

**UL-QP 양식 (form-template-export.service.ts 대비):**
- QP-18-01 (3.1): 16열 매핑, STATUS_TO_AVAILABILITY 변환표 — 코드와 일치
- QP-18-06 (3.4): 셀 위치(0,2,1 ~ 0,24,0), 장비 14행 제한, conditionFallback — 코드와 일치
- QP-18-07 (3.5): 10열 매핑 — 코드 미검증 (스팟체크 범위 외)

## SHOULD Criteria

### SHOULD-1: 문서의 DB 필드명이 실제 스키마와 일치
**PASS** — 스팟체크한 필드들 (`equipment.serial_number`, `calibrations.cost`, `repair_history`에 cost 없음) 모두 스키마와 일치.

### SHOULD-2: 변경된 코드가 기존 레포트의 동작을 깨뜨리지 않음
**PASS** — 변경은 additive(S/N 컬럼 추가) 또는 phantom 제거(존재하지 않는 cost 컬럼)만 수행. 기존 컬럼 순서/키 변경 없음. TypeScript 컴파일 통과.

## Summary

| Criterion | Result |
|-----------|--------|
| MUST-1 tsc --noEmit | PASS |
| MUST-2 cost 컬럼 제거 | PASS |
| MUST-3 serialNumber 추가 | PASS |
| MUST-4 문서 정확성 | PASS |
| SHOULD-1 DB 필드명 일치 | PASS |
| SHOULD-2 기존 동작 보존 | PASS |

**Overall: PASS (4/4 MUST, 2/2 SHOULD)**
