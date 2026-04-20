---
slug: tech-debt-0420-batch
date: 2026-04-20
iteration: 1
status: active
---

# Exec Plan: tech-debt-0420-batch

## Summary

5개 기술부채 동시 해소:
1. BE: CalibrationPlanSyncListener 이중 갱신 방지 (linkedPlanItemId 분기)
2. BE: CALIBRATION_UPDATED/CERTIFICATE_UPLOADED/REVISED 이벤트 발행 (registry SSOT 완결)
3. FE: ValidationDetailContent useCasGuardedMutation 전환
4. FE: VersionHistory staleTime STATIC 전략 적용
5. E2E: pre-existing 실패 13건 수정 (auth/checkouts)

**원칙**: 수술적 변경. 새 추상화 금지. SSOT(CACHE_EVENTS/REFETCH_STRATEGIES/useCasGuardedMutation) 최대 활용.

---

## Phase 1: BE — CalibrationPlanSyncListener 이중 갱신

### Files to modify

- `apps/backend/src/modules/calibration-plans/listeners/calibration-plan-sync.listener.ts`:
  - `handleCalibrationCreated` 진입부에 `if (payload.linkedPlanItemId)` 분기 추가
  - linkedPlanItemId 있으면 debug 로그 후 early-return (tx 내에서 이미 링크됨)
  - 기존 year-scope recordActualCalibrationDate는 linkedPlanItemId 없는 경로에서만 실행

---

## Phase 2: BE — CALIBRATION 이벤트 미발행 해소

### Files to modify

- `apps/backend/src/modules/calibration/calibration.service.ts`:
  - `update()` line 639 이후: `invalidateCalibrationCache` 호출 직후 `emitAsync(CACHE_EVENTS.CALIBRATION_UPDATED, payload)` 추가. try/catch + logger.warn으로 보호.
  - 신규 public 메서드 `recordCertificateDocuments(calibrationId, documentIds, actorId, isRevision)`: findOne + teamId 조립 → CALIBRATION_CERTIFICATE_UPLOADED or REVISED 분기 emit

- `apps/backend/src/modules/calibration/calibration.controller.ts`:
  - `uploadDocuments` (line 595~): `documentService.createDocuments` 전에 기존 certificate 조회 → isRevision 판정 → 성공 후 `calibrationService.recordCertificateDocuments` 호출

---

## Phase 3: FE — ValidationDetailContent + VersionHistory

### Files to modify

- `apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/ValidationDetailContent.tsx`:
  - Import: `useMutation` 제거, `useCasGuardedMutation` 추가, `isConflictError` import 제거
  - `updateMutation` 재작성: useCasGuardedMutation 사용
  - `handleUpdate`: `version: validation.version` 제거 (hook이 fetchCasVersion으로 주입)

- `apps/frontend/components/calibration-plans/VersionHistory.tsx`:
  - `REFETCH_STRATEGIES` import 추가
  - useQuery에 `...REFETCH_STRATEGIES.STATIC` spread

---

## Phase 4: E2E — 실패 수정

### Files to modify

- `apps/backend/src/modules/auth/auth.service.ts`:
  - `testPasswords`에 canonical emails 추가 (lab.manager, tech.manager, test.engineer)
  - `testUserDefaults`에도 동일 3개 키 추가

- `apps/backend/test/auth.e2e-spec.ts`:
  - LEGACY_LOGIN_USERS를 canonical emails로 교체
  - 예상 name/site/location을 seed DB 값으로 정정

- `apps/backend/test/checkouts.e2e-spec.ts`:
  - approve 3곳 + reject 1곳에 `version: 1` 추가
  - `approverId` 제거 (Rule 2 - 서버 추출)

---

## Verification Commands

```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
pnpm --filter backend run test
pnpm --filter backend run test:e2e -- --testPathPattern="auth.e2e-spec|checkouts.e2e-spec"
```
