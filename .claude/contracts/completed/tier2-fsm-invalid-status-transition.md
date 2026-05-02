# Contract: tier2-fsm-invalid-status-transition

**Date**: 2026-05-02  
**Mode**: Mode 2  
**Sprint**: INVALID_STATUS_TRANSITION + 도메인 FSM inline 전멸 → ErrorCode SSOT 5-layer 격상

---

## Sprint 목표

7개 도메인 service에 잔존하는 inline FSM code string (INVALID_STATUS_TRANSITION 16건, NOT_SUBMITTER 2건, 도메인 FSM 19건) → ErrorCode SSOT 5-layer 격상. 인라인 string literal **전멸**. 누락 0, 타협 0.

---

## MUST Criteria

| ID | Criterion | Verification |
|---|---|---|
| **M-1** | `grep -rn "code: 'INVALID_STATUS_TRANSITION'" apps/backend/src/` 결과 **0건** | shell grep |
| **M-2** | `pnpm --filter backend run tsc --noEmit` PASS (Record<ErrorCode, number> 강제 검증) | shell |
| **M-3** | `pnpm --filter frontend run tsc --noEmit` PASS | shell |
| **M-4** | `pnpm --filter backend run test` PASS (기존 테스트 회귀 없음) | shell |
| **M-5** | 신규 ErrorCode 34개 모두 `errorCodeToStatusCode` Record에 등재 → M-2 자동 검증 | M-2 derivative |
| **M-6** | 신규 ErrorCode 34개 모두 frontend mapper(`lib/errors/<domain>-errors.ts`) I18N_KEYS map에 등재 | grep `apps/frontend/lib/errors/*.ts` |
| **M-7** | 신규 i18n 키 모두 ko + en 양쪽에 등재 (parity) | grep count 비교 |
| **M-8** | `pnpm --filter backend run verify:e2e-actors` PASS | shell |
| **M-9** | `code: 'NOT_SUBMITTER'` 인라인 **0건** | grep |
| **M-10** | calibration, calibration-factors, equipment-imports, NC 도메인 디렉토리에서 대상 FSM inline code 잔존 **0건** | grep per domain |

---

## SHOULD Criteria

| ID | Criterion |
|---|---|
| **S-1** | i18n 키 명명이 UL-QP-18 도메인 언어 일치 (초안/제출/검토/승인/반려/재제출 등 용어 일관) |
| **S-2** | 한국어 메시지가 사용자 멘탈 모델과 일치 (예: "초안 상태의 중간점검만 수정할 수 있습니다.") |
| **S-3** | calibration-errors.ts의 기존 local `CalibrationErrorCode` enum과 신규 `ErrorCode.CalibrationNotFound` i18n key가 동일하여 기존 `getCalibrationErrorI18nKey()` 호출자 영향 없음 |
| **S-4** | equipment-imports CasPrecondition의 `errorCode` 필드가 string 타입 호환 확인 |
| **S-5** | ErrorCode value 문자열은 기존 inline literal과 동일 유지 (API 호환성 보존 — `'IMPORT_NOT_FOUND'` 등) |
| **S-6** | 각 도메인 mapper의 mapXxxErrorToToast 함수 시그니처/인터페이스 변경 없음 |

---

## 검증 시퀀스

```bash
# M-1: INVALID_STATUS_TRANSITION 전멸
count=$(grep -rn "code: 'INVALID_STATUS_TRANSITION'" apps/backend/src/ | wc -l)
echo "INVALID_STATUS_TRANSITION 잔존: $count" # expect: 0

# M-9: NOT_SUBMITTER 전멸
count=$(grep -rn "code: 'NOT_SUBMITTER'" apps/backend/src/ | wc -l)
echo "NOT_SUBMITTER 잔존: $count" # expect: 0

# M-2: Backend tsc
pnpm --filter backend run tsc --noEmit

# M-3: Frontend tsc
pnpm --filter frontend run tsc --noEmit

# M-4: Backend test
pnpm --filter backend run test

# M-8: e2e actor invariants
pnpm --filter backend run verify:e2e-actors

# M-10: 도메인별 FSM inline 잔존 확인 (calibration 도메인)
grep -n "code: 'CALIBRATION_" \
  apps/backend/src/modules/calibration/calibration.service.ts | grep -v "ErrorCode\." | wc -l  # expect: 0
grep -n "code: 'CALIBRATION_FACTOR_" \
  apps/backend/src/modules/calibration-factors/calibration-factors.service.ts | grep -v "ErrorCode\." | wc -l  # expect: 0
grep -n "code: 'IMPORT_\|errorCode: 'IMPORT_" \
  apps/backend/src/modules/equipment-imports/equipment-imports.service.ts | grep -v "ErrorCode\." | wc -l  # expect: 0
grep -n "code: 'NC_CLOSED_" \
  apps/backend/src/modules/non-conformances/non-conformances.service.ts | grep -v "ErrorCode\." | wc -l  # expect: 0

# M-7: i18n parity (ko/en 카운트 동일 여부)
ko_count=$(grep -c '"onlyDraftCanUpdate"\|"onlyDraftCanSubmit"\|"onlySubmittedCanWithdraw"' \
  apps/frontend/messages/ko/*.json | awk -F: '{s+=$2} END {print s}')
en_count=$(grep -c '"onlyDraftCanUpdate"\|"onlyDraftCanSubmit"\|"onlySubmittedCanWithdraw"' \
  apps/frontend/messages/en/*.json | awk -F: '{s+=$2} END {print s}')
echo "ko_count=$ko_count en_count=$en_count"  # expect: equal
```

---

## 제외 범위 (Out of Scope)

- Controller layer inline literal (equipment domain은 01bca2d1에서 완료)
- NC의 나머지 inline codes (NC_TYPE_REQUIRED, NC_NOT_FOUND 등) — 별도 sprint
- CalibrationFactors UI approverComment (runtime 400) — 별도 tech-debt
- Pipe/Interceptor layer inline literal — tech-debt

---

## 핵심 위험 (Mitigation)

| Risk | Mitigation |
|---|---|
| 새 ErrorCode 미등재 → compil 실패 | `Record<ErrorCode, number>` 타입 강제 → Phase 1 tsc 즉시 검출 |
| i18n 키 누락 → toast가 raw key 노출 | M-7 parity grep + ko/en 동시 등재 원칙 |
| CasPrecondition errorCode 필드 타입 불일치 | S-4 확인 + tsc가 자동 검출 |
| calibration-errors.ts local enum 혼재 | S-3 확인 — string value 동일이므로 런타임 호환 |
| 기존 테스트가 inline string 비교 → 회귀 | M-4 test PASS 필수 + 테스트 파일 ErrorCode enum value 업데이트 |
