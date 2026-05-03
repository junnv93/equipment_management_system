# Contract: phase3-design-token-verifier

## Scope

Close tracker item `phase3-ts-morph-design-tokens`.

## MUST

- Add `apps/frontend/scripts/verify-design-tokens.ts`.
- The verifier MUST check `BRAND_COLORS_HEX`, `BRAND_CLASS_MATRIX`, and `apps/frontend/styles/globals.css` brand color variables are synchronized.
- The verifier MUST detect dynamic `brand-*` Tailwind interpolation such as `bg-brand-${variant}` / ``text-brand-${key}``.
- The verifier MUST detect `transition-all` outside allowed documentation comments and generated/vendor-like paths.
- Current workspace MUST pass the verifier.
- Frontend type-check MUST pass.

## SHOULD

- Expose the verifier via a frontend package script.
- Avoid new runtime dependencies.

## Verification

- Run the design-token verifier.
- Run `pnpm --filter frontend run type-check`.
- Record evidence in `.claude/evaluations/phase3-design-token-verifier.md`.
