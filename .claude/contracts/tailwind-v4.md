---
id: tailwind-v4
plan: 2026-04-07-tailwind-v4
created: 2026-04-07
---

# Contract — Tailwind v4 Migration

## MUST (blocking)
1. `pnpm --filter frontend run build` exits 0 with no Tailwind/PostCSS warnings.
2. `pnpm --filter frontend exec tsc --noEmit` exits 0.
3. `verify-design-tokens` skill reports PASS.
4. Design Token 3-Layer architecture preserved: `apps/frontend/lib/design-tokens/{primitives,semantic,components/*}.ts` unchanged in structure; primitives still the only layer with raw values; semantic/components still reference primitives (no direct hex); CSS-variable bridge in `globals.css` preserves the exact same `--brand-*`, `--background`, `--foreground`, `--chart-*`, `--ease-*`, `--brand-color-site-*` names and values (both `:root` and `.dark`).
5. Dark mode works: `.dark` class toggle still flips all tokens. `@custom-variant dark` declared so `dark:` variants compile.
6. Every existing `@apply` usage continues to compile — including the 20 files currently using `@apply` in `components/ui/*`, `components/layout/*`, `components/auth/*`, `app/(dashboard)/loading.tsx`, and `styles/accessibility.css` (which MUST gain a `@reference` directive if it uses `@apply`).
7. No regressions to shadcn/ui cva variants — `class-variance-authority` + `cn()` + `tailwind-merge` pipeline unaffected; all variant class strings still produce valid v4 utilities.
8. `tailwindcss-animate` fully removed from `package.json`, lockfile, and source; replaced by `tw-animate-css` imported from `globals.css`. All `animate-in`/`fade-in-*`/`slide-in-from-*` classes used by shadcn components still render.
9. `@tailwindcss/postcss` present and used as the only Tailwind plugin in `postcss.config.js`.
10. `tailwind.config.js`/`.ts`/`.cjs` does not exist (or, if retained as an escape hatch, it is empty-extend).

## SHOULD (non-blocking quality bar)
1. `globals.css` reads top-to-bottom as: imports → `@custom-variant` → `@theme` → `@layer base` (CSS vars) → `@layer base` (global selectors) → `@layer utilities` → print styles. No duplication between `@theme` and `@layer base`.
2. `@source` directive used at most once, only if `packages/*` is actually referenced. Prefer content auto-detection.
3. Zero deprecated v4 utility names in source: `shadow-sm` (old sense), bare `shadow`, `outline-none`, bare `ring`, `flex-shrink-*`, `flex-grow-*`, `bg-opacity-*`, `text-opacity-*`, `ring-opacity-*`, `border-opacity-*`, `decoration-slice`, `rounded-sm`, `blur-sm`, `drop-shadow-sm`.
4. `autoprefixer` removed from dependencies unless the generator proves it is still required.
5. No changes outside: `apps/frontend/{package.json,postcss.config.js,tailwind.config.js,styles/*.css,components/**,app/**,lib/design-tokens/**}`. `packages/*` untouched.
6. Commit granularity matches phases: one commit per Phase 1–4, one verification commit for Phase 5 if fixes needed.

## Verification Commands
```bash
pnpm install
pnpm --filter frontend run type-check
pnpm --filter frontend run build
pnpm --filter frontend exec eslint .
rg -n '\b(shadow-sm|outline-none|bg-opacity-|text-opacity-|ring-opacity-|border-opacity-|flex-shrink-|flex-grow-|decoration-slice|rounded-sm|blur-sm|drop-shadow-sm)\b' apps/frontend
ls apps/frontend/tailwind.config.* 2>/dev/null && echo "FAIL: config still present" || echo "OK"
grep -n tailwindcss-animate apps/frontend/package.json && echo "FAIL" || echo "OK"
grep -n '@tailwindcss/postcss' apps/frontend/postcss.config.js || echo "FAIL"
```

## Out of Scope
- Renaming or restructuring Design Tokens.
- Touching `packages/*`.
- Redesigning dark mode strategy (stays `.dark` class).
- Upgrading shadcn/ui components.
- Performance tuning beyond what v4 ships by default.
