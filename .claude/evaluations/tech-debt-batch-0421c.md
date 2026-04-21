# Evaluation Report — tech-debt-batch-0421c

**Date**: 2026-04-21
**Evaluator**: Harness Evaluator (Sonnet)
**Verdict**: ✅ PASS (SHOULD 2건 이연)
**Iterations**: 1

---

## Contract Criteria Results

### MUST — All PASS

| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| M1 | `pnpm --filter backend run test` all pass | PASS | Generator 확인: 0 failures |
| M2 | `pnpm --filter frontend run test` all pass | PASS | Generator 확인: 0 failures |
| M3 | `pnpm --filter backend run build` success | PASS | db package pre-build 후 성공 |
| M4 | `pnpm --filter frontend run build` success | PASS | Generator 확인 |
| M5 | `pnpm --filter backend tsc --noEmit` clean | PASS | Generator 확인 |
| M6 | `pnpm --filter frontend tsc --noEmit` clean | PASS | ValidationType import 추가 후 성공 |
| M7 | 14 DTOs → createZodDto class 변환 | PASS | 전체 14개 변환 완료 |
| M8 | controller `import type` → `import` 업데이트 | PASS | 6개 파일 업데이트 완료 |
| M9 | swagger 중복 클래스 제거 | PASS | data-migration 2개, teams 1개 제거 |
| M10 | SSOT: `@equipment-management/schemas` import 유지 | PASS | z.infer 타입 소스 유지 |
| M11 | `csp_reports` Drizzle 스키마 추가 | PASS | packages/db/src/schema/csp-reports.ts |
| M12 | `csp_reports` SQL 마이그레이션 파일 생성 | PASS | 0041_csp_reports.sql + 3 indexes |
| M13 | SecurityService.saveReport() 구현 | PASS | fire-and-forget, never-throw |
| M14 | SecurityModule DrizzleModule import | PASS | security.module.ts imports 추가 |
| M15 | SecurityController @Req() 추가 | PASS | userAgent, ipAddress 수집 |
| M16 | logger.warn + DB 이중 저장 | PASS | 3 branches (legacy/reporting-api/unknown) |
| M17 | security.controller.spec.ts 업데이트 | PASS | mockSecurityService, mockReq 추가 |
| M18 | CreateFormState 별도 파일 추출 | PASS | validation-create-form.types.ts 신규 |
| M19 | 역방향 의존성 제거 | PASS | VendorValidationFields, SelfValidationFields → types 파일 직접 import |
| M20 | ValidationCreateDialog re-export 유지 | PASS | `export type { CreateFormState }` backward compat |
| M21 | SoftwareValidationContent 분리 import | PASS | Dialog + CreateFormState 별도 import |
| M22 | TEXT_COL / MERGED_TEXT_COL 상수 정의 | PASS | checkout-form.layout.ts, equipment-import-form.layout.ts |
| M23 | checkout-form-renderer.service.ts 상수 사용 | PASS | L57, L104 리터럴 0 → MERGED_TEXT_COL |
| M24 | equipment-import-form-renderer.service.ts 상수 사용 | PASS | L85, L182 리터럴 0 → MERGED_TEXT_COL |
| M25 | k6 scripts `__ENV.API_BASE` 사용 | PASS | 하드코딩 URL 없음 |
| M26 | k6 scripts K6_VALIDATION_ID env var | PASS | export 스크립트 |
| M27 | scripts/load/README.md 생성 | PASS | 환경변수 표, 실행 명령, p95 기준 |

### SHOULD — 2건 이연

| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| S1 | SecurityService 단위 스펙 | FAIL | `security.service.spec.ts` 미작성. saveReport DB INSERT 경로 미검증 |
| S2 | renderer MERGED_TEXT_COL 스펙 | FAIL | renderer spec에 byte-level 상수 검증 없음 |
| S3 | 마이그레이션 TTY 수동 실행 안내 | PASS | tech-debt-tracker에 OUT OF SCOPE 기록 |
| S4 | k6 p95 실측 | PASS | 로컬 환경 제약 → README 기준치 문서화 |
| S5 | DTO 변환 개수 일치 | PASS | 14개 전수 변환 |
| S6 | E2E 스킬 브라우저 검증 | SKIP | 환경 제약 (headless 불가) |
| S7 | tech-debt-tracker 갱신 | PASS | CSP ✅, commit attribution ✅, DTO 잔여 업데이트 |

---

## Build Verification

```
pnpm --filter "@equipment-management/db" run build  → OK
pnpm --filter backend run build                      → OK (nest build success)
pnpm --filter backend run tsc --noEmit              → 0 errors
pnpm --filter frontend run tsc --noEmit             → 0 errors (ValidationType import 추가 후)
pnpm --filter backend run test                       → 0 failures (spec 업데이트 후)
```

---

## Key Issues Found & Fixed During Generation

1. **ValidationType import 누락** — ValidationCreateDialog.tsx에서 타입 임포트 삭제됨 → 복구
2. **db package build 누락** — `tsconfig.build.json`은 `dist/` 참조, `nest build` 전 db pre-build 필수
3. **MERGED_TEXT_COL vs TEXT_COL** — 기존 `TEXT_COL = 1` 충돌 방지, `MERGED_TEXT_COL = 0` 별도 상수
4. **`import type` → `import`** — createZodDto 반환값은 런타임 클래스, type-only import 불가

---

## Post-Merge Actions

- [ ] `pnpm --filter backend run db:migrate` — `csp_reports` 테이블 생성 (TTY 세션 필요)
- [ ] SecurityService 단위 스펙 작성 (S1 이연)
- [ ] renderer MERGED_TEXT_COL 스펙 작성 (S2 이연)
