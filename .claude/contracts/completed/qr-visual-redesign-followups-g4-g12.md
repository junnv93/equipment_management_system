# 스프린트 계약: qr-visual-redesign 후속 G-4~G-12 통합 closure

## 생성 시점
2026-05-12T00:00:00+09:00

## 메타
- Slug: `qr-visual-redesign-followups-g4-g12`
- 모드: Mode 2 (Full Planner→Generator→Evaluator)
- Exec plan: `.claude/exec-plans/active/2026-05-12-qr-visual-redesign-followups-g4-g12.md`
- Source: tech-debt-tracker.md `2026-05-12 qr-visual-redesign 시니어 자기감사 후속` 9건

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

#### 빌드 / 타입 / 테스트
- **M-1** `pnpm tsc --noEmit` EXIT=0 (root + backend + frontend + packages).
- **M-2** `pnpm --filter backend run build` EXIT=0.
- **M-3** `pnpm --filter frontend run build` EXIT=0 (Tailwind JIT + oklch 변환 통과).
- **M-4** backend 마이그레이션된 spec 2종 PASS:
  ```bash
  pnpm --filter backend run test -- qr-access.service.spec.ts audit.service.spec.ts
  ```
- **M-5** frontend 신규 spec PASS:
  ```bash
  pnpm --filter frontend run test -- StatusBadge
  ```
- **M-6** `pnpm lint` EXIT=0.

#### G-4 (text-mono SSOT)
- **M-7** `getManagementNumberClasses()` 내부 `.text-mono` 진입 + EquipmentCardGrid 중복 0:
  ```bash
  grep -c "text-mono" apps/frontend/lib/design-tokens/brand.ts  # ≥ 1
  grep -n "text-xs.*tracking-wider\|tracking-wider.*text-xs" apps/frontend/components/equipment/EquipmentCardGrid.tsx  # = 0
  ```

#### G-5 (statusBadge tone i18n)
- **M-8** StatusBadge aria-label에 톤 i18n 사용:
  ```bash
  grep -n "qr.statusBadge.tone\|statusBadge.tone\|useTranslations.*qr.statusBadge\|t(.tone" apps/frontend/components/ui/StatusBadge.tsx  # ≥ 1
  ```
- **M-9** tone key 활용 — 동적 template `t(\`tone.${tone}\`)` 또는 명시 literal 둘 다 PASS:
  ```bash
  # 동적 template OR literal — 둘 다 dead-key 활용 의도 충족
  grep -cE "tone\.\\\$\{tone\}|tone\.(ok|warn|urgent|mute)\b" apps/frontend/components/ui/StatusBadge.tsx  # ≥ 1
  ```
- **M-10** RTL spec 8 status × tone:
  ```bash
  grep -c "aria-label\|getByRole.*status\|status.*aria-label" apps/frontend/components/ui/__tests__/StatusBadge.test.tsx  # ≥ 8
  ```

#### G-6 (abnormal photo 항목별)
- **M-11** ConditionItemCard 내부 abnormal slot 패턴 — `abnormalSlot` prop 또는 `AbnormalDetailsInlineSlot` 구성요소:
  ```bash
  grep -cE "abnormalSlot|AbnormalDetailsInlineSlot|photoSlot" apps/frontend/components/checkouts/EquipmentConditionForm.tsx  # ≥ 1
  ```
- **M-12** 서버 payload 변경 0:
  ```bash
  git diff main apps/frontend/lib/api/checkout-api.ts | grep -E "^[+-]\s*(attachmentIds|CreateConditionCheckDto)"  # = 0
  ```

#### G-7 (oklch 시스템)
- **M-13** brand-color-* 14개 (실측) oklch 형식 (light + dark 동시):
  ```bash
  grep -cE "^\s*--brand-color-(ok|success|warning|critical|info|neutral|purple|repair|temporary|progress|archive|urgent|mute|site-suw|site-uiw|site-pyt):\s*oklch\(" apps/frontend/styles/globals.css  # ≥ 28 (14 × 2)
  ```
- **M-14** WCAG AA 산출물 존재:
  ```bash
  test -f docs/design/oklch-migration-2026-05-12.md
  grep -cE "4\.5:1|3:1|contrast|WCAG.*AA" docs/design/oklch-migration-2026-05-12.md  # ≥ 4
  ```

#### G-8 (rAF 제거)
- **M-15** `requestAnimationFrame` + `setElapsed` 제거 + ref + CSS transition:
  ```bash
  grep -nE "requestAnimationFrame|setElapsed\b" apps/frontend/components/mobile/AutoProgressCountdown.tsx  # = 0
  grep -nE "transition.*stroke-dashoffset|circleRef\.current\.style|circleRef\?\.current" apps/frontend/components/mobile/AutoProgressCountdown.tsx  # ≥ 1
  ```

#### G-9 (StatusBadge memo)
- **M-16** React.memo + displayName:
  ```bash
  grep -cE "React\.memo|^const StatusBadge = memo|StatusBadge\.displayName|memo\(StatusBadgeImpl" apps/frontend/components/ui/StatusBadge.tsx  # ≥ 2
  ```

#### G-10 (drizzle-stub SSOT)
- **M-17** SSOT 파일 + 3 export (select chain / insert chain / update chain SSOT API):
  ```bash
  test -f apps/backend/src/common/__tests__/drizzle-stub.ts
  grep -cE "export function (createDrizzleSelectChain|createDrizzleInsertChain|createDrizzleUpdateChain|createSequentialDrizzleStub|createDrizzleQueryStub|createInsertChain|createUpdateChain)" apps/backend/src/common/__tests__/drizzle-stub.ts  # ≥ 3
  ```
- **M-18** 두 spec import:
  ```bash
  grep -c "drizzle-stub" apps/backend/src/modules/equipment/services/qr-access.service.spec.ts  # ≥ 1
  grep -c "drizzle-stub" apps/backend/src/modules/audit/__tests__/audit.service.spec.ts  # ≥ 1
  ```
- **M-19** 로컬 헬퍼 정의 제거:
  ```bash
  grep -c "^function makeDbStub" apps/backend/src/modules/equipment/services/qr-access.service.spec.ts  # = 0
  ```

#### G-11 (locale safety)
- **M-20** locale-less `toLocaleDateString()` / `toLocaleTimeString()` 0건 (RepairHistoryTimeline ko-KR 하드코딩 allow):
  ```bash
  grep -rnE "toLocaleDateString\(\)|toLocaleTimeString\(\)" apps/frontend/components apps/frontend/app | grep -v "RepairHistoryTimeline.tsx"  # = 0
  ```
- **M-21** HandoverPickerSheet locale 명시:
  ```bash
  grep -nE "useFormatter\(\)|useLocale\(\)|toLocaleDateString\(locale" apps/frontend/components/mobile/HandoverPickerSheet.tsx  # ≥ 1
  ```
- **M-22** verify-hardcoding (또는 verify-i18n) locale 강제 Step 등록:
  ```bash
  grep -cE "toLocaleDateString.*locale|locale safety|RepairHistoryTimeline.*allow" .claude/skills/verify-hardcoding/SKILL.md .claude/skills/verify-i18n/SKILL.md 2>/dev/null  # ≥ 1
  ```

#### G-12 (mini QR 정확도)
- **M-23** 4×4 module grid SVG 또는 16 cell deterministic pattern:
  ```bash
  grep -cE "PREVIEW_QR_PATTERN|module.*grid|4x4|<svg.*viewBox" apps/frontend/components/equipment/EquipmentQRButton.tsx  # ≥ 2
  ```
- **M-24** 3-bar placeholder 제거:
  ```bash
  grep -cE "h-1 w-full rounded bg-foreground/40|h-1 w-3/4 rounded" apps/frontend/components/equipment/EquipmentQRButton.tsx  # = 0
  ```

#### 아키텍처 / a11y / 격리
- **M-25** verify-implementation skill PASS (영역: verify-hardcoding / verify-i18n / verify-design-tokens / verify-frontend-state / verify-handover-qr / verify-security / verify-zod).
- **M-26** review-architecture skill 단일 run — CRITICAL/HIGH 0.
- **M-27** ko/en i18n parity diff = 0:
  ```bash
  node -e "
  const ko = require('./apps/frontend/messages/ko/qr.json');
  const en = require('./apps/frontend/messages/en/qr.json');
  const flat = (o, p = '') => Object.entries(o).flatMap(([k,v]) => typeof v === 'object' && v !== null && !Array.isArray(v) ? flat(v, p + k + '.') : [p + k]);
  const koKeys = new Set(flat(ko));
  const enKeys = new Set(flat(en));
  const diff = [...koKeys].filter(k => !enKeys.has(k)).concat([...enKeys].filter(k => !koKeys.has(k)));
  if (diff.length > 0) { console.error('DIFF', diff); process.exit(1); }
  "
  ```
- **M-28** software-validations 도메인 0 파일 (다른 세션 격리):
  ```bash
  git diff --name-only main | grep -E "modules/software-validations|components/software/"  # = 0
  ```

### 권장 (SHOULD) — tech-debt 등록

- **S-1** `EquipmentConditionForm.test.tsx` RTL — abnormal 항목별 photo upload 시나리오.
- **S-2** `AutoProgressCountdown.test.tsx` RTL — fakeTimers + ref + reduced-motion.
- **S-3** Storybook entry — StatusBadge 8 statuses × tone (S-3 흡수).
- **S-4** oklch fallback 브라우저 검증 — Chrome 110+ / Safari 15.4+ / Firefox 113+.
- **S-5** `RepairHistoryTimeline.tsx` ko-KR 하드코딩 → `useLocale()` 후속.
- **S-6** drizzle-stub SSOT 후속 사용처 발굴 — backend 다른 spec.
- **S-7** DocumentRef SSOT 도입 (G-6 후속, 별도 sprint).
- **S-8** Visual regression snapshot — oklch 색 분리 후 baseline 갱신.

### 적용 verify 스킬

- `verify-hardcoding` (CSS var + locale)
- `verify-i18n` (ko/en parity)
- `verify-design-tokens` (.text-mono SSOT)
- `verify-frontend-state` (mutation 변경 0)
- `verify-handover-qr` (HandoverPickerSheet)
- `verify-security` (RBAC 변경 0)
- `verify-zod` (schema 변경 0)

---

## 종료 조건

- MUST 전체 PASS → completed/ 이동 + tech-debt G-4~G-12 [x].
- 동일 이슈 2회 연속 FAIL → 수동 개입.
- 3회 반복 초과 → 수동 개입.

## Evaluator 절차

1. 빌드 게이트 (M-1 → M-2 → M-3 순)
2. 테스트 (M-4 / M-5)
3. lint (M-6)
4. G-4~G-12 각 grep (M-7~M-24)
5. verify-implementation + review-architecture (M-25 / M-26)
6. i18n parity + 격리 (M-27 / M-28)

## Generator hint

- 순서: Phase 0 → 1 (G-4 + G-10) → 2 (G-5 + G-11) → 3 (G-7 + G-12) → 4 (G-8 + G-9) → 5 (G-6) → 6
- 단계 사이 `pnpm tsc --noEmit`
- `setQueryData` 절대 금지
- 모든 i18n string ko/en 동시
- commit 전 `git status -s` + `git diff --cached --stat` 외부 세션 파일 0
- software-validations 도메인 0 파일

---

*Contract version*: 1 · *Author*: Planner (Mode 2 harness) · *Date*: 2026-05-12
