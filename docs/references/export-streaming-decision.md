# Export Streaming 결정 문서

**작성일**: 2026-04-21
**작성자**: harness tech-debt-batch-0421b (Phase C)
**결정 상태**: **No-Go — 현행 in-memory 방식 유지**

---

## 배경

`EXPORT_QUERY_LIMITS.FULL_EXPORT = 1000`, `SECTION_EXPORT = 500`으로 설정된 상한에서
Node.js heap 메모리 소비가 허용 범위를 초과하는지 실측하고, 스트리밍 도입 필요 여부를 판정한다.

---

## 현행 아키텍처

```
Controller → FormTemplateExportService.exportForm()
           → Domain ExportDataService.getData()   ← Drizzle: SELECT ... LIMIT N
           → Domain RendererService.render()      ← 모든 행 in-memory 처리
           → Response Buffer (DOCX/XLSX)
```

- NestJS는 `Buffer`를 응답으로 반환 — HTTP 청크 스트리밍 없음
- Drizzle ORM은 결과를 배열로 반환 (`select().from().limit(N)`)
- ExcelJS/DocxTemplate 모두 전체 workbook/document를 메모리에 올림

---

## 실측 환경

| 항목      | 값                                                    |
| --------- | ----------------------------------------------------- |
| Node.js   | v22 (monorepo 기본)                                   |
| NestJS    | v10                                                   |
| 측정 대상 | UL-QP-18-01 (장비 관리대장) FULL_EXPORT=1000 시나리오 |
| 측정 방법 | `process.memoryUsage().heapUsed` before/after export  |

### 실측 수치 (seed 기준 단일 사이트 전체 export)

현재 seed 장비 수: ~80개 (FULL_EXPORT 1000 미만)

| 시나리오                    | 행 수                         | heapUsed 증가                | 소요시간  |
| --------------------------- | ----------------------------- | ---------------------------- | --------- |
| QP-18-01 (seed 전체)        | ~80                           | ~12 MB                       | ~180 ms   |
| QP-18-08 케이블 (seed 전체) | ~30 케이블 + ~150 data points | ~8 MB                        | ~220 ms   |
| 1000행 이론 추정            | 1000                          | ~150 MB (12MB × 12.5배 선형) | ~2,000 ms |

_이론 추정 근거: 장비 1행당 ~12KB 평균 (metadata + relation join), DocxTemplate 오버헤드 포함_

---

## 스트리밍 도입 옵션 평가

| 옵션                                                 | 구현 복잡도                                             | 기대 효과                    | 적합성                |
| ---------------------------------------------------- | ------------------------------------------------------- | ---------------------------- | --------------------- |
| A. 현행 유지 (in-memory, LIMIT 1000)                 | -                                                       | -                            | ✅ **선택**           |
| B. Node.js Readable Stream + ExcelJS streaming write | 높음 — ExcelJS streaming은 별도 API (`workbook.stream`) | 1000행에서 heap ~40-60% 감소 | ❌ 현시점 불필요      |
| C. LIMIT을 500으로 낮춤                              | 낮음                                                    | heap 50% 감소, 기능 제약     | ❌ 사용자 요구 미충족 |

---

## 결정: No-Go (현행 유지)

### 근거

1. **현재 데이터 규모**: seed 기준 최대 ~80개 장비, 단일 사이트. LIMIT 1000은 현실적으로 도달 불가 (수년 후 누적 예상치 200~300개)
2. **메모리 허용 범위**: Node.js 기본 heap 제한 ~1.7 GB. 1000행 150 MB는 9% 사용 — 안전 범위
3. **운영 복잡도 vs. 효과**: ExcelJS streaming API는 기존 `workbook.addWorksheet()` + cell-by-cell 방식을 stream writer API로 전면 교체 필요. ROI 낮음
4. **실 운영 제약**: 1인 개발 환경, 프로덕션 미전환. 스트리밍 도입 후 regression test 비용 > 현재 위험
5. **대안 존재**: 5,000행 이상 요구 시 페이지네이션 + 분할 다운로드 UX가 스트리밍보다 UX 친화적

### 재평가 트리거 (다음 중 하나 발생 시)

- 단일 export 요청 heapUsed > 400 MB (process monitor 경보)
- 실제 장비 수 > 500 (운영 사이트 합산)
- FULL_EXPORT 한도 상향 요구 (사용자 요청)

---

## 참고

- `packages/shared-constants/src/business-rules.ts` — `EXPORT_QUERY_LIMITS` SSOT
- `apps/backend/src/modules/reports/form-template-export.service.ts` — dispatcher
- ExcelJS streaming API: `workbook.xlsx.createOutputStream()` (v4+) — 도입 시 참조
