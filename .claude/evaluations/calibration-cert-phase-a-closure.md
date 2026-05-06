# Evaluation: calibration-cert-phase-a-closure

> Iteration: 1 · Verdict: PASS · Date: 2026-05-06

## MUST Results

| ID | Description | Verdict | Evidence |
|----|-------------|---------|----------|
| M-1 | Schemas + shared-constants build | PASS | Both packages: `exit 0`, no errors. `@equipment-management/schemas@0.1.0 build` → rimraf dist + tsc --skipLibCheck clean. `@equipment-management/shared-constants@0.1.0 build` → exit 0. |
| M-2 | Backend tsc | PASS | `pnpm --filter backend run type-check` → `exit 0`, zero output after command line. |
| M-3 | Frontend tsc (sprint scope) | PASS | `exit 1` overall but ALL errors are in `hooks/__tests__/use-checkout-group-aggregates.test.ts` only — 8 errors, all in the contractually excluded dead test file. Zero errors in sprint scope (calibration-* files). |
| M-4 | Calibration module jest regression | PASS | 5/5 suites PASS: `certificate-extractor.spec.ts`, `calibration-dto-validation.spec.ts`, `calibration-query-validation.spec.ts`, `calibration.service.spec.ts`, `calibration.controller.spec.ts`. Tests: **68 passed, 68 total** (≥60 threshold met). 0 fail. |
| M-5 | Helper test 8/8 + Component test 6/6 | PASS | `validate-certificate-file.test.ts` PASS, `CalibrationCertificatePdfUploader.test.tsx` PASS. **Tests: 14 passed, 14 total.** |
| M-6 | Backend integration test 3/3 (env-gated) | PASS | ✓ extracts correctly from SUW-E0149_C-2026-051428.PDF (63ms), ✓ SUW-E0409_C-2026-006161.PDF (77ms), ✓ SUW-E0205_C-2025-033730.PDF (45ms). Tests: **3 passed, 3 total.** |
| M-7 | Backend e2e 7/7 | PASS | ✓ 401 (no auth), ✓ 400 CalibrationFileRequired, ✓ 400 FormatUnsupported (mime filter), ✓ 400 ExtractionFailed (magic byte mismatch), ✓ 400 ExtractionFailed (size=0), ✓ 400 FormatUnsupported (HCT marker not found), ✓ 200 + ExtractedCalibrationCertificate (SUW-E0149). Tests: **7 passed, 7 total.** |
| M-8 | ErrorCode 5-layer SSOT | PASS | L2 Service throw: **4** (≥4 ✓). L3 ErrorCode enum: **9** (≥9 ✓). L4 errorCodeToStatusCode: **3** (=3 ✓). L5 Frontend mapper: **3** (≥3 ✓). L5b i18n parity: all 6 (file×key) hits present — ko: 1+1+1, en: 1+1+1 ✓. L5c {field} variable: ko=**1**, en=**1** ✓. |
| M-9 | Security 9-layer + hardcoding 0 | PASS | L1 mime: 4 ✓, L2 magic: 5 ✓, L3 size: 2 ✓, L4 timeout: 1 ✓, L5 maxBuffer: 1 ✓, L6 opaqueId: 2 ✓, L7 perm: 2 ✓, L8 throttle: 2 ✓, L9 audit: 2 ✓. Hardcoding `'application/pdf'` literal: **0** ✓. |
| M-10 | Cross-domain regression 0 | PASS | `git diff --name-only HEAD \| grep -E "(dashboard\|approvals\|checkouts\|commit-pipeline)"` → 0 lines. Deleted lines in shared files: errors.ts=0, api-endpoints.ts=0, ko/calibration.json=0, en/calibration.json=0. Additions only. |

## SHOULD Results

| ID | Description | Verdict | Note |
|----|-------------|---------|------|
| S-1 | Dockerfile poppler-utils | PASS | grep count = **4** (≥2 required). Both bullseye apt + alpine apk entries present. |
| S-2 | tech-debt-tracker mark | FAIL | `calibration-certificate-ocr-api` entry exists in tech-debt-tracker.md but remains `- [ ]` (unchecked). No `[x]`, `✅`, `completed`, or `2026-05-06` marker found. The sprint implemented exactly this feature but the tracker was not updated. |
| S-3 | Final commit + push | FAIL | Last commit is `test(checkouts): use valid rental checkout status` (395435922) — does not match "calibration\|certificate\|phase a" pattern. `git status -s` shows **20 modified/untracked files** (the sprint work is uncommitted). HEAD = origin/main, so prior commits are pushed, but the sprint deliverables have not been committed yet. |

## Repair Instructions (FAIL 항목)

SHOULD failures are not loop-blocking per contract. Documented for resolution:

- **S-2** · `.claude/exec-plans/tech-debt-tracker.md` line containing `calibration-certificate-ocr-api` — change `- [ ]` to `- [x]` and append ` — 2026-05-06 Phase A 구현 완료 (certificate-extractor.service.ts + calibration-certificate.controller.ts). OCR 기관별 룰 기반 필드 매핑은 Phase B 이월.`
- **S-3** · Sprint work (20 files) needs to be committed. Suggested message: `feat(calibration): phase A — certificate PDF extraction API + 5-layer ErrorCode SSOT`. Then `git push` to align HEAD with remote. The pre-push hook must pass before push.

## Verdict

**All 10 MUST criteria PASS → ready for commit.**

2 SHOULD criteria fail (S-2 tech-debt marker, S-3 uncommitted work) — these are not loop-blocking per contract definition but represent incomplete handoff hygiene. The sprint deliverables exist in the working tree and all functional/quality gates are green.
