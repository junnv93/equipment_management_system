# Tier-2 RejectModal SSOT Integration — 7 도메인 통합 + 5-Layer Defense-in-Depth 격상

## 메타
- 생성: 2026-05-02
- 모드: Mode 2 (Full Harness)
- 예상 변경: ~40개 파일
- 선행 sprint:
  - `disposal-zod-defense-in-depth` (2026-05-01)
  - `disposal-service-fail-close` (2026-05-02)
  - `error-codes-ssot-system-wide` (2026-05-02)

## 설계 철학

disposal/calibration-plan 2개 도메인에서 검증된 5-layer defense-in-depth 패턴(Zod / Service fail-close / ErrorCode enum / GlobalExceptionFilter / Frontend mapper)을 7개 reject 호출처에 일괄 적용하면서, 동시에 frontend의 자체 dialog 7개를 RejectModal SSOT(`apps/frontend/components/approvals/RejectModal.tsx`)로 흡수해 검증 SSOT(`RejectReasonSchema`)·UI 토큰(`getApprovalActionButtonClasses`)·a11y(`role="alert"`)·i18n 패턴을 단일 진입점으로 통합한다.

---

## 사실 확인 (Phase 0 사전 디스커버리 결과)

### 7 frontend 호출처 정확 경로
| 도메인 | 파일 | 비고 |
|--------|------|------|
| equipment-imports | `apps/frontend/components/equipment-imports/EquipmentImportDetail.tsx` | 11 reject hits |
| calibration | `apps/frontend/components/equipment/CalibrationApprovalActions.tsx` | (components/equipment/ 하위) |
| calibration-factors | `apps/frontend/components/equipment/CalibrationFactorsApprovalActions.tsx` (Phase 0에서 최종 확정) | TBD |
| software-validations | `apps/frontend/app/(dashboard)/software/[id]/validation/_components/ValidationRejectDialog.tsx` | 별도 파일 |
| intermediate-inspections | `apps/frontend/components/equipment/IntermediateInspectionList.tsx` | (components/equipment/ 하위) |
| self-inspections | `apps/frontend/components/inspections/SelfInspectionFormDialog.tsx` | reject 분기 embedded |
| non-conformances | `apps/frontend/components/non-conformances/NCDetailClient.tsx` | 15 reject hits, 가장 복잡 |

### 7 backend reject service 메서드
| 도메인 | 파일:라인 | 메서드 |
|--------|----------|--------|
| equipment-imports | `equipment-imports.service.ts:369` | `reject()` |
| calibration | `calibration.service.ts:1621` | `rejectCalibration()` |
| calibration-factors | `calibration-factors.service.ts:454` | `reject()` |
| software-validations | `software-validations.service.ts:508` | `reject()` |
| intermediate-inspections | `intermediate-inspections.service.ts:576` | `reject()` |
| self-inspections | `self-inspections.service.ts:513` | `reject()` |
| non-conformances | `non-conformances.service.ts:846` | `rejectCorrection()` |

### Frontend mapper 현황 (apps/frontend/lib/errors/)
- **기존 (5)**: `calibration-errors.ts` / `calibration-plan-errors.ts` / `disposal-errors.ts` / `equipment-errors.ts` / `software-validation-errors.ts`
- **확장 필요 (3)**: `calibration-errors.ts`, `software-validation-errors.ts`, `equipment-errors.ts` (equipment-imports용 대체 또는 확장 결정 Phase 1B)
- **신규 (4~5)**: `equipment-import-errors.ts`, `calibration-factor-errors.ts`, `intermediate-inspection-errors.ts`, `self-inspection-errors.ts`, `non-conformance-errors.ts`

### SSOT 위치
- `packages/shared-constants/src/validation-rules.ts:18` — `REJECTION_REASON_MIN_LENGTH: 10`
- `packages/schemas/src/errors.ts` — ErrorCode enum (현재 78 entries, RejectionReason 관련 2개)

---

## 아키텍처 결정

| ID | 결정 | 근거 |
|----|------|------|
| **D1** | RejectModal에 `mode='domain'` 추가 (descriptionKey/descriptionParams/titleKey/submitKey props). single/bulk 무변경 | 7 도메인 자체 i18n 보유, ApprovalItem 강제는 인공 결합 |
| **D2** | reason-only 유지 (extra fields deferred) | 7 사이트 모두 reason-only 확인. YAGNI 회피 |
| **D3** | Flat enum + `<Domain>RejectionReasonRequired` 접두사 | 기존 disposal/calibration-plan 패턴 유지, grep 친화적 |
| **D4** | Per-domain mapper. 기존 3개 확장 + 신규 4~5개. barrel 도입 거부 | 명확한 ownership |
| **D5** | 마이그레이션 순서: equipment-imports → calibration → cal-factors → software-validations → intermediate-inspections → self-inspections → non-conformances | 단순 → 복잡 |
| **D6** | Phase 0/1A/1B/1C까지 backend foundation 완료 후 Phase 2 frontend 통합. 단계 간 tsc/test 의무 | 회귀 조기 차단 |
| **D7** | RejectModal `description` prop은 t() 처리된 string 직접 주입 (호출자 책임). RejectModal 내부 i18n namespace 추가 0건 | i18n 결합 최소화, 호환성 우선 |

---

## 구현 Phase

### Phase 0: Pre-flight 디스커버리 + 정확 경로 확정 (15분)

**목표**: calibration-factors 정확 reject dialog 파일 1건 확정 + 각 도메인 mutation hook 위치 매핑.

**작업** (코드 변경 없음):
```bash
# calibration-factors reject dialog 확정
grep -rln "reject\|반려" apps/frontend/components/equipment 2>/dev/null \
  | xargs grep -l "CalibrationFactor" 2>/dev/null

# 각 도메인 mutation hook 위치
grep -rln "useReject\|reject.*mutation\|useMutation.*reject" \
  apps/frontend/lib/api apps/frontend/hooks 2>/dev/null

# 7 backend dto의 reject 관련 schema 위치 확정 (각 도메인의 dto/ 디렉토리)
for d in equipment-imports calibration calibration-factors software-validations intermediate-inspections self-inspections non-conformances; do
  grep -rln "rejectionReason\|reject.*reason\|reject.*comment" apps/backend/src/modules/$d --include="*.dto.ts" 2>/dev/null
done
```

**산출물**: 디스커버리 결과를 본 plan에 inline 메모로 추가 (그 이상 코드 변경 없음).

**검증**: 모든 도메인의 reject DTO 파일 위치 확정 및 본 plan의 [사실 확인] 섹션 갱신.

---

### Phase 1A: ErrorCode enum SSOT 7개 추가 (15분)

**목표**: `packages/schemas/src/errors.ts`에 7개 ErrorCode 등록 + `errorCodeToStatusCode` 매핑.

**변경 파일**:
1. `packages/schemas/src/errors.ts`
   - 추가 ErrorCode (7개):
     - `EquipmentImportRejectionReasonRequired = 'EQUIPMENT_IMPORT_REJECTION_REASON_REQUIRED'`
     - `CalibrationRejectionReasonRequired = 'CALIBRATION_REJECTION_REASON_REQUIRED'`
     - `CalibrationFactorRejectionReasonRequired = 'CALIBRATION_FACTOR_REJECTION_REASON_REQUIRED'`
     - `SoftwareValidationRejectionReasonRequired = 'SOFTWARE_VALIDATION_REJECTION_REASON_REQUIRED'`
     - `IntermediateInspectionRejectionReasonRequired = 'INTERMEDIATE_INSPECTION_REJECTION_REASON_REQUIRED'`
     - `SelfInspectionRejectionReasonRequired = 'SELF_INSPECTION_REJECTION_REASON_REQUIRED'`
     - `NonConformanceRejectionReasonRequired = 'NON_CONFORMANCE_REJECTION_REASON_REQUIRED'`
   - `errorCodeToStatusCode` 매핑 7개 추가 (모두 status 400)

**검증**:
```bash
pnpm tsc --noEmit  # Record<ErrorCode, number> 강제 — 누락 시 컴파일 에러
grep -c "RejectionReasonRequired" packages/schemas/src/errors.ts
# Expected: ≥ 18 (enum value 9 + status mapping 9 = 18; 기존 disposal `DisposalRejectCommentRequired` 포함)
```

---

### Phase 1B: i18n errors namespace 신설/확장 (45분)

**목표**: 7개 도메인 messages JSON에 `errors.rejectionReasonRequired` 키를 ko/en 동시 추가 (parity 강제).

**변경 파일** (ko + en × 7 = 14개):
1. `apps/frontend/messages/ko/equipment-imports.json` — `errors.rejectionReasonRequired: "반려 사유는 {min}자 이상 입력해주세요."`
2. `apps/frontend/messages/en/equipment-imports.json` — `"errors.rejectionReasonRequired": "Rejection reason must be at least {min} characters."`
3-14. 동일 패턴: `calibration.json`, `calibration-factors.json`, `software-validations.json`, `intermediate-inspections.json`, `self-inspections.json`, `non-conformances.json`

**참고**: 일부 도메인은 이미 errors namespace 보유 (`non-conformances.json` errors 등). 그 경우 `rejectionReasonRequired` 키만 추가 (기존 키 보존, 덮어쓰기 금지).

**검증**:
```bash
for domain in equipment-imports calibration calibration-factors software-validations intermediate-inspections self-inspections non-conformances; do
  ko=$(grep -c "rejectionReasonRequired" "apps/frontend/messages/ko/${domain}.json" 2>/dev/null || echo 0)
  en=$(grep -c "rejectionReasonRequired" "apps/frontend/messages/en/${domain}.json" 2>/dev/null || echo 0)
  [ "$ko" -ge 1 ] && [ "$en" -ge 1 ] && echo "$domain: PASS" || echo "$domain: FAIL (ko=$ko en=$en)"
done
# Expected: 7 PASS lines
```

---

### Phase 1C: Frontend mapper SSOT 4~5개 신규 + 3개 확장 (60분)

**목표**: 도메인별 ErrorCode → i18n key 매퍼를 disposal-errors.ts 패턴 그대로 신설/확장.

**변경 파일**:

**기존 확장 (3)**:
- `apps/frontend/lib/errors/calibration-errors.ts` — `CalibrationRejectionReasonRequired` 매핑 추가, `mapCalibrationErrorToToast`에 ErrorCode 케이스 추가
- `apps/frontend/lib/errors/software-validation-errors.ts` — `SoftwareValidationRejectionReasonRequired` 매핑 추가
- `apps/frontend/lib/errors/equipment-errors.ts` — equipment-imports용 매핑 별도 파일로 분리 결정 시 본 파일은 무변경

**신규 생성 (4)** (equipment-imports를 별도 파일로):
- `apps/frontend/lib/errors/equipment-import-errors.ts`
- `apps/frontend/lib/errors/calibration-factor-errors.ts`
- `apps/frontend/lib/errors/intermediate-inspection-errors.ts`
- `apps/frontend/lib/errors/self-inspection-errors.ts`
- `apps/frontend/lib/errors/non-conformance-errors.ts`

각 mapper 구조 (disposal-errors.ts 패턴):
```typescript
import { ErrorCode } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { extractErrorCode } from './disposal-errors';

const ERROR_CODE_TO_KEY: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.<Domain>RejectionReasonRequired]: 'errors.rejectionReasonRequired',
};

const ERROR_CODE_TO_PARAMS: Partial<Record<ErrorCode, Record<string, unknown>>> = {
  [ErrorCode.<Domain>RejectionReasonRequired]: {
    min: VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH,
  },
};

export function map<Domain>ErrorToToast(
  error: unknown,
  t: (key: string, params?: Record<string, unknown>) => string,
): { title: string; description: string } { /* ... */ }
```

**검증**:
```bash
ls apps/frontend/lib/errors/*-errors.ts | grep -v "__tests__" | wc -l
# Expected: ≥ 9 (5 기존 + 4 신규 - 단, equipment-errors.ts와 equipment-import-errors.ts 분리)
pnpm tsc --noEmit  # 0 errors
```

---

### Phase 1D: Backend Zod 7개 reject DTO 5-layer 격상 (60분)

**목표**: 7 도메인의 reject 관련 DTO Zod schema에 `.trim().min(VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH).max(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)` 적용.

**변경 파일** (도메인별 reject DTO 파일은 Phase 0 디스커버리에서 확정):
1. `apps/backend/src/modules/equipment-imports/dto/<reject>.dto.ts`
2. `apps/backend/src/modules/calibration/dto/reject-calibration.dto.ts` (또는 inline schema)
3. `apps/backend/src/modules/calibration-factors/dto/reject-calibration-factor.dto.ts` (또는 동등)
4. `apps/backend/src/modules/software-validations/dto/reject-validation.dto.ts` (또는 동등)
5. `apps/backend/src/modules/intermediate-inspections/dto/reject-inspection.dto.ts` (또는 동등)
6. `apps/backend/src/modules/self-inspections/dto/reject-self-inspection.dto.ts` (또는 동등)
7. `apps/backend/src/modules/non-conformances/dto/reject-correction.dto.ts` (또는 update-non-conformance.dto.ts inline)

**Schema 패턴**:
```typescript
rejectionReason: z
  .string()
  .trim()
  .min(VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH)
  .max(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH),
```

**검증**:
```bash
for domain in equipment-imports calibration calibration-factors software-validations intermediate-inspections self-inspections non-conformances; do
  hits=$(grep -rn "REJECTION_REASON_MIN_LENGTH" apps/backend/src/modules/${domain}/ --include="*.dto.ts" 2>/dev/null | wc -l)
  [ "$hits" -ge 1 ] && echo "$domain: PASS ($hits)" || echo "$domain: FAIL"
done
# Expected: 7 PASS lines
pnpm --filter backend run build  # exit 0
```

---

### Phase 1E: Backend service 7개 reject fail-close + ErrorCode 격상 (75분)

**목표**: 각 reject 메서드에 fail-close 분기 추가 + 인라인 string code → ErrorCode enum 사용.

**변경 파일**:
1. `apps/backend/src/modules/equipment-imports/equipment-imports.service.ts` — `reject()` line 369: `if (rejectionReason.trim().length < REJECTION_REASON_MIN_LENGTH) throw new BadRequestException({ code: ErrorCode.EquipmentImportRejectionReasonRequired, ... })`
2. `apps/backend/src/modules/calibration/calibration.service.ts` — `rejectCalibration()` line 1621: 동
3. `apps/backend/src/modules/calibration-factors/calibration-factors.service.ts` — `reject()` line 454: 동
4. `apps/backend/src/modules/software-validations/software-validations.service.ts` — `reject()` line 508: 동
5. `apps/backend/src/modules/intermediate-inspections/intermediate-inspections.service.ts` — `reject()` line 576: 동
6. `apps/backend/src/modules/self-inspections/self-inspections.service.ts` — `reject()` line 513: 동
7. `apps/backend/src/modules/non-conformances/non-conformances.service.ts` — `rejectCorrection()` line 846: 동

**검증**:
```bash
for code in EquipmentImportRejectionReasonRequired CalibrationRejectionReasonRequired CalibrationFactorRejectionReasonRequired SoftwareValidationRejectionReasonRequired IntermediateInspectionRejectionReasonRequired SelfInspectionRejectionReasonRequired NonConformanceRejectionReasonRequired; do
  hits=$(grep -rln "ErrorCode\.${code}" apps/backend/src/modules/ --include="*.service.ts" 2>/dev/null | wc -l)
  [ "$hits" -ge 1 ] && echo "$code: PASS" || echo "$code: FAIL"
done
# Expected: 7 PASS lines

pnpm --filter backend run build  # exit 0
pnpm tsc --noEmit  # exit 0
```

---

### Phase 1F: Backend service spec 보강 (75분)

**목표**: 각 도메인 service spec에 fail-close 분기 ≥3 케이스 추가 (빈 문자열 / 공백만 / N-1자).

**변경 파일** (도메인당 spec 1개씩, 신규 또는 확장):
1. `apps/backend/src/modules/equipment-imports/__tests__/equipment-imports.service.spec.ts` (또는 inline)
2. `apps/backend/src/modules/calibration/__tests__/calibration.service.spec.ts`
3. `apps/backend/src/modules/calibration-factors/__tests__/calibration-factors.service.spec.ts`
4. `apps/backend/src/modules/software-validations/__tests__/software-validations.service.spec.ts`
5. `apps/backend/src/modules/intermediate-inspections/__tests__/intermediate-inspections.service.spec.ts`
6. `apps/backend/src/modules/self-inspections/__tests__/self-inspections.service.spec.ts`
7. `apps/backend/src/modules/non-conformances/__tests__/non-conformances.service.spec.ts`

각 spec 추가 케이스:
- 빈 문자열 reject → `BadRequestException` with `code: ErrorCode.<Domain>RejectionReasonRequired`
- 공백만 (`'   '.repeat(20)`) reject → 동
- N-1자 (REJECTION_REASON_MIN_LENGTH 미만) reject → 동

**검증**:
```bash
pnpm --filter backend run test  # 모든 spec PASS
for domain in equipment-imports calibration calibration-factors software-validations intermediate-inspections self-inspections non-conformances; do
  spec=$(find apps/backend/src/modules/${domain}/ -name "*.service.spec.ts" 2>/dev/null | head -1)
  if [ -n "$spec" ]; then
    hits=$(grep -c "RejectionReasonRequired" "$spec")
    [ "$hits" -ge 1 ] && echo "$domain: PASS ($hits)" || echo "$domain: FAIL"
  fi
done
# Expected: 7 PASS lines
```

---

### Phase 2: RejectModal `mode='domain'` 확장 (45분)

**목표**: 기존 discriminated union에 `'domain'` mode 추가. `'single'`/`'bulk'`는 무변경.

**변경 파일**:
1. `apps/frontend/components/approvals/RejectModal.tsx`

**API 시그니처 추가**:
```typescript
| {
    mode: 'domain';
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    title: string;            // 호출자가 t() 처리된 string 주입
    description: string;       // 호출자가 t() 처리된 string 주입
    submitLabel?: string;     // 기본값 fallback: title
    showTemplates?: boolean;  // 기본 false (도메인 reject은 quick-template 미사용)
  }
```

**구현 invariant**:
- `mode === 'domain'` 시 props.title, props.description 사용 (자체 useTranslations 호출 없음)
- 템플릿 셀렉트는 `showTemplates === true` 일 때만 노출 (도메인은 false 디폴트)
- `RejectReasonSchema`(SSOT) 그대로 사용 — 도메인별 min 차이 없음
- 기존 single/bulk 동작 무회귀

**검증**:
```bash
grep -c "mode === 'domain'\|mode: 'domain'" apps/frontend/components/approvals/RejectModal.tsx
# Expected: ≥ 2

grep -c "RejectReasonSchema" apps/frontend/components/approvals/RejectModal.tsx
# Expected: ≥ 1

# 기존 useTranslations namespace 무변경
grep "useTranslations" apps/frontend/components/approvals/RejectModal.tsx | wc -l
# Expected: 1 ('approvals' namespace만)

pnpm --filter frontend run test -- RejectModal  # 기존 single/bulk 무회귀
pnpm tsc --noEmit
```

---

### Phase 3A-3G: 7 도메인 frontend 통합 (각 30~60분, 총 ~5시간)

각 Phase 3X는 다음 4단계를 한 도메인에 적용:
1. 자체 Dialog inline 구현 제거
2. RejectModal `mode='domain'` 호출로 교체
3. mutation hook의 onError에서 mapper 사용
4. Smoke (build + 변경 도메인 spec 회귀 확인)

#### Phase 3A: equipment-imports (45분)

**변경 파일**:
1. `apps/frontend/components/equipment-imports/EquipmentImportDetail.tsx` — line 543~575 inline Dialog 제거, RejectModal 호출 (mode='domain', title/description은 t() 결과 string으로)
2. mutation hook 또는 api function — onError에서 `mapEquipmentImportErrorToToast(error, t)` 사용

**검증**:
```bash
grep -c "RejectModal" apps/frontend/components/equipment-imports/EquipmentImportDetail.tsx  # ≥ 1
pnpm tsc --noEmit
pnpm --filter frontend run test -- EquipmentImportDetail
```

#### Phase 3B: calibration (45분)

**변경 파일**: `apps/frontend/components/equipment/CalibrationApprovalActions.tsx`
**참고**: 이미 calibration mutation onError가 있으면 mapper만 swap.

#### Phase 3C: calibration-factors (45분)

**변경 파일**: Phase 0에서 확정한 reject dialog 파일 1개 + mutation hook.

#### Phase 3D: software-validations (45분)

**변경 파일**: `apps/frontend/app/(dashboard)/software/[id]/validation/_components/ValidationRejectDialog.tsx` — 별도 컴포넌트로 분리되어 있어서 RejectModal에 위임하는 thin wrapper로 정리하거나 호출자에서 직접 RejectModal 사용.

**복잡도**: 별도 컴포넌트 wrapper 유지 vs 직접 RejectModal 호출 — Generator는 호출처 변경 최소화 우선.

#### Phase 3E: intermediate-inspections (45분)

**변경 파일**: `apps/frontend/components/equipment/IntermediateInspectionList.tsx` — line ~263 inline Dialog 제거.

#### Phase 3F: self-inspections (60분 — embedded)

**변경 파일**: `apps/frontend/components/inspections/SelfInspectionFormDialog.tsx` — reject 분기가 form dialog 내부에 embedded. 분리 시 InspectionFormContext 영향 0건 확인 필수.

**복잡도**: form dialog에서 reject 분기 분리 → 별도 RejectModal 호출. 기존 form state는 영향 없음 (reject는 별도 흐름).

#### Phase 3G: non-conformances (75분 — 가장 복잡)

**변경 파일**: `apps/frontend/components/non-conformances/NCDetailClient.tsx` — line ~614 inline Dialog 제거, RejectModal 호출.

**복잡도**: NC reject는 cache invalidation + audit emit + scope 검증이 onSuccess/onError에 묶여 있음. mapper 도입 시 onError 경로만 변경, 다른 path 무회귀 필수.

**중간 점검** (Phase 3D 이후 의무):
```bash
pnpm tsc --noEmit
pnpm --filter backend run build
pnpm --filter backend run test
pnpm --filter frontend run build
```
실패 시 즉시 fix loop 진입, Phase 3E 진행 금지.

---

### Phase 4: 시스템 회귀 검증 + verify-zod SKILL 갱신 (30분)

**목표**: 시스템 전체 회귀 차단 + verify-zod Step 16의 baseline 갱신.

**변경 파일**:
1. `.claude/skills/verify-zod/SKILL.md` — Step 16의 도메인 카운트 expected 갱신 (7개 도메인 추가 후 인라인 0건이 되는지 확인)

**검증**:
```bash
# verify-zod Step 15 (frontend ≥10 하드코딩 0)
grep -rnE "(rejectionReason|opinion|comment|reason|cause)\.(trim\(\)\.)?length\s*[<>=]+\s*10" \
  apps/frontend/components apps/frontend/app --include="*.tsx" --include="*.ts" 2>/dev/null \
  | grep -v "VALIDATION_RULES\|\.next\|tests/" | wc -l
# Expected: 0

# verify-zod Step 16 (격상 도메인 인라인 0)
grep -rn "code: '[A-Z_]\+'" \
  apps/backend/src/modules/{equipment-imports,calibration,calibration-factors,software-validations,intermediate-inspections,self-inspections,non-conformances} \
  --include="*.ts" 2>/dev/null \
  | grep -v ".spec.ts\|__tests__" | wc -l
# Expected: 0

# 시스템 회귀
pnpm tsc --noEmit
pnpm --filter backend run build
pnpm --filter backend run test
pnpm --filter frontend run build
pnpm --filter frontend run test
# 모두 exit 0
```

---

## 전체 변경 파일 요약

### 신규 생성 (~5)
- `apps/frontend/lib/errors/equipment-import-errors.ts`
- `apps/frontend/lib/errors/calibration-factor-errors.ts`
- `apps/frontend/lib/errors/intermediate-inspection-errors.ts`
- `apps/frontend/lib/errors/self-inspection-errors.ts`
- `apps/frontend/lib/errors/non-conformance-errors.ts`

### 수정 (~35)
- `packages/schemas/src/errors.ts` (ErrorCode enum 7개)
- `apps/frontend/components/approvals/RejectModal.tsx` (mode='domain' 추가)
- 7 frontend 호출처 .tsx 파일
- 7 backend service.ts 파일
- 7 backend service spec 파일 (확장)
- 7 backend reject dto.ts 파일
- 14 i18n JSON (ko/en × 7)
- 3 기존 mapper 확장 (calibration-errors.ts, software-validation-errors.ts, equipment-errors.ts 또는 별도 파일 분리 시 0)
- `.claude/skills/verify-zod/SKILL.md` baseline 갱신

**Total**: 약 40~45개 파일

---

## 의사결정 로그

- **2026-05-02**: 단일 sprint로 진행 결정. 패턴이 기계적이고 disposal/calibration-plan 검증 완료. Phase 3D 종료 시점 의무 점검으로 회귀 조기 차단.
- **2026-05-02**: D1=Option C로 RejectModal `mode='domain'` 추가 — 기존 single/bulk 무변경 보장 + 도메인 i18n 격리 유지.
- **2026-05-02**: D7 추가 — RejectModal에 새 useTranslations namespace 추가 0건. 호출자가 t() 결과 string을 prop으로 전달하는 패턴으로 i18n 결합 최소화.
- **2026-05-02**: equipment-imports는 별도 mapper 파일 (`equipment-import-errors.ts`) 생성. equipment-errors.ts와 분리 — 도메인 경계 명확화.
- **2026-05-02**: 7 reject 메서드 정확 위치 확정 (위 [사실 확인] 표) — Phase 0 작업 90% 완료, Phase 0은 calibration-factors 1건만 디스커버리 필요.
