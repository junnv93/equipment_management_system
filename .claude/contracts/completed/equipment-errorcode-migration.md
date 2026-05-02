# Contract: Equipment ErrorCode SSOT Migration + E2E Integration Spec

Slug: equipment-errorcode-migration
Date: 2026-05-02
Plan: .claude/exec-plans/active/2026-05-02-equipment-errorcode-migration.md
Status: Active

---

## MUST (FAIL 처리 기준)

- [ ] `tsc --noEmit` PASS — packages/schemas, apps/backend, apps/frontend 세 tsconfig 모두
- [ ] backend E2E 전체 PASS
  ```bash
  pnpm --filter backend run test:e2e -- --runInBand
  ```
- [ ] inline code 0건 — 아래 grep 결과가 빈 출력
  ```bash
  grep -rn "code: '[A-Z_]\+'" \
    apps/backend/src/modules/equipment/equipment.service.ts \
    apps/backend/src/modules/equipment/services/equipment-approval.service.ts \
    apps/backend/src/modules/equipment/services/equipment-history.service.ts \
    apps/backend/src/modules/equipment/services/repair-history.service.ts \
    apps/backend/src/modules/equipment/services/equipment-attachment.service.ts
  ```
- [ ] `mapBackendErrorCode`에 신규 28개 ErrorCode 값 매핑 추가 (UNKNOWN_ERROR fallback 없음)
- [ ] E2E spec `equipment-errorcode-integration.e2e-spec.ts`가 실제 API 호출로 HTTP status code 검증
- [ ] `errorCodeToStatusCode` Record에 신규 enum 멤버 전원 포함 (누락 시 tsc 자동 FAIL)
- [ ] 기존 `manager-role-constraint.e2e-spec.ts` 테스트 GREEN 유지

## SHOULD (WARN 처리 기준)

- [ ] E2E spec의 각 `it` 블록이 `response.body.code` 검증 포함
- [ ] `mapBackendErrorCode` mappings 객체 내 코드가 도메인별 그룹 정렬 유지
- [ ] 신규 ErrorCode enum 멤버에 한국어 JSDoc 섹션 주석 포함

## 범위 외 (Out of Scope)

- `apps/frontend/messages/{ko,en}/equipment.json` — 수정 금지
- `apps/frontend/components/inspections/*` — 수정 금지
- `apps/backend/src/modules/inspection-form-templates/*` — 수정 금지
- `apps/frontend/lib/utils/calibration-status.ts` — 수정 금지
- `apps/backend/src/modules/equipment/services/disposal.service.ts` — 이미 격상 완료, 수정 금지
- i18n 번역 키 추가 — 이 계약 범위 밖

## 검증 명령 (verify-zod Step 16 기준)

```bash
# Step 16 명령 4: equipment 모듈 inline 0건 목표 (major improvement)
grep -rn "code: '[A-Z_]\+'" \
  apps/backend/src/modules/equipment/equipment.service.ts \
  apps/backend/src/modules/equipment/services/equipment-approval.service.ts \
  apps/backend/src/modules/equipment/services/equipment-history.service.ts \
  apps/backend/src/modules/equipment/services/repair-history.service.ts \
  apps/backend/src/modules/equipment/services/equipment-attachment.service.ts
# 0 hits = PASS
```
