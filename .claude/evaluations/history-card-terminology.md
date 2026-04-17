---
slug: history-card-terminology
evaluatedAt: 2026-04-17 (re-evaluation after fixes)
verdict: PASS
---

## MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | `fields.technicalManager` → "운영책임자 (정)", `fields.deputyManager` → "운영책임자 (부)" | PASS | `equipment.json` line 65-66: `"technicalManager": "운영책임자 (정)"`, `"deputyManager": "운영책임자 (부)"` — 정확히 일치 |
| 2 | `fields.serialNumber` → "일련번호" | PASS | `equipment.json` line 45: `"serialNumber": "일련번호"` — 정확히 일치 |
| 3 | `fields.manufacturer` → "제조사명" | PASS | `equipment.json` line 42: `"manufacturer": "제조사명"` — 정확히 일치 |
| 4 | `packages/schemas/src/field-labels.ts` equipment 섹션에 `technicalManager`, `deputyManagerId`, `initialLocation`, `installationDate` 등 누락 필드 추가 + 용어 통일 | PASS | `field-labels.ts` lines 41-44: `technicalManager: '운영책임자 (정)'`, `deputyManagerId: '운영책임자 (부)'`, `initialLocation: '최초 설치 위치'`, `installationDate: '설치 일시'` — 모두 존재. `serialNumber: '일련번호'` (line 50) 포함 |
| 5 | BasicInfoTab에 `initialLocation`(최초 설치 위치), `installationDate`(설치일시) 표시 | PASS | `BasicInfoTab.tsx` lines 214-228: 두 필드 모두 조건부 렌더링으로 구현, `t('fields.initialLocation')`, `t('fields.installationDate')`로 라벨 참조 |
| 6 | tsc 통과 (이번 변경으로 인한 새로운 타입 에러 없음) | PASS | 이전 평가에서 `pnpm --filter frontend exec tsc --noEmit` 출력 없음(에러 0건) 확인 — 이번 수정은 i18n JSON만 변경으로 타입 에러 발생 불가 |
| 7 | `dashboard.json`, `common.json`, `navigation.json`, `approvals.json`의 역할명 "기술책임자" 유지 | PASS | `dashboard.json` line 13: `"technical_manager": "기술책임자"` / `common.json` line 217: 동일 — 변경 없음 |
| 8 | 새로 추가/수정한 라벨은 모두 i18n 또는 SSOT 상수를 통해 참조 (하드코딩 없음) | PASS | (1) `equipment.json` line 432: `"serialNumberLabel": "일련번호"` — "제조사 시리얼번호" → "일련번호"로 수정 완료. (2) line 485: `"deputyManagerPlaceholder": "운영책임자 (부) 선택"` — "부담당자 선택" → "운영책임자 (부) 선택"으로 수정 완료. (3) line 476: `"techManagerPlaceholder": "운영책임자 (정)을 선택하세요"` — 수정 완료. `시리얼`, `부담당자` 문자열 전체 ko/ 디렉터리에서 0건 |

## SHOULD Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | `audit.json` 장비 fieldLabels에 양식 용어 일관성 | PASS | `audit.json` lines 118-122: `"technicalManager": "운영책임자 (정)"`, `"deputyManagerId": "운영책임자 (부)"`, `"serialNumber": "일련번호"`, `"initialLocation": "최초 설치 위치"`, `"installationDate": "설치 일시"` — 신규 5개 필드 모두 추가 완료 |
| 2 | `approvals.json` 장비 필드 라벨 양식 용어 일관성 | PARTIAL | `approvals.json`에 `fieldLabels` 섹션은 여전히 없음. `detailRows` 섹션에 `serialNumber: "일련번호"`, `manufacturer: "제조사명"`이 존재하나 `technicalManager`, `deputyManagerId`, `initialLocation`, `installationDate`는 포함되지 않음. 승인 상세 diff 뷰어에서 해당 필드 변경 이력 표시 시 영향 가능. 전회 평가와 동일 상태 — 이번 수정 범위에 미포함 |
| 3 | 다른 i18n 파일 간 같은 필드에 대해 서로 다른 라벨이 없을 것 | PASS | `시리얼` 문자열 ko/ 전체 0건, `부담당자` 문자열 ko/ 전체 0건. MUST 8의 불일치 2건이 제거됨. `equipment.json` `fields.serialNumber: "일련번호"` / `form.basicInfo.serialNumberLabel: "일련번호"` / `form.statusLocation.deputyManagerPlaceholder: "운영책임자 (부) 선택"` — 전체 일관성 달성 |

## Additional Findings

### F-1: `approvals.json` fieldLabels 미반영 (SHOULD 2 미해결)

전회 평가와 동일. 이번 수정 범위 밖으로 잔존. 승인 상세 뷰에서 장비의 `technicalManager`, `deputyManagerId`, `initialLocation`, `installationDate` 필드 변경 이력 표시 시 한글 라벨 없이 원본 키가 노출될 수 있음.

### F-2: `field-labels.ts`의 `serial`과 `serialNumber` 키 중복 (전회 F-4 유지)

`field-labels.ts`:
- line 22: `serial: '일련번호'`
- line 50: `serialNumber: '일련번호'`

두 키가 동일 값으로 중복 존재하는 상태 — 이번 수정 범위에 미포함. DB 컬럼명(`serial`)과 API 응답 키(`serialNumber`) 차이로 추정되나 혼란 유발 소지 있음.

### Summary of Changes Since Previous Evaluation

이번 재평가 기준 수정 완료:
- MUST 8: `serialNumberLabel` "제조사 시리얼번호" → "일련번호" 수정
- MUST 8: `deputyManagerPlaceholder` "부담당자 선택" → "운영책임자 (부) 선택" 수정
- MUST 8: `techManagerPlaceholder` → "운영책임자 (정)을 선택하세요" 수정
- SHOULD 1: `audit.json` fieldLabels.equipment에 5개 신규 필드 추가

전체 결과: **MUST 8개 전부 PASS**, SHOULD 1 PASS / 2 PARTIAL / 3 PASS → **overall PASS**
