# Session Final Verify Implementation: Font System SSOT

## 범위

이번 세션에서 작업한 `font-system-ssot` 파일만 검증했다. 기존 calibration scope guard 관련
변경은 범위에서 제외했다.

## 대상 파일

- `packages/shared-constants/src/font-policy.ts`
- `packages/shared-constants/src/index.ts`
- `packages/shared-constants/src/qr-config.ts`
- `apps/frontend/app/layout.tsx`
- `apps/frontend/styles/globals.css`
- `apps/frontend/lib/design-tokens/brand.ts`
- `apps/frontend/lib/design-tokens/components/approval.ts`
- `apps/frontend/lib/design-tokens/__tests__/font-policy.test.ts`
- `apps/backend/src/common/docx/docx-template.util.ts`
- `apps/backend/src/common/middleware/helmet-config.ts`
- `apps/backend/src/database/seed-data/core/generate-signatures.ts`
- `apps/backend/src/modules/cables/services/cable-path-loss-renderer.service.ts`
- `apps/backend/src/modules/calibration-plans/services/calibration-plan-renderer.service.ts`
- `apps/backend/src/modules/data-migration/services/excel-parser.service.ts`
- `apps/backend/src/modules/equipment/services/history-card.layout.ts`
- `apps/backend/src/modules/notifications/services/email-template.service.ts`
- `apps/backend/src/modules/notifications/services/__tests__/email-template.service.spec.ts`
- `apps/backend/src/modules/reports/report-export.service.ts`
- `apps/backend/src/modules/reports/__tests__/report-export.service.spec.ts`
- `scripts/check-font-policy-sync.mjs`
- `package.json`
- `.claude/exec-plans/completed/2026-05-03-font-system-ssot.md`
- `.claude/contracts/completed/font-system-ssot.md`
- `.claude/evaluations/font-system-ssot.md`

## 구현 검증 보고서

| 검증 스킬 | 상태 | 이슈 수 | 상세 |
|-----------|------|---------|------|
| verify-ssot | PASS | 0 | 폰트 정책이 `@equipment-management/shared-constants` public API로 승격됨. QR, UI, email/document policy가 같은 SSOT를 참조함. |
| verify-hardcoding | PASS | 0 | 폰트명 리터럴은 `font-policy.ts`로 집중됨. `rg` 결과가 SSOT 파일 외 신규 중복 font stack을 보이지 않음. |
| verify-design-tokens | PASS | 0 | `brand.ts`의 `FONT` helper가 `FONT_USAGE_CLASSES`를 참조하고, `globals.css`는 runtime CSS var만 매핑함. |
| verify-security | PASS | 0 | backend Helmet CSP에서 unused Google Fonts host 허용 제거. Frontend CSP는 self/data font policy 유지. |
| verify-nextjs | PASS | 0 | `RootLayout`가 정적 shell 유지 상태에서 `FONT_CSS_VARIABLES`를 `<html style>`로 주입함. |
| verify-handover-qr | PASS | 0 | QR label `fontStack`은 `LABEL_CONFIG.cell.fontStack` 경유를 유지하고, 값은 `CSS_FONT_STACKS.koreanUi`에서 파생됨. |
| verify-seed-integrity | PASS | 0 | signature seed SVG fallback font도 `FONT_FAMILY.signatureFallback`로 이동함. |
| verify-implementation | PASS | 0 | 독립 Evaluator 보고서 `.claude/evaluations/font-system-ssot.md`에서 MUST 전체 PASS. |

## 실행 명령

| 명령 | 결과 |
|------|------|
| `node scripts/check-font-policy-sync.mjs` | PASS |
| `pnpm tsc --noEmit` | PASS |
| `pnpm --filter frontend run type-check` | PASS |
| `pnpm --filter backend run type-check` | PASS |
| `pnpm --filter frontend run build` | PASS |
| `pnpm --filter backend run build` | PASS |
| `pnpm --filter frontend run test -- font-policy` | PASS |
| `pnpm --filter backend run test -- email-template report-export` | PASS |

## 발견된 총 이슈

0개.

## 비고

작업 트리에는 이번 세션 이전/외부의 calibration scope guard 관련 변경이 함께 존재한다. 본 검증은
폰트 SSOT 작업 파일만 대상으로 수행했다.
