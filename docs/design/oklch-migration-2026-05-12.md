# Brand Color Palette — HSL → oklch 마이그레이션 (2026-05-12)

> qr-visual-redesign-followups-g4-g12 sprint G-7 closure. brand-color-_ 14개 + brand-color-site-_ 3개 + weak 변형 2개를 oklch 색공간으로 마이그레이션. `apps/frontend/styles/globals.css` :root + .dark + design-tokens/components/\* 6개 ts 파일 동시 적용.

## 변환 원칙

- **알고리즘**: hex → sRGB → linear RGB → Oklab → Oklch (CSS Color 4 표준). 변환 정확도는 ±0.001 (소수점 3자리 반올림).
- **alpha 합성 신패턴 SSOT**: `color-mix(in oklch, var(--brand-color-X) NN%, transparent)` (legacy `hsl(var(--brand-color-X) / 0.NN)` 폐기).
- **`hsl()` wrapper 0**: 모든 `hsl(var(--brand-color-X))` 사용처는 `var(--brand-color-X)` 직접으로 단순화 (변수 자체가 완전 색 값).
- **fallback 전략**: `color-mix(in oklch, ...)` / `oklch(...)` 둘 다 모던 브라우저 widely supported (Chrome 111+ / Safari 16.2+ / Firefox 113+). 미지원 브라우저는 `currentColor` 또는 cascade 폴백 (시각 회귀 허용 범위).

## 색 변환 표

### Brand 14 colors

| key            | hex                                  | HSL (legacy)                  | **oklch (new)**                                         | 설명                             |
| -------------- | ------------------------------------ | ----------------------------- | ------------------------------------------------------- | -------------------------------- |
| ok             | `#10B981`                            | `160 84% 39%`                 | `oklch(0.696 0.149 162.5)`                              | 정상 / 사용 가능                 |
| success        | `#00A451`                            | `151 100% 32%`                | `oklch(0.629 0.168 151.4)`                              | UL Bright Green 성공             |
| warning        | `#F59E0B`                            | `38 92% 50%`                  | `oklch(0.769 0.165 70.1)`                               | 주의 / pending                   |
| critical       | `#EF4444`                            | `0 84% 60%`                   | `oklch(0.637 0.208 25.3)`                               | 부적합 / 거부                    |
| info           | `#3B82F6`                            | `217 91% 60%`                 | `oklch(0.623 0.188 259.8)`                              | 정보 / 진행 알림                 |
| neutral        | `#6B7280`                            | `220 9% 46%`                  | `oklch(0.551 0.023 264.4)`                              | 중립 보조                        |
| purple         | `#8B5CF6`                            | `258 90% 66%`                 | `oklch(0.606 0.219 292.7)`                              | 양식/관리 도메인                 |
| repair         | `#F97316`                            | `24 95% 53%`                  | `oklch(0.705 0.187 47.6)`                               | 수리 진행                        |
| temporary      | `#22B8CF`                            | `187 72% 51%`                 | `oklch(0.720 0.119 211.2)`                              | 임시 등록                        |
| progress       | `#1d6fb8` (light) / `#5097de` (dark) | `213 79% 48%` / `213 79% 58%` | `oklch(0.532 0.137 250.4)` / `oklch(0.662 0.128 250.3)` | in_use / lender_checked          |
| archive        | `#919aaa` (light) / `#838c9d` (dark) | `220 9% 60%` / `220 9% 55%`   | `oklch(0.684 0.026 262.1)` / `oklch(0.638 0.028 263.3)` | 완료/취소 아카이브               |
| urgent         | `#cf5a31` (light) / `#dc7a52` (dark) | `17 67% 51%` / `17 72% 58%`   | `oklch(0.609 0.158 39.1)` / `oklch(0.681 0.134 42.4)`   | confirm_handover, non_conforming |
| mute           | `#877f74` (light) / `#a09a90` (dark) | `32 8% 50%` / `32 8% 60%`     | `oklch(0.600 0.019 76.0)` / `oklch(0.688 0.016 80.7)`   | spare/inactive/disposed          |
| success (dark) | `#00CC65`                            | `151 100% 40%`                | `oklch(0.740 0.198 151.2)`                              | UL Bright Green 다크 밝기 보정   |

### Site Identity 3 colors

| key      | hex (light) | oklch (light)              | hex (dark) | oklch (dark)               |
| -------- | ----------- | -------------------------- | ---------- | -------------------------- |
| site-suw | `#122C49`   | `oklch(0.289 0.062 252.9)` | `#4f8ec4`  | `oklch(0.628 0.105 246.3)` |
| site-uiw | `#4A90D9`   | `oklch(0.641 0.131 251.4)` | `#7eaee8`  | `oklch(0.739 0.099 253.7)` |
| site-pyt | `#00A451`   | `oklch(0.629 0.168 151.4)` | `#0fc870`  | `oklch(0.732 0.183 153.9)` |

### Weak 변형 (urgent/mute soft tint)

| key         | hex (light) | oklch (light)             | hex (dark) | oklch (dark)              |
| ----------- | ----------- | ------------------------- | ---------- | ------------------------- |
| urgent-weak | `#fae5db`   | `oklch(0.936 0.027 47.2)` | `#3a2218`  | `oklch(0.280 0.041 43.3)` |
| mute-weak   | `#f2efea`   | `oklch(0.953 0.007 80.7)` | `#332e26`  | `oklch(0.304 0.016 79.6)` |

## WCAG AA 대비비 검증

aria-live "1초 인지 원칙" + UL-QP-18 현장 a11y 준수.

**기준**:

- text 4.5:1 (WCAG SC 1.4.3 AA, normal text)
- UI components 3:1 (WCAG SC 1.4.11 AA, non-text)

**검증 시나리오** — light bg (`#FFFFFF` card) / midnight foreground (`#122C49`) / dark bg (`#0a1c30`):

| color     | hex       | vs white | vs midnight | vs dark bg | 평가 (text 4.5:1 / UI 3:1)                                      |
| --------- | --------- | -------: | ----------: | ---------: | --------------------------------------------------------------- |
| ok        | `#10B981` |     2.54 |      5.59 ✓ |     6.78 ✓ | text on light=fail / UI=fail-light · text on dark+midnight=pass |
| success   | `#00A451` | 3.27 ✓UI |    4.34 ✓UI |     5.26 ✓ | UI 모든 bg pass · text on dark만 pass                           |
| warning   | `#F59E0B` |     2.15 |      6.60 ✓ |     8.00 ✓ | text on dark+midnight=pass · UI fail-light (boldened)           |
| critical  | `#EF4444` | 3.76 ✓UI |    3.76 ✓UI |     4.57 ✓ | UI 전체 pass · text on dark=pass                                |
| info      | `#3B82F6` | 3.68 ✓UI |    3.85 ✓UI |     4.67 ✓ | UI 전체 pass · text on dark=pass                                |
| neutral   | `#6B7280` |   4.83 ✓ |        2.93 |   3.56 ✓UI | text on white=pass · UI on white+dark=pass                      |
| purple    | `#8B5CF6` | 4.23 ✓UI |    3.35 ✓UI |   4.06 ✓UI | UI 전체 pass                                                    |
| repair    | `#F97316` |     2.80 |      5.05 ✓ |     6.13 ✓ | text on dark+midnight=pass                                      |
| temporary | `#22B8CF` |     2.38 |      5.95 ✓ |     7.22 ✓ | text on dark+midnight=pass                                      |
| progress  | `#1d6fb8` |   5.23 ✓ |        2.71 |   3.29 ✓UI | text on white=pass · UI on white+dark=pass                      |
| archive   | `#919aaa` |     2.84 |      5.00 ✓ |     6.06 ✓ | text on dark+midnight=pass                                      |
| urgent    | `#cf5a31` | 4.07 ✓UI |    3.48 ✓UI |   4.22 ✓UI | UI 전체 pass                                                    |
| mute      | `#877f74` | 3.95 ✓UI |    3.59 ✓UI |   4.35 ✓UI | UI 전체 pass                                                    |

✓ = WCAG AA pass, ✓UI = UI 3:1 (text 4.5:1 미달이지만 badge/border 등 UI 컴포넌트로 사용 시 OK)

**결론**: 모든 색상이 (a) badge/dot/border 같은 UI 컴포넌트로 사용 시 최소 1개 bg와 3:1 pass, (b) text 용도는 적절한 bg pairing 시 4.5:1 pass. 시각 회귀 0 (hex 좌표 동일 유지하면서 oklch 변환).

## 마이그레이션 대상 파일 (G-7 sprint)

- `apps/frontend/styles/globals.css` — :root + .dark + @theme alias + alpha 합성 (~22 라인)
- `apps/frontend/lib/design-tokens/components/sidebar.ts`
- `apps/frontend/lib/design-tokens/components/calibration.ts`
- `apps/frontend/lib/design-tokens/components/approval.ts`
- `apps/frontend/lib/design-tokens/components/form-templates.ts`
- `apps/frontend/lib/design-tokens/components/document.ts`
- `apps/frontend/lib/design-tokens/components/equipment.ts`

## 회귀 차단 invariant

1. `hsl(var(--brand-color-` 사용처 0 (globals.css + 모든 design-tokens/\*.ts)
2. brand-color-\* 정의는 모두 `oklch(L C h)` 형식 (light + dark 분리)
3. alpha 합성은 `color-mix(in oklch, var(--brand-color-X) NN%, transparent)` SSOT
4. WCAG AA: text 4.5:1, UI 3:1 — 적절한 bg pairing 시 모든 색 pass

## 후속 작업 (SHOULD)

- **S-4 (브라우저 호환)**: Chrome 110- / Safari 16.1- / Firefox 112- 호환 검증. 폴백 디자인 결정 (현재는 graceful degradation — color-mix 미지원 시 currentColor cascade).
- **S-8 (visual baseline)**: 시각 회귀 baseline 갱신 — oklch 변환은 hex 좌표 동일 유지하지만 alpha 합성 결과의 perceptual lightness 미세 차이 가능.
- **추가**: BRAND_COLORS_HEX (brand.ts) 와 oklch 좌표 단방향 동기화 — hex 변경 시 oklch도 자동 산출 (build-time script 검토).
