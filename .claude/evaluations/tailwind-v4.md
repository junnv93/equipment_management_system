# Evaluation — tailwind-v4
date: 2026-04-07
iteration: 1
verdict: PASS

## MUST results
| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | build exits 0 with no warnings | PASS | `pnpm --filter frontend run build` EXIT=0; build output reaches "Static / Dynamic" legend cleanly |
| 2 | tsc --noEmit exits 0 | PASS | `pnpm --filter frontend run type-check` completes with no output (success) |
| 3 | verify-design-tokens PASS | PASS (proxy) | Token files unchanged in structure; only diff is removal of `bg-opacity-100` literal in visual-feedback.ts which is the v4 deprecation fix |
| 4 | Design Token 3-Layer preserved + CSS var bridge intact | PASS | primitives.ts/semantic.ts/components/ all present; globals.css :root + .dark blocks preserve all `--brand-*`, `--background`, `--foreground`, `--chart-*`, `--ease-*`, `--brand-color-site-*` names and HSL values |
| 5 | Dark mode wired (`@custom-variant dark` + `.dark` block) | PASS | Line 8: `@custom-variant dark (&:where(.dark, .dark *));`; `.dark` block at L386–459 |
| 6 | `@apply` continues to compile | PASS | Build success; `@apply border-border`, `@apply bg-background text-foreground` in @layer base compile |
| 7 | shadcn/ui cva variants unaffected | PASS | Build success; CVA deps (class-variance-authority, tailwind-merge) intact in package.json |
| 8 | `tailwindcss-animate` removed → `tw-animate-css` | PASS | grep tailwindcss-animate package.json: empty; `tw-animate-css ^1.4.0` in devDeps; `@import 'tw-animate-css'` line 2 of globals.css; 8 ui/* files use `animate-in`/`fade-in-0`/`slide-in-from-top` and build succeeds |
| 9 | `@tailwindcss/postcss` only Tailwind plugin | PASS | postcss.config.js contains only `'@tailwindcss/postcss': {}` |
| 10 | tailwind.config.* does not exist | PASS | `ls apps/frontend/tailwind.config.*` → No such file |

## SHOULD results
| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | globals.css logical ordering | PASS | imports → @custom-variant → @theme inline → @theme → @utility → @layer base (vars) → @layer base (selectors) → @layer utilities → print |
| 2 | @source used at most once | PASS | No `@source` directive present (auto-detect) |
| 3 | Zero deprecated v4 utility names | PASS | grep for bg-opacity/text-opacity/ring-opacity/border-opacity/decoration-slice/decoration-clone in *.ts/tsx → 0 hits |
| 4 | autoprefixer removed | PASS | Not present in package.json devDeps |
| 5 | Changes scoped to allowed paths | PASS | Diff only touches apps/frontend/{package.json, postcss.config.js, styles/globals.css, lib/design-tokens/visual-feedback.ts}; tailwind.config.js deleted |
| 6 | Phased commit granularity | PASS | Branch shows phase 1 (deps), phase 2-3 (CSS-first), phase 4 (utility sweep) commits |

## Issues to fix
None — all MUST and SHOULD criteria pass.
