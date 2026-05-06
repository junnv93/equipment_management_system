# Contract: Calibration Certificate Phase A — Closure

> Slug: `calibration-cert-phase-a-closure` · Mode: 2 · Generated: 2026-05-06
> Plan: `.claude/exec-plans/active/2026-05-06-calibration-cert-phase-a-closure.md`

## MUST (loop-blocking)

### M-1: Schemas + shared-constants build PASS
```bash
pnpm --filter @equipment-management/schemas run build
pnpm --filter @equipment-management/shared-constants run build
# expected: exit=0 양쪽
```
`Record<ErrorCode, number>` completeness가 신규 3건 자동 강제.

### M-2: Backend tsc PASS
```bash
pnpm --filter backend run type-check
# expected: exit=0
```

### M-3: Frontend tsc PASS (sprint scope)
```bash
pnpm --filter frontend run type-check
# 우리 sprint 영역(calibration-* 파일들) 0 errors
# 무관 dead test (use-checkout-group-aggregates 등)는 영역 외 — 회귀 0이면 PASS
```

### M-4: Calibration module jest 회귀 0건
```bash
pnpm --filter backend exec jest --testPathPattern="modules/calibration/" --silent
# expected: 모든 suites PASS — 11/11 unit + integration env-skip 또는 3/3
```

### M-5: Helper test 8/8 + Component test 6/6 PASS
```bash
pnpm --filter frontend exec jest --testPathPattern="(validate-certificate-file|CalibrationCertificatePdfUploader)"
# expected: 14/14 PASS
```

### M-6: Backend integration test 3/3 PASS (env-gated)
```bash
HCT_PDF_SAMPLE_DIR='/mnt/c/Users/kmjkd/Downloads' \
  pnpm --filter backend exec jest --testPathPattern="certificate-extractor.integration"
# expected: 3 PASS (E0149/E0409/E0205)
```

### M-7: Backend e2e spec 통과
```bash
pnpm --filter backend run test:e2e --testPathPattern=calibration-certificate
# expected: e2e suite PASS — 최소 5 test case
```

### M-8: ErrorCode 5-layer 정합

```bash
# Layer 2 — Service throw
grep -c "ErrorCode.CalibrationCertificate" \
  apps/backend/src/modules/calibration/services/certificate-extractor.service.ts
# expected: ≥ 4

# Layer 3 — ErrorCode enum
grep -c "CalibrationCertificateFormatUnsupported\|CalibrationCertificateExtractionFailed\|CalibrationCertificateFieldMissing" \
  packages/schemas/src/errors.ts
# expected: ≥ 9

# Layer 4 — errorCodeToStatusCode
grep -E "ErrorCode\.CalibrationCertificate(FormatUnsupported|ExtractionFailed|FieldMissing)\]:" \
  packages/schemas/src/errors.ts | wc -l
# expected: 3

# Layer 5 — Frontend mapper
grep -c "CERTIFICATE_FORMAT_UNSUPPORTED\|CERTIFICATE_EXTRACTION_FAILED\|CERTIFICATE_FIELD_MISSING" \
  apps/frontend/lib/errors/calibration-errors.ts
# expected: ≥ 3

# Layer 5b — i18n parity (ko/en)
for f in apps/frontend/messages/ko/calibration.json apps/frontend/messages/en/calibration.json; do
  for key in certificateFormatUnsupported certificateExtractionFailed certificateFieldMissing; do
    grep -c "\"${key}\"" "$f"  # ≥ 1 per (file × key) — total 6
  done
done

# Layer 5c — {field} 변수 보존
grep "certificateFieldMissing" apps/frontend/messages/ko/calibration.json | grep -o "{field}" | wc -l
grep "certificateFieldMissing" apps/frontend/messages/en/calibration.json | grep -o "{field}" | wc -l
# expected: 1 each
```

### M-9: 보안 9-layer + 하드코딩 0
```bash
ctrl="apps/backend/src/modules/calibration/calibration-certificate.controller.ts"
svc="apps/backend/src/modules/calibration/services/certificate-extractor.service.ts"

grep -c "REPORT_EXPORT_MIME\.pdf" "$ctrl"           # ≥ 1
grep -c "MIME_TO_MAGIC_BYTES" "$ctrl"               # ≥ 1
grep -c "FILE_UPLOAD_LIMITS\.MAX_FILE_SIZE" "$ctrl" # ≥ 1
grep -c "timeout: 15" "$svc"                        # ≥ 1
grep -c "maxBuffer: 10" "$svc"                      # ≥ 1
grep -c "generateOpaqueId" "$svc"                   # ≥ 1
grep -c "Permission\.CREATE_CALIBRATION" "$ctrl"    # ≥ 1
grep -c "THROTTLE_PRESETS\.UPLOAD" "$ctrl"          # ≥ 1
grep -E "@AuditLog\(" "$ctrl" | wc -l               # ≥ 1

# 하드코딩 0
grep -E "['\"]application/pdf['\"]" "$ctrl" | wc -l # expected: 0
```

### M-10: 다른 세션 도메인 회귀 0건 (cross-domain diff 0줄)
```bash
git diff --cached --name-only | grep -E "(dashboard|approvals|checkouts|commit-pipeline)"
# expected: 0 lines (calibration 외)

# 기존 entry 변경 0줄 (추가만)
git diff --cached packages/schemas/src/errors.ts | grep -E "^-[^-]" | grep "ErrorCode\." | wc -l
git diff --cached packages/shared-constants/src/api-endpoints.ts | grep -E "^-[^-]" | grep -v "^---" | wc -l
# expected: 0 each
```

## SHOULD (not loop-blocking)

### S-1: Dockerfile poppler-utils
```bash
grep -c "poppler-utils" apps/backend/docker/Dockerfile
# expected: ≥ 2 (bullseye apt + alpine apk)
```

### S-2: tech-debt-tracker mark
```bash
grep -A1 "calibration-certificate-ocr-api" .claude/exec-plans/tech-debt-tracker.md \
  | grep -E "(\[x\]|✅|completed|2026-05-06)"
# expected: ≥ 1
```

### S-3: Final commit + push (pre-push hook PASS)
```bash
git log -1 --format="%s" | grep -E "(calibration|certificate|phase a)"
git status -s | wc -l   # expected: 0 (clean)
git rev-parse HEAD == git rev-parse @{u}  # push 완료
```

## Evaluator 실행 순서
1. M-1 ~ M-3 — build + tsc 3종
2. M-4 ~ M-7 — jest 회귀 + 신규
3. M-8 — 5-layer SSOT grep matrix
4. M-9 — 9-layer 보안 + 하드코딩 0
5. M-10 — cross-domain diff 0줄
6. S-1 ~ S-3 — note (FAIL 미차단)

전 항목 MUST PASS 시 commit + push + tech-debt mark.
