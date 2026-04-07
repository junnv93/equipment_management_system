# Contract: Cable Path Loss Export (QP-18-08)

## Slug: cable-pathloss-export

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `pnpm --filter backend run tsc --noEmit` passes | Zero TS errors |
| M2 | `pnpm --filter frontend run tsc --noEmit` passes | Zero TS errors |
| M3 | `pnpm build` passes | All packages build |
| M4 | `FORM_CATALOG['UL-QP-18-08'].implemented === true` | form-catalog.ts |
| M5 | `exportCablePathLoss` registered in exporters map | form-template-export.service.ts |
| M6 | Excel export generates Sheet 1 (RF Conducted) with cable list | 7 columns: No, 관리번호, Length, TYPE, 주파수범위, S/N, 위치 |
| M7 | Excel export generates Sheet 2~N per cable with Path Loss data | Freq(MHz) + Data(dB) columns |
| M8 | Frontend Export button on cable list page | CableListContent.tsx |
| M9 | i18n keys for export (en + ko) | cables.json both languages |
| M10 | WF-21 documented in critical-workflows.md | Full workflow steps |
| M11 | Backend tests pass | `pnpm --filter backend run test` |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | verify-hardcoding PASS (no hardcoded API paths) |
| S2 | verify-ssot PASS (SSOT imports) |
| S3 | verify-i18n PASS (en/ko key match) |
| S4 | E2E test: cable CRUD + export flow |
