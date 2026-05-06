# 2026-05-06 Calibration Certificate Phase A — Closure (Mode 2, atomic)

> Slug: `calibration-cert-phase-a-closure` · Mode: 2 · Sprint: atomic single commit
> Phase A 잔존 갭(controller/ErrorCode/SSOT/i18n/e2e/Dockerfile) 시스템 전반 closure.

## Goal

frontend(api/hook/adapter/component/helper/test) + service(parser) + 단위/통합 test는 이미 main에 commit돼 있음 (`4db16e88`, `e36c10b1`, `c5e3a39f`, `2d4fdce9`). 다음 gap 8건을 atomic single commit으로 닫는다 — endpoint가 실제 동작하고 5-layer ErrorCode 정합성 + 9-layer 보안을 갖추도록.

## Discovery (직접 grep/read 검증 evidence)

### F.1 Backend service (`certificate-extractor.service.ts`)
- `BadRequestException(message: string)` generic 패턴 4곳 (line 45/96/106/154)
- `runPdfToText` `execFileAsync`에 **timeout 옵션 누락** → Phase 3에서 `timeout: 15_000` 추가
- `maxBuffer: 10 * 1024 * 1024` + `generateOpaqueId` 이미 적용

### F.2 Module 등록 (`calibration.module.ts`)
- `providers: [CalibrationService, CertificateExtractorService]` 등록됨
- `controllers: [CalibrationController]` — **신규 Controller 미등록**

### F.3 ErrorCode 등재 위치 (`packages/schemas/src/errors.ts`)
- Calibration 도메인 group: line 545~561
- `errorCodeToStatusCode`: line 953~960
- `CALIBRATION_ERROR_CODES` mirror: line 1118~1129

### F.4 CALIBRATIONS API endpoint (`api-endpoints.ts:161~185`)
- 신규 `EXTRACT_CERTIFICATE` 추가 위치: line 184 (DOCUMENTS 다음)

### F.5 i18n location
- ko/en `errors` namespace: ko line 983 / en line 1047
- 기존 11~12 key (parity 잡혀 있음)

### F.6 Frontend mapper (`calibration-errors.ts`)
- `CALIBRATION_ERROR_I18N_KEY: Record<CalibrationErrorCode, string>` (line 24~36) — completeness 자동 강제

### F.7 Backend e2e infra
- `jest-e2e.json` testRegex `.e2e-spec.ts$`
- `helpers/test-app.ts` `createTestApp/closeTestApp`
- `helpers/test-auth.ts` `loginAs(app, 'user')`
- AppModule import → CalibrationModule 자동 포함 (Phase 5 등록 후)

### F.8 Dockerfile
- bullseye base/builder + alpine production 모두 **poppler-utils 누락** — production deploy 시 `pdftotext` ENOENT → 500

## Phase Execution Plan (atomic — 모두 하나의 commit)

### Phase 1: ErrorCode SSOT 3건 (`packages/schemas/src/errors.ts`)
- `CalibrationCertificateFormatUnsupported = 'CALIBRATION_CERTIFICATE_FORMAT_UNSUPPORTED'`
- `CalibrationCertificateExtractionFailed = 'CALIBRATION_CERTIFICATE_EXTRACTION_FAILED'`
- `CalibrationCertificateFieldMissing = 'CALIBRATION_CERTIFICATE_FIELD_MISSING'`
- status mapping: 400 / 422 / 422
- `CALIBRATION_ERROR_CODES` mirror 3건

### Phase 2: API endpoint SSOT (`packages/shared-constants/src/api-endpoints.ts`)
- `EXTRACT_CERTIFICATE: '/api/calibration/certificates/extract'` (CALIBRATIONS 그룹 line 184)

### Phase 3: Backend service ErrorCode 적용 (`certificate-extractor.service.ts`)
- 4곳의 `BadRequestException(string)` → `BadRequestException({ code, message, details? })` 패턴
- field missing은 `details: { field: fieldLabel }` 추가
- `execFileAsync` 옵션에 `timeout: 15_000` 추가

### Phase 4: Backend Controller 신설 (`calibration-certificate.controller.ts`)
9-layer 보안:
| Layer | 구현 |
|---|---|
| mime whitelist | `FileInterceptor.fileFilter` — `REPORT_EXPORT_MIME.pdf` 만 |
| magic byte | controller inline `MIME_TO_MAGIC_BYTES.get(...)` 검증 |
| file size | `FileInterceptor.limits.fileSize: FILE_UPLOAD_LIMITS.MAX_FILE_SIZE` |
| pdftotext timeout | service Phase 3 |
| maxBuffer | service 기존 |
| temp path | service 기존 (`generateOpaqueId`) |
| permission | `@RequirePermissions(Permission.CREATE_CALIBRATION)` |
| rate limit | `@Throttle(throttleAllNamed(THROTTLE_PRESETS.UPLOAD))` |
| audit log | `@AuditLog({ action: 'extract', entityType: 'calibration_certificate' })` |

`@Controller('calibration/certificates')` + `@Post('extract')` → `/api/calibration/certificates/extract` (global prefix `/api`).

### Phase 5: Module 등록 (`calibration.module.ts`)
- `import { CalibrationCertificateController }` 추가
- `controllers: [CalibrationController, CalibrationCertificateController]`

### Phase 6: Frontend mapper + i18n parity (`calibration-errors.ts` + ko/en json)
- `CALIBRATION_ERROR_I18N_KEY` 3 entry
- ko/en messages 3 key 각 (ICU `{field}` 변수 보존)

### Phase 7: Frontend api SSOT 정정 (`calibration-certificate-api.ts`)
- file-local `EXTRACT_CERTIFICATE_PATH` → `API_ENDPOINTS.CALIBRATIONS.EXTRACT_CERTIFICATE`
- TODO 주석 제거

### Phase 8: Backend e2e spec (`apps/backend/test/calibration-certificate.e2e-spec.ts`)
test matrix:
1. unauthenticated → 401
2. mime mismatch → 400 + `InvalidFileType`
3. magic byte mismatch → 400 + `FileContentMismatch`
4. empty file → 400 + `FileEmpty`
5. happy path (env-gated, 실제 HCT PDF) → 200 + ExtractedCalibrationCertificate
6. non-HCT PDF → 400 + `CalibrationCertificateFormatUnsupported`

bootstrap: `createTestApp` + `loginAs(ctx.app, 'user')`.

### Phase 9: Dockerfile poppler-utils
- bullseye: `RUN apt-get update && apt-get install -y --no-install-recommends poppler-utils && rm -rf /var/lib/apt/lists/*`
- alpine: `RUN apk add --no-cache wget tini poppler-utils`

### Phase 10: 검증 + 후처리
1. schemas + shared-constants build
2. backend tsc
3. frontend tsc (sprint scope)
4. backend jest calibration module 회귀
5. frontend jest helper + component
6. integration test (env-gated)
7. e2e spec
8. tech-debt-tracker mark
9. atomic commit
10. push (pre-push hook 검증)

## Touch Inventory (atomic commit boundary)

| File | Action | LOC delta |
|---|---|---|
| `packages/schemas/src/errors.ts` | edit (+9) | +9 |
| `packages/shared-constants/src/api-endpoints.ts` | edit (+2) | +2 |
| `apps/backend/src/modules/calibration/services/certificate-extractor.service.ts` | edit (~5) | ~5 |
| `apps/backend/src/modules/calibration/calibration-certificate.controller.ts` | new | +~110 |
| `apps/backend/src/modules/calibration/calibration.module.ts` | edit (+2) | +2 |
| `apps/frontend/lib/errors/calibration-errors.ts` | edit (+3) | +3 |
| `apps/frontend/messages/ko/calibration.json` | edit (+3) | +3 |
| `apps/frontend/messages/en/calibration.json` | edit (+3) | +3 |
| `apps/frontend/lib/api/calibration-certificate-api.ts` | edit (~6) | ~6 |
| `apps/backend/test/calibration-certificate.e2e-spec.ts` | new | +~150 |
| `apps/backend/docker/Dockerfile` | edit (+2) | +2 |
| `.claude/exec-plans/tech-debt-tracker.md` | edit (line 109 mark) | +1 |

**Total**: 12 files (3 new, 9 edit). cross-domain 침범 0건.

## Rollback
atomic commit이므로 단순 `git revert <sha>`. controller 등록 해제 시 endpoint 즉시 비활성화 (frontend api는 404 fallback → toast `errors.unknown`).

## 시니어 자기검토 7대 영역
1. L0 inferred — F.1~F.8 evidence 명시
2. L4 external — 외부 의존: poppler-utils system binary
3. 관측성 — `@AuditLog` SSOT + `Logger` 기존 유지
4. 테스트 매트릭스 — 6 e2e + 11 단위 + 3 integration + 14 frontend RTL
5. CAS 영향 — 0 (DB write 없음)
6. 의존성 검증 명령 — Phase 10 명시
7. WCAG SC — i18n parity로 ko/en 동일 의미
