# 스프린트 계약: qr-visual-redesign-followups-g4-g12 라운드 #3 자기검토 closure

## 생성 시점
2026-05-13T00:00:00+09:00

## 메타
- Slug: `qr-visual-redesign-followups-g4-g12-round3`
- 모드: Mode 2 (Full Planner→Generator→Evaluator, 라운드 #3 자기검토)
- 소속: g4-g12 sprint commit `850d2945` 의 라운드 #3 자기검토 후속
- Source: 시니어 자기검토 8 갭 (G-4/G-7/G-10/G-11/G-12 미흡 + pre-existing 회귀 등록 + multi-session handoff)

## 8 갭 Scope

| 갭 | 우선 | 설명 |
|----|------|------|
| 갭 1 | 🟡 MED | brand.ts `getTimestampClasses()` + `getKpiCounterClasses()` `.text-mono` SSOT 확장 — `font-mono tabular-nums` 중복 제거 |
| 갭 2 | 🟡 MED | Tailwind v4 JIT + color-mix arbitrary value 호환성 검증 — approval.ts:279 + team.ts:273 |
| 갭 3 | 🟡 MED | equipment.service.spec + settings.service.spec drizzle-stub SSOT 마이그레이션 |
| 갭 4 | 🟡 MED | toLocaleString 14 site locale 마이그레이션 (G-11 scope 확장) |
| 갭 5 | 🟢 LOW | EquipmentQRButton.tsx inline IIFE 안티패턴 → MiniQRPattern helper component |
| 갭 6 | 🟠 HIGH | pre-existing M-2 회귀 tech-debt 등록 — checkouts.service.ts `rejectionPresets.updatedAt` |
| 갭 7 | 🟡 MED | pre-existing M-3 환경 누락 tech-debt 등록 — INTERNAL_BACKEND_URL .env.local |
| 갭 8 | 🟢 LOW | multi-session handoff 문서 작성 — `.claude/handoff/2026-05-13-g4-g12-round3-stash-state.md` |

## 성공 기준

### 필수 (MUST)

#### 빌드 / 타입 / 테스트
- **M-1** `pnpm tsc --noEmit` EXIT=0 (frontend + backend).
- **M-2** `pnpm --filter backend build` EXIT=0 (또는 우리 sprint 영향 0 — pre-existing 회귀 갭 6은 별도).
- **M-3** `pnpm --filter frontend build` EXIT=0 + Tailwind JIT 정상 (갭 2 검증 포함).
- **M-4** `pnpm --filter backend test` 기존 PASS + 갭 3 마이그레이션 spec PASS.
- **M-5** `pnpm --filter frontend test` 기존 PASS.
- **M-6** `pnpm lint` EXIT=0.

#### 갭 1 (brand.ts mono SSOT)
- **M-7** `getTimestampClasses()` 가 `.text-mono` 포함:
  ```bash
  grep -A 2 "function getTimestampClasses" apps/frontend/lib/design-tokens/brand.ts | grep "text-mono"  # ≥ 1
  ```
- **M-8** `getKpiCounterClasses()` 가 `.text-mono` 포함:
  ```bash
  grep -A 2 "function getKpiCounterClasses" apps/frontend/lib/design-tokens/brand.ts | grep "text-mono"  # ≥ 1
  ```
- **M-9** `font-mono tabular-nums` 중복 정의 0건:
  ```bash
  grep -c "'font-mono tabular-nums" apps/frontend/lib/design-tokens/brand.ts  # = 0 (헬퍼는 .text-mono 합성)
  ```

#### 갭 2 (Tailwind v4 JIT color-mix 호환)
- **M-10** `pnpm --filter frontend build` EXIT=0 + 빌드 산출물에 `color-mix` 또는 동등 fallback 포함:
  ```bash
  # 빌드 후 dist/static CSS 에 color-mix 또는 CSS 변수 fallback 검증
  find apps/frontend/.next/static -name "*.css" 2>/dev/null | head -1 | xargs grep -l "color-mix\|--brand-color-ok" 2>/dev/null | wc -l  # ≥ 1
  ```

#### 갭 3 (drizzle-stub SSOT 확장)
- **M-11** 2 spec drizzle-stub import:
  ```bash
  grep -c "drizzle-stub" apps/backend/src/modules/equipment/__tests__/equipment.service.spec.ts  # ≥ 1
  grep -c "drizzle-stub" apps/backend/src/modules/settings/__tests__/settings.service.spec.ts  # ≥ 1
  ```
- **M-12** 로컬 fluent chain 정의 제거 (또는 SSOT delegate):
  ```bash
  # 로컬 createSelectChain / makeDbStub / mockReturnThis().where 정의 0
  grep -cE "const createSelectChain|function makeDbStub" apps/backend/src/modules/equipment/__tests__/equipment.service.spec.ts apps/backend/src/modules/settings/__tests__/settings.service.spec.ts  # = 0
  ```

#### 갭 4 (toLocaleString locale)
- **M-13** locale-less `toLocaleString()` (숫자) 0건 (또는 명시 allow-list 등록):
  ```bash
  # locale-less .toLocaleString() — 14 site → 0
  grep -rcE "\.toLocaleString\(\)" apps/frontend/components apps/frontend/app 2>/dev/null | awk -F: '$2 > 0 {sum+=$2} END {print sum+0}'  # = 0
  ```
- **M-14** SKILL Step 37 확장:
  ```bash
  grep -cE "toLocaleString\(\)|숫자 포맷 locale" .claude/skills/verify-hardcoding/SKILL.md  # ≥ 1
  ```

#### 갭 5 (inline IIFE 추출)
- **M-15** EquipmentQRButton inline IIFE 0건:
  ```bash
  grep -cE "\(\(\) => \{" apps/frontend/components/equipment/EquipmentQRButton.tsx  # = 0
  ```
- **M-16** `MiniQRPattern` 또는 동등 helper component 존재:
  ```bash
  grep -cE "function MiniQRPattern|const MiniQRPattern" apps/frontend/components/equipment/EquipmentQRButton.tsx  # ≥ 1
  ```

#### 갭 6/7/8 (등록)
- **M-17** tech-debt-tracker.md 에 pre-existing 회귀 2건 + handoff 등록:
  ```bash
  grep -cE "rejectionPresets\.updatedAt|INTERNAL_BACKEND_URL.*\.env\.local" .claude/exec-plans/tech-debt-tracker.md  # ≥ 2
  ```
- **M-18** handoff 문서 존재:
  ```bash
  test -f .claude/handoff/2026-05-13-g4-g12-round3-stash-state.md
  grep -cE "stash@\{[0-9]\}|other-sessions-wip" .claude/handoff/2026-05-13-g4-g12-round3-stash-state.md  # ≥ 4
  ```

#### 격리
- **M-19** software-validations + saved-views + cache-event-r2 + ultrareview-shield 도메인 0 파일 수정 (우리 commit 영역):
  ```bash
  git diff --cached --name-only | grep -E "modules/software-validations|modules/saved-views|cache-event|ultrareview"  # = 0
  ```

### 권장 (SHOULD)
- **S-1** brand.ts mono 헬퍼 3종 (`getManagementNumberClasses` + `getTimestampClasses` + `getKpiCounterClasses`) 단일 factory 패턴 통합 검토.
- **S-2** EquipmentQRButton `MiniQRPattern` Storybook entry.

## 종료 조건

- MUST 전체 PASS → commit + tech-debt 라운드 #3 항목 closure + 라운드 #4 자기검토.
- 동일 이슈 2회 연속 FAIL → 수동 개입.
