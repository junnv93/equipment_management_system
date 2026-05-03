# Performance Budgets (UL Equipment Management System)

SSOT for CI performance/accessibility/bundle-size gates.
Referenced by `.github/workflows/performance-audit.yml`, `accessibility-audit.yml`, `bundle-size.yml`.

## Lighthouse CI Thresholds

| Category       | Minimum Score |
| -------------- | ------------- |
| Performance    | 90            |
| Accessibility  | 95            |
| Best Practices | 90            |
| SEO            | 90            |

## Core Web Vitals

| Metric                              | Budget     |
| ----------------------------------- | ---------- |
| LCP (Largest Contentful Paint)      | < 2.5s     |
| INP (Interaction to Next Paint)     | < 200ms    |
| CLS (Cumulative Layout Shift)       | < 0.1      |
| `/software/:id` QR landing (mobile) | LCP < 1.8s |

## axe-core Thresholds

| Rule Level          | Budget          |
| ------------------- | --------------- |
| critical violations | 0               |
| serious violations  | 0               |
| Tags                | wcag2a, wcag2aa |

## Bundle Size

| Asset                | Budget   |
| -------------------- | -------- |
| First Load JS (gzip) | < 250 KB |
| Per-route JS (gzip)  | < 150 KB |
| Total static assets  | < 2 MB   |

## Monitored Routes

Route targets are defined in `docs/operations/quality-audit-routes.json`.

- `publicRoutes`: run in lightweight CI without backend authentication.
- `authenticatedRoutes`: registry-only for now. They require seeded backend data and
  Playwright storageState before `lighthouse` or `a11y` can be enabled.

Do not add route strings directly to Lighthouse or axe configs. Add the route to
`quality-audit-routes.json`, then opt it into the relevant audit with
`lighthouse` and `a11y`.
