# 스프린트 계약: tier-2-rejectmodal-ssot-integration

## 생성 시점
2026-05-02

## Slug
`tier-2-rejectmodal-ssot-integration`

## Mode
2 (Full Harness)

## Plan
`.claude/exec-plans/active/2026-05-02-tier-2-rejectmodal-ssot-integration.md`

---

## Goal

7개 도메인의 자체 reject Dialog를 `apps/frontend/components/approvals/RejectModal.tsx` SSOT로 일괄 통합하면서, 동시에 backend reject DTO/service/ErrorCode/i18n/frontend mapper의 **5-layer defense-in-depth 패턴** (disposal/calibration-plan에서 검증)을 7개 도메인에 페어링 격상한다. 결과적으로 frontend 검증 SSOT(RejectReasonSchema)·UI 토큰·i18n·a11y가 단일 진입점으로 통합되고, backend는 모든 reject 엔드포인트가 동일한 강도의 fail-close + type-safe ErrorCode 응답을 보장한다.

---

## Scope

### IN
- 7 frontend reject dialogs:
  - `apps/frontend/components/equipment-imports/EquipmentImportDetail.tsx`
  - `apps/frontend/components/equipment/CalibrationApprovalActions.tsx`
  - calibration-factors reject dialog (Phase 0에서 정확 경로 확정)
  - `apps/frontend/app/(dashboard)/software/[id]/validation/_components/ValidationRejectDialog.tsx`
  - `apps/frontend/components/equipment/IntermediateInspectionList.tsx`
  - `apps/frontend/components/inspections/SelfInspectionFormDialog.tsx`
  - `apps/frontend/components/non-conformances/NCDetailClient.tsx`
- 7 backend reject DTO Zod 격상 (`.trim().min(REJECTION_REASON_MIN_LENGTH).max(LONG_TEXT_MAX_LENGTH)`)
- 7 backend service reject fail-close + ErrorCode SSOT 격상
- 7개 도메인 frontend mapper SSOT (신규 또는 확장)
- ErrorCode enum 7개 신규 등록 + `errorCodeToStatusCode` 매핑
- ko/en i18n parity (`errors.rejectionReasonRequired` 키 14개)
- RejectModal `mode='domain'` API 확장 (single/bulk 무변경)
- verify-zod SKILL Step 16 baseline 갱신

### OUT
- 다른 도메인의 reject 메서드 격상 (equipment / checkout / disposal / calibration-plan은 별도 sprint)
- approve 메서드 ErrorCode 격상 (별도 sprint)
- RejectModal `extraFields` slot 추가 (D2 deferred)
- mapper unit test 100% 커버리지 (SHOULD)
- e2e Playwright spec 신설 (SHOULD)
- analytics.track reject 이벤트 통합 (SHOULD)

---

## MUST 기준 (전부 통과해야 PASS — 실패 시 루프 재진입)

### M-1. ErrorCode enum SSOT 7개 신규 등록

```bash
grep -c "RejectionReasonRequired\|RejectCommentRequired" packages/schemas/src/errors.ts
```
**Expected**: ≥ 18 (기존 disposal `DisposalRejectCommentRequired` + calibration-plan `CalibrationPlanRejectionReasonRequired` + 7 신규 = 9 enum + 9 status mapping)

```bash
grep -E "EquipmentImportRejectionReasonRequired|CalibrationRejectionReasonRequired|CalibrationFactorRejectionReasonRequired|SoftwareValidationRejectionReasonRequired|IntermediateInspectionRejectionReasonRequired|SelfInspectionRejectionReasonRequired|NonConformanceRejectionReasonRequired" packages/schemas/src/errors.ts | wc -l
```
**Expected**: ≥ 14 (각 코드가 enum value + errorCodeToStatusCode = 2회 등장)

### M-2. tsc 0 errors

```bash
pnpm tsc --noEmit
```
**Expected**: exit 0

### M-3. 6 frontend dialogs RejectModal 사용 + 자체 inline Dialog 제거

**Phase 0 디스커버리 결과**: 7 도메인 중 calibration-factors는 frontend reject UI 미구현 상태(백엔드만 존재). 본 sprint는 ① 7 backend Zod/service/mapper 5-layer 완성, ② 6 frontend reject UI 통합. calibration-factor frontend reject UI 신규 구축은 별도 sprint(`tier-2-calibration-factor-reject-ui-build`)로 분리 — tech-debt-tracker 등록.

```bash
# 6 사이트가 RejectModal import (각 ≥1)
# 정정된 경로 (Phase 0 디스커버리 결과):
grep -rln "from '@/components/approvals/RejectModal'\|approvals/RejectModal" \
  apps/frontend/components/equipment-imports/EquipmentImportDetail.tsx \
  apps/frontend/components/equipment/CalibrationApprovalActions.tsx \
  apps/frontend/components/equipment/IntermediateInspectionList.tsx \
  apps/frontend/components/equipment/SelfInspectionTab.tsx \
  apps/frontend/components/non-conformances/NCDetailClient.tsx \
  apps/frontend/app/\(dashboard\)/software/\[id\]/validation/_components/ValidationRejectDialog.tsx \
  2>/dev/null | wc -l
```
**Expected**: ≥ 6

```bash
# 변경된 7 frontend 파일에 reject용 inline Textarea + Dialog 패턴 잔존 0건
# (즉 자체 Dialog가 사라지고 RejectModal로 위임됨)
for f in \
  apps/frontend/components/equipment-imports/EquipmentImportDetail.tsx \
  apps/frontend/components/equipment/CalibrationApprovalActions.tsx \
  apps/frontend/components/equipment/IntermediateInspectionList.tsx \
  apps/frontend/components/inspections/SelfInspectionFormDialog.tsx \
  apps/frontend/components/non-conformances/NCDetailClient.tsx; do
  if [ -f "$f" ]; then
    # 자체 reject Textarea가 잔존하는지 (RejectModal에 위임됐다면 reject용 Textarea는 0)
    hits=$(grep -c "<Textarea[^>]*reject\|<Textarea[^>]*rejectionReason" "$f" 2>/dev/null || echo 0)
    [ "$hits" = "0" ] && echo "$f: PASS" || echo "$f: FAIL ($hits inline reject textareas)"
  fi
done
```
**Expected**: 5 PASS lines

### M-4. Backend Zod 7 reject 필드 5-layer 적용

```bash
# verify-zod Step 15 명령 #1 — frontend 하드코딩 0
grep -rnE "(rejectionReason|opinion|comment|reason|cause)\.(trim\(\)\.)?length\s*[<>=]+\s*10" \
  apps/frontend/components apps/frontend/app --include="*.tsx" --include="*.ts" 2>/dev/null \
  | grep -v "VALIDATION_RULES\|\.next\|tests/" | wc -l
```
**Expected**: 0

```bash
# 7 도메인 backend dto에 REJECTION_REASON_MIN_LENGTH 사용 ≥1
for domain in equipment-imports calibration calibration-factors software-validations intermediate-inspections self-inspections non-conformances; do
  hits=$(grep -rn "REJECTION_REASON_MIN_LENGTH" apps/backend/src/modules/${domain}/ --include="*.dto.ts" 2>/dev/null | wc -l)
  [ "$hits" -ge 1 ] && echo "$domain: PASS ($hits)" || echo "$domain: FAIL"
done
```
**Expected**: 7 PASS lines

### M-5. Backend service 7 reject fail-close + ErrorCode 사용

```bash
# 각 도메인 service에 ErrorCode.<Domain>RejectionReasonRequired 사용
for code in EquipmentImportRejectionReasonRequired CalibrationRejectionReasonRequired CalibrationFactorRejectionReasonRequired SoftwareValidationRejectionReasonRequired IntermediateInspectionRejectionReasonRequired SelfInspectionRejectionReasonRequired NonConformanceRejectionReasonRequired; do
  hits=$(grep -rln "ErrorCode\.${code}" apps/backend/src/modules/ --include="*.service.ts" 2>/dev/null | wc -l)
  [ "$hits" -ge 1 ] && echo "$code: PASS" || echo "$code: FAIL"
done
```
**Expected**: 7 PASS lines

```bash
# 격상 7 도메인 reject 흐름 인라인 string code 잔존 0건 (iter 2: reject path에 한정)
# reject 메서드 내 + reject DTO 관련 throw만 점검 — approve/create 등 다른 흐름은 별도 sprint
# reject 메서드 라인 범위로 grep
for domain in equipment-imports calibration calibration-factors software-validations intermediate-inspections self-inspections non-conformances; do
  # 각 service.ts에서 reject 메서드 본문 추출 + 인라인 string code grep
  hits=$(awk '/async reject(Calibration|Correction)?\(/,/^  }$/' apps/backend/src/modules/${domain}/*.service.ts 2>/dev/null | grep -cE "code: '[A-Z_]+'")
  echo "$domain: $hits inline codes in reject method"
done
```
**Expected**: 모든 도메인 0 (또는 명시적 ErrorCode 미등록 inline 0)

### M-6. Frontend mapper SSOT 7개 적용

```bash
# 9 mapper 파일 (5 기존 + 4 신규 또는 5 기존 + 5 신규 후 1 분리)
ls apps/frontend/lib/errors/*-errors.ts 2>/dev/null | grep -v "__tests__\|download" | wc -l
```
**Expected**: ≥ 9

```bash
# 각 도메인 mapper의 export 함수 존재
for f in \
  "apps/frontend/lib/errors/equipment-import-errors.ts:mapEquipmentImportErrorToToast" \
  "apps/frontend/lib/errors/calibration-errors.ts:mapCalibrationErrorToToast" \
  "apps/frontend/lib/errors/calibration-factor-errors.ts:mapCalibrationFactorErrorToToast" \
  "apps/frontend/lib/errors/software-validation-errors.ts:mapSoftwareValidationErrorToToast" \
  "apps/frontend/lib/errors/intermediate-inspection-errors.ts:mapIntermediateInspectionErrorToToast" \
  "apps/frontend/lib/errors/self-inspection-errors.ts:mapSelfInspectionErrorToToast" \
  "apps/frontend/lib/errors/non-conformance-errors.ts:mapNonConformanceErrorToToast"; do
  file="${f%:*}"
  fn="${f#*:}"
  if [ -f "$file" ]; then
    grep -c "export function $fn\|export const $fn" "$file"
  else
    echo "MISSING: $file"
  fi
done
```
**Expected**: 각 ≥ 1 export

### M-7. Frontend 6 호출처 mapper 사용 (calibration-factor UI 미구현은 Out of Scope)

```bash
# 6 도메인 reject 호출처에서 map*ErrorToToast 사용 (calibration-factor UI 별도 sprint)
grep -rln "map.*ErrorToToast" \
  apps/frontend/components/equipment-imports \
  apps/frontend/components/equipment \
  apps/frontend/components/inspections \
  apps/frontend/components/non-conformances \
  apps/frontend/app/\(dashboard\)/software \
  --include="*.tsx" --include="*.ts" 2>/dev/null | sort -u | wc -l
```
**Expected**: ≥ 6 (각 도메인 호출처 또는 mutation hook 파일)

### M-8. i18n parity (ko/en `errors.rejectionReasonRequired` with `{min}` param)

**참고**: 7 도메인은 4개 namespace JSON 파일을 공유 (`equipment` 4도메인 / `calibration` 2도메인 / `software` 1도메인 / `non-conformances` 1도메인). 따라서 namespace당 1개 SSOT 키로 통합 (caller의 useTranslations namespace 결정).

```bash
for namespace in equipment calibration software non-conformances; do
  ko=$(grep -c "rejectionReasonRequired" "apps/frontend/messages/ko/${namespace}.json" 2>/dev/null || echo 0)
  en=$(grep -c "rejectionReasonRequired" "apps/frontend/messages/en/${namespace}.json" 2>/dev/null || echo 0)
  [ "$ko" -ge 1 ] && [ "$en" -ge 1 ] && echo "$namespace: PASS (ko=$ko en=$en)" || echo "$namespace: FAIL (ko=$ko en=$en)"
done
```
**Expected**: 4 PASS lines

```bash
# 모든 4 namespace의 ko/en 키가 {min} 파라미터화 메시지 보유
for namespace in equipment calibration software non-conformances; do
  for locale in ko en; do
    f="apps/frontend/messages/${locale}/${namespace}.json"
    if [ -f "$f" ]; then
      hits=$(grep "rejectionReasonRequired" "$f" | grep -c "{min}")
      [ "$hits" -ge 1 ] && echo "$f: PASS" || echo "$f: FAIL (no {min} param)"
    fi
  done
done
```
**Expected**: 8 PASS lines (4 namespace × 2 locale)

### M-9. RejectModal `mode='domain'` 추가 + single/bulk 무회귀

```bash
# mode='domain' 분기 추가
grep -c "mode === 'domain'\|mode: 'domain'\|'domain';" apps/frontend/components/approvals/RejectModal.tsx
```
**Expected**: ≥ 2

```bash
# RejectReasonSchema 사용 보존 (검증 SSOT 무변경)
grep -c "RejectReasonSchema" apps/frontend/components/approvals/RejectModal.tsx
```
**Expected**: ≥ 1

```bash
# RejectModal 내부 useTranslations namespace 호출 1개만 (D7 — i18n 결합 최소화)
grep -E "^\s*const\s+\w+\s*=\s*useTranslations\(" apps/frontend/components/approvals/RejectModal.tsx | wc -l
```
**Expected**: 1 (`'approvals'` namespace 호출만 잔존)

### M-10. Backend build + test PASS

```bash
pnpm --filter backend run build
```
**Expected**: exit 0

```bash
pnpm --filter backend run test
```
**Expected**: exit 0 (모든 spec PASS)

### M-11. Frontend build + test PASS

```bash
pnpm --filter frontend run build
```
**Expected**: exit 0

```bash
pnpm --filter frontend run test
```
**Expected**: exit 0

### M-12. Service spec — 7 도메인 fail-close 분기 unit test

각 도메인 service spec에 다음 ≥1 assertion 추가:
- 빈 문자열 또는 N-1자 또는 공백만 reject → `BadRequestException` with `code: ErrorCode.<Domain>RejectionReasonRequired`

```bash
# 정정: head -1이 renderer.service.spec.ts를 잡지 않도록 grep -v로 제외
# 다중 spec 파일이 있는 도메인은 main service spec만 점검
for domain in equipment-imports calibration calibration-factors software-validations intermediate-inspections self-inspections non-conformances; do
  hits=$(grep -rln "RejectionReasonRequired\|REJECTION_REASON_MIN_LENGTH" apps/backend/src/modules/${domain}/ --include="*.spec.ts" 2>/dev/null | wc -l)
  [ "$hits" -ge 1 ] && echo "$domain: PASS ($hits spec files)" || echo "$domain: FAIL"
done
```
**Expected**: 7 PASS lines

### M-13. 매직 넘버 0건 (REJECTION_REASON_MIN_LENGTH SSOT 강제)

```bash
# 변경된 7 도메인 코드에서 < 10 / >= 10 / .min(10) 매직 넘버 0건
grep -rnE "\.min\(10\)|< 10[^0-9]|>= 10[^0-9]" \
  apps/backend/src/modules/equipment-imports \
  apps/backend/src/modules/calibration \
  apps/backend/src/modules/calibration-factors \
  apps/backend/src/modules/software-validations \
  apps/backend/src/modules/intermediate-inspections \
  apps/backend/src/modules/self-inspections \
  apps/backend/src/modules/non-conformances \
  apps/frontend/components/equipment-imports \
  apps/frontend/components/equipment/Calibration*.tsx \
  apps/frontend/components/equipment/IntermediateInspection*.tsx \
  apps/frontend/components/inspections/SelfInspection*.tsx \
  apps/frontend/components/non-conformances \
  apps/frontend/app/\(dashboard\)/software \
  --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "VALIDATION_RULES\|REJECTION_REASON_MIN_LENGTH\|\.spec\.\|__tests__" | wc -l
```
**Expected**: 0

### M-14. verify-zod Step 15 + Step 16 PASS

```bash
# Step 15 명령 #2 — reject DTO만 좁혀서 검증 (rejectionReason 필드 .min(1) 잔존 0건)
# 정정: 'reason'/'cause'는 update DTO 등에서 .min(1)로 정상 사용되므로 reject DTO만 점검
grep -rnE "rejectionReason:\s*z\.string\(\)" \
  apps/backend/src/modules/equipment-imports \
  apps/backend/src/modules/calibration \
  apps/backend/src/modules/calibration-factors \
  apps/backend/src/modules/software-validations \
  apps/backend/src/modules/intermediate-inspections \
  apps/backend/src/modules/self-inspections \
  apps/backend/src/modules/non-conformances \
  --include="*.dto.ts" 2>/dev/null \
  | grep -E "\.min\(1[,)]" | grep -v "REJECTION_REASON_MIN_LENGTH" | wc -l
```
**Expected**: 0

### M-15. RejectModal description은 string prop (D7)

```bash
# RejectModal 내부에 useTranslations 호출(namespace 사용)이 1개만 — 'approvals' 단일 namespace
# 코드 실 호출만 카운트 (JSDoc comment 제외)
ns_calls=$(grep -E "^\s*const\s+\w+\s*=\s*useTranslations\(" apps/frontend/components/approvals/RejectModal.tsx | wc -l)
[ "$ns_calls" = "1" ] && echo "PASS" || echo "FAIL ($ns_calls namespaces)"
```
**Expected**: PASS (namespace 호출 1개 — `useTranslations('approvals')`만 잔존)

---

## SHOULD 기준 (loop-non-blocking — 실패 시 tech-debt-tracker 기록)

### S-1. Frontend mapper unit test (각 ≥3 케이스)

```bash
ls apps/frontend/lib/errors/__tests__/*.test.ts 2>/dev/null | wc -l
```
**Expected**: ≥ 7 spec files (각 mapper별)

### S-2. analytics.track — reject 제출 telemetry

```bash
grep -c "track\|ANALYTICS_EVENTS.*REJECT" apps/frontend/components/approvals/RejectModal.tsx
```
**Expected**: ≥ 1 (예: `track('reject.submit', { domain })`)

### S-3. Playwright e2e 스모크

기존 nc-detail.spec.ts / self-inspection.spec.ts 등 reject 흐름이 있다면 RejectModal 통합 후 무회귀 확인.

### S-4. NC errors namespace 기존 키 보존

```bash
git diff HEAD~5 -- apps/frontend/messages/ko/non-conformances.json apps/frontend/messages/en/non-conformances.json \
  | grep "^-" | grep -v "^---" | grep "errors\." | wc -l
```
**Expected**: 0 (기존 키 삭제 0건)

### S-5. RejectModal description prop 강결합 회피

`description` prop은 호출자가 t() 결과 string을 주입. RejectModal 내부에 `useTranslations('<domain>')` 추가 결합 0건. (M-15와 동일 — SHOULD 중복 검증)

### S-6. verify-zod SKILL Step 16 baseline 갱신

```bash
grep -A2 "본 sprint\|tier-2-rejectmodal" .claude/skills/verify-zod/SKILL.md | wc -l
```
**Expected**: ≥ 1 (sprint 완료 후 baseline 갱신 메모)

### S-7. tech-debt-tracker 항목 closure 등록

본 sprint 완료 시 `tech-debt-tracker.md`의 `tier-2-rejectmodal-ssot-integration` 항목이 완료 마킹되고 7 도메인 페어링 항목들이 closure.

### S-8. 5-layer defense-in-depth 의미적 완결성

review-architecture로 다음 4 레이어가 7 도메인 모두 일관되게 적용됐는지 정성 검토:
1. Zod schema (`packages/schemas` 또는 backend dto)
2. Service-layer fail-close
3. ErrorCode enum
4. Frontend mapper

(Layer 5 GlobalExceptionFilter는 자동 — ErrorCode 사용 시 무조건 통과)

---

## Out of Scope (명시적 제외)

- approve 메서드 ErrorCode 격상 (별도 sprint)
- equipment / checkout / disposal / calibration-plan reject 메서드 (이미 격상 또는 별도 sprint)
- RejectModal `extraFields` slot (D2 deferred — 향후 NC `actionRequired` 등 등장 시)
- audit-log-fail-close-integration (별도 sprint)
- e2e-error-code-integration-spec (별도 sprint)
- mapper barrel (`lib/errors/index.ts`) 도입 (D4 거부)
- Backend Korean 메시지 i18n 격상 (별도 sprint — backend-zod-error-message-i18n-adr)
- analytics.track 외부 telemetry listener 통합 (별도 sprint)

---

## 적용 verify 스킬

- **verify-zod** (Step 12, 15, 16) — 신규 7 reject DTO 격상 검증
- **verify-ssot** (Rule 0) — RejectModal SSOT + ErrorCode SSOT
- **verify-hardcoding** (Step 32) — 매직 넘버 0건
- **verify-i18n** — ko/en parity (`errors.rejectionReasonRequired`)
- **review-architecture** — 5-layer defense-in-depth 의미적 일관성 (SHOULD S-8)

---

## Architectural Decisions Locked

| ID | 결정 | 근거 |
|----|------|------|
| **D1** | RejectModal에 `mode='domain'` 추가 (Option C). single/bulk 무변경 | 7 도메인 자체 i18n 보유, ApprovalItem 강제는 인공 결합 |
| **D2** | reason-only 유지 (extra fields deferred) | 7 사이트 reason-only 확인. YAGNI |
| **D3** | Flat enum + `<Domain>RejectionReasonRequired` 접두사 (7개 추가) | 기존 disposal/calibration-plan 패턴 유지, grep 친화적 |
| **D4** | Per-domain mapper. 기존 3 확장 + 신규 4~5. barrel 거부 | 명확한 ownership, 의존성 명시 |
| **D5** | equipment-imports → calibration → cal-factors → software-validations → intermediate-inspections → self-inspections → non-conformances | 단순 → 복잡 |
| **D6** | Phase 0/1A~1F backend foundation 완료 후 Phase 2 frontend 통합. Phase 3D 종료 시점 의무 점검 | 회귀 조기 차단 |
| **D7** | RejectModal `description` prop은 t() 결과 string 직접 주입. 내부 i18n namespace 추가 0건 | 호출자 책임, 결합 최소화 |

---

## 종료 조건

- M-1 ~ M-15 전체 PASS → 성공 (Step 7 진입)
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — `tech-debt-tracker.md`에 등록
