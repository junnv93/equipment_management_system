# Evaluation Report: qr-sampler (Iteration 2)
Date: 2026-04-19

## Verdict: PASS

## MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M1 | LABEL_SAMPLER_LAYOUT, LABEL_SAMPLER_CONFIG, getSamplerPresetOrder() defined in qr-config.ts | PASS | All three found in `packages/shared-constants/src/qr-config.ts` lines 296, 307, 333 |
| M2 | buildSamplerPdf() exists, 'sampler' mode branch handled | PASS | `buildSamplerPdf` defined at worker line 692; `data.mode === 'sampler'` branch at line 791–795 |
| M3 | Worker iterates via getSamplerPresetOrder(), no preset literal hardcoding in loop | PASS | `const presets = getSamplerPresetOrder()` at line 699; no hardcoded `'standard'`/`'medium'`/`'small'` strings inside buildSamplerPdf loop body |
| M4 | buildSinglePdf/buildBatchPdf/renderCellToDataUrl signatures unchanged | PASS | `renderCellToDataUrl(item, appUrl, canvas, opts)` at line 402; `buildSinglePdf(item, appUrl, sizePreset, layoutMode)` at line 608; `buildBatchPdf(items, appUrl)` at line 636 — all intact |
| M5 | printMode:'sampler'\|'custom' state, default sampler, RadioGroup UI, conditional rendering | PASS | `type PrintMode = 'sampler' \| 'custom'` line 29; `useState<PrintMode>('sampler')` line 62; `<RadioGroup>` with both options lines 180–213; `{printMode === 'custom' && (` conditional at line 217 |
| M6 | `pnpm --filter frontend exec tsc --noEmit` PASS | PASS | Command exited with no output (exit 0), no type errors |
| M7 | any/as any/ts-ignore = 0 in changed files | PASS | Grep on all 4 changed files returned zero matches for `: any`, `as any`, `@ts-ignore`, `@ts-expect-error` |
| M8 | ko/en qr.json same key structure (sampler-related keys), sampler.header.* uses {widthMm}/{heightMm} tokens | PASS | Both files have identical 7 sampler-related keys (structure verified by JSON parse + key diff). All three header values in both locales contain `{widthMm}` and `{heightMm}` interpolation tokens: ko lines 46–48, en lines 46–48 |

## SHOULD Criteria

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| S1 | Worker is i18n-free (samplerHeaders injected from main thread) | MET | Worker receives `samplerHeaders: Record<LabelSizePreset, string>` from caller; no next-intl import in worker |
| S2 | getSamplerPresetOrder() used in both worker and EquipmentQRButton (not duplicated) | MET | Worker imports from shared-constants (line 47); EquipmentQRButton also imports `getSamplerPresetOrder` from shared-constants (line 25) |

## Issues Found

None. All 8 MUST criteria pass. The M8 fix from Iteration 1 (replacing hardcoded dimension strings with `{widthMm}` / `{heightMm}` interpolation tokens) is confirmed applied correctly in both ko and en qr.json.
