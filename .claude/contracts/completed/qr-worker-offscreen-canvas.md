---
slug: qr-worker-offscreen-canvas
mode: 1
date: 2026-04-18
---

# Contract: QR Worker OffscreenCanvas Migration

## Problem
`QRCode.toDataURL()` internally calls `document.createElement('canvas')` — unavailable in Web Worker context.
Error: "You need to specify a canvas element" at `generate-label-pdf.worker.ts`.

## Root Cause
`qrcode` library's `toDataURL` creates a canvas element via DOM when no canvas is provided.
Web Workers have no `document` object, so this throws at runtime.

## Solution
Replace `QRCode.toDataURL` with `QRCode.toCanvas` + `OffscreenCanvas` (Web Worker-compatible canvas API).
Convert result to data URL via `FileReader.readAsDataURL`.

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `tsc --noEmit` passes (no TypeScript errors) | `pnpm --filter frontend run tsc --noEmit` |
| M2 | `QRCode.toDataURL` no longer called in worker | `grep -n "toDataURL" generate-label-pdf.worker.ts` → 0 matches |
| M3 | `OffscreenCanvas` used in worker (DOM-free path) | `grep -n "OffscreenCanvas" generate-label-pdf.worker.ts` → ≥1 match |
| M4 | No `any` type introduced | `grep -n ": any" generate-label-pdf.worker.ts` → 0 matches |
| M5 | `blobToDataUrl` helper uses typed Promise<string> | inspect helper signature |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | `blobToDataUrl` extracted as named function (not inline) for readability |
| S2 | QR options object references SSOT constants (no inline magic numbers) |
