# Manage-Skills Report — Session Patterns (2026-04-28)

> 생성: 2026-04-28 | 대상 세션: checkout Phase 4 KPI hero/grid 통합 + button focus 통일 + NextStepPanel compact 정책
> 보고서 성격: Report Only — 코드/스킬 파일 미수정. 사용자 승인 후 적용.

---

## 5개 신규 패턴 평가

| # | 패턴 | 현재 커버 스텝 | 커버 적절성 | 권장 조치 |
|---|------|----------------|------------|-----------|
| 1 | Hero priority selection (`selectHeroVariant` + `HERO_PRIORITY` 배열) | verify-ssot **Step 41** | 적절 — inline 분기 탐지 + 단위 테스트 커버리지 강제 | 추가 작업 없음 |
| 2 | Grid 토큰 SSOT + host/skeleton 미러링 (`CHECKOUT_STATS_GRID_TOKENS`) | verify-design-tokens **Step 45** + verify-hardcoding **Step 31** | 적절 — raw grid-cols/col-span 탐지 + 미러링 공유 검증 | 추가 작업 없음 |
| 3 | Atom signature 보존 + host wrapper alertRing 합성 | verify-design-tokens **Step 45** (checkouts 도메인 한정) | **부분 커버** — checkouts 도메인 `alertRing` dead token 방지만. 일반 "host wrapper 정책, atom prop 불변" 원칙은 미등록 | Proposal A 참고 (review-design에 일반 원칙 추가) |
| 4 | Button base cva `focus-visible:outline-2 outline-offset-2 outline-ring` 통일 | (현재 미커버) — Step 2는 `components/ui/` 전체 예외 | **미커버** — button.tsx가 shadcn 예외로 Step 2 탐지 대상 밖. ring-offset-2 + ring-2 패턴 회귀 시 탐지 불가 | Proposal B 참고 (verify-design-tokens 신규 Step) |
| 5 | NextStepPanel compact "행 평면 통합" — elevation/padding 0 정책 | verify-design-tokens **Step 42** (container 클래스 인라인 탐지) | **부분 커버** — 토큰 경유는 강제하지만, 행 안 컴포넌트에 ELEVATION_TOKENS가 들어오는 회귀를 직접 탐지하지 않음 | Proposal C 참고 (verify-design-tokens 신규 Step) |

---

## 상세 분석

### 패턴 1: Hero priority selection — verify-ssot Step 41 ✅ 충분

**근거:**
- `selectHeroVariant` inline 우회 탐지 (`summary.overdue > 0 ? 'overdue' : null` 패턴)
- 단위 테스트 파일 존재 강제 (Phase boundary negative test 포함)
- `HERO_PRIORITY` 배열 확장 패턴은 SSOT 파일 자체가 보장 — verify 별도 불필요

**결론:** 추가 작업 불필요.

---

### 패턴 2: Grid 토큰 SSOT + 미러링 — 이중 커버 ✅ 충분

**verify-design-tokens Step 45 커버:**
- `OutboundCheckoutsTab.tsx` + `HeroKPISkeleton.tsx` 양쪽에서 `getStatsGridClass` import 강제
- raw `grid-cols-N` / `col-span-N` 탐지

**verify-hardcoding Step 31 커버:**
- KPI 영역 raw grid/col-span 직접 사용 0건 검증 (중복 방어선)

**결론:** 추가 작업 불필요.

---

### 패턴 3: Atom signature 보존 + host wrapper alertRing — 부분 커버

**현재 커버 범위 (Step 45):**
- `CHECKOUT_STATS_VARIANTS.hero.alertRing`이 host wrapper에 적용되는지 검증
- dead token (정의만 + 호출 0건) 탐지
- raw `ring-1 ring-brand-critical` 직접 합성 금지 (checkouts 도메인 한정)

**현재 미커버 범위:**
- "atom prop을 변경하지 않고 host wrapper에서 정책을 합성"하는 일반 원칙이 명문화되지 않음
- `dashboard/PendingApprovalCard` 등 다른 도메인이 동일 원칙을 위반할 경우 탐지 없음 (Step 45에 명시적으로 `tech-debt-tracker`로 미루어짐)
- 신규 KPI/카드 atom 추가 시 동일 패턴을 host wrapper에 적용해야 함을 가이드하는 Step 없음

**위험도 평가:** LOW — 현재 위반 사례 없음. 단, 다른 도메인 카드(dashboard)에도 alertRing 패턴이 확산될 경우 일반화 원칙 부재로 인한 인라인 드리프트 위험.

**권장:** Proposal A (review-design 스킬에 원칙 추가, verify Step 신설은 비용 대비 낮음).

---

### 패턴 4: Button base cva outline focus 통일 — 미커버

**문제:**
- `apps/frontend/components/ui/button.tsx`는 verify-design-tokens Step 2의 `focus:ring` 탐지에서 `grep -v "apps/frontend/components/ui/"` 예외로 제외됨
- 현재 button.tsx base cva: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`
- shadcn 기본 재도입 시(`focus-visible:ring-2 ring-offset-2` 패턴) 탐지 불가

**회귀 시나리오:**
1. shadcn/ui 업데이트 후 button.tsx를 덮어씀 → shadcn 기본 `focus-visible:ring-2 ring-offset-2` 재도입
2. 다른 세션에서 button.tsx를 수정 시 focus 패턴 원복

**Step 2 예외 이유:** `components/ui/` 전체가 서드파티 shadcn 코드로 간주. 그러나 button.tsx는 이미 프로젝트 커스텀이 가해진 파일 — 예외에서 button.tsx만 제외하거나 별도 탐지 Step이 필요.

**SURFACE_INLINE_ACTION_TOKENS와의 동기화:** `SURFACE_INLINE_ACTION_TOKENS.base`도 `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-info`로 동일 패턴. 시스템 전체 outline 기반 통일의 핵심 게이트가 button.tsx이므로 보호 필요.

**권장:** Proposal B — verify-design-tokens 신규 Step 46.

---

### 패턴 5: NextStepPanel compact elevation 0 정책 — 부분 커버

**현재 커버 범위 (Step 42):**
- `NEXT_STEP_PANEL_TOKENS.container[variant]` 경유 강제 (variant 인라인 클래스 0건 탐지)
- `satisfies Record` 가드 완전성
- index re-export 체인

**현재 미커버 범위:**
- "행 안 컴포넌트(`variant='compact'`)에 `ELEVATION_TOKENS.*`가 직접 포함되면 안 됨"이라는 **upstream 원칙** 탐지 없음
- 즉 누군가 `workflow-panel.ts`의 `container.compact`에 `ELEVATION_TOKENS.surface.raised`를 추가해도 컴파일 에러 없음 — Step 42는 소비처에서 토큰 경유 여부만 확인, 토큰 내용 자체는 검사 안 함
- 일반 규칙: "행 안 컴포넌트 토큰에 elevation/shadow/rounded이 들어오면 FAIL"을 정의한 Step이 없음

**위험도 평가:** MEDIUM — `workflow-panel.ts` compact 토큰이 "layout-only"임을 주석으로만 표현. 디자인 리뷰 없이 padding/shadow 추가 시 탐지 불가.

**권장:** Proposal C — verify-design-tokens 신규 Step 46 또는 Step 47 (Button Step과 번호 조정).

---

## 권장 신규 Step (제안 — 사용자 승인 후 적용)

### Proposal A: review-design 스킬 — "host wrapper 정책 합성, atom prop 불변" 원칙 추가

**대상 스킬:** `.claude/skills/review-design/SKILL.md`
**추가 위치:** "반복 패턴 / 아키텍처 원칙" 섹션 (신규 항목)

**원칙 내용:**
```
- Atom signature 보존 원칙: alert ring / urgency 강조는 atom prop을 추가하지 않고
  host wrapper에서 isAlert 분기 + 토큰 합성으로 처리.
  `<div className={cn(atomToken, isAlert && alertRingToken)}>` 패턴.
- 위반 탐지: atom 컴포넌트 prop에 `isAlert?: boolean` / `urgency?: string` 등 표시 정책 prop 추가 금지.
  표시 정책은 host(page/tab 레벨)가 소유.
```

**판단 근거:** verify Step으로 만들 만큼 탐지 명령어가 명확하지 않음 (grep으로 "atom에 isAlert prop 없음" 음성 탐지는 false positive 多). review-design의 체크리스트 항목으로 적합.

---

### Proposal B: verify-design-tokens Step 46 — Button base cva ring → outline 회귀 방지

**대상 스킬:** `.claude/skills/verify-design-tokens/SKILL.md`
**Step 번호:** 46 (현재 Step 45 다음)

**내용 초안:**

```markdown
### Step 46: Button base cva `focus-visible:outline-*` 패턴 — ring-offset 회귀 방지 (2026-04-28 추가)

`apps/frontend/components/ui/button.tsx`의 base cva는 shadcn/ui 기본 패턴(`focus-visible:ring-2 ring-offset-2`)에서
outline 기반(`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`)으로 전환됨.
이 파일은 `components/ui/` 예외로 Step 2 탐지에서 제외되므로, 별도 게이트로 보호.

**SURFACE_INLINE_ACTION_TOKENS.base와 동기화 이유:** 두 곳 모두 `focus-visible:outline-2 outline-offset-2` 계열로 시스템 통일.
shadcn 업데이트 또는 다른 세션에서 button.tsx가 원복될 경우 focus 링 두께·색상이 불일치.

**탐지 명령어:**
```bash
# button base cva에 ring-2 ring-offset-2 패턴 잔존 탐지 (FAIL 패턴)
grep -n "focus-visible:ring-2\|ring-offset-2\|focus-visible:ring-offset" \
  apps/frontend/components/ui/button.tsx
# 기대: 0 hits (outline 패턴으로 전환됨)

# 현재 button base cva에 outline 패턴 존재 확인 (PASS 양성 검증)
grep -n "focus-visible:outline-2.*outline-offset-2.*outline-ring" \
  apps/frontend/components/ui/button.tsx
# 기대: 1 hit (base cva string 내 존재)
```

**PASS:**
- `focus-visible:ring-2` / `ring-offset-2` 0건
- `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` 1건 이상

**FAIL:**
- `focus-visible:ring-2 ring-offset-2` 재도입 → 시스템 focus 링 불일치. outline 패턴으로 교체.

**예외:**
- `buttonVariants`의 개별 `variant` 문자열(outline variant, ghost variant 등) — base cva가 아닌 variant별 추가 스타일. base만 검사.
- `ring-offset-ul-midnight` 등 특수 목적 offset override (다른 파일에서 `asChild` 조합 시) — button.tsx 자체만 대상.

**관련 파일:**
- `apps/frontend/components/ui/button.tsx` — base cva (outline focus 전환 파일)
- `apps/frontend/lib/design-tokens/semantic.ts` — `SURFACE_INLINE_ACTION_TOKENS.base` (동일 패턴 SSOT)
```

---

### Proposal C: verify-design-tokens Step 47 — 행 안 panel/atom `compact` 토큰 elevation 0 강제

**대상 스킬:** `.claude/skills/verify-design-tokens/SKILL.md`
**Step 번호:** 47 (Proposal B와 공존)

**내용 초안:**

```markdown
### Step 47: `compact` 컨테이너 토큰 — elevation/shadow/rounded/padding 0 원칙 (2026-04-28 추가)

**원칙:** `variant="compact"` (행 Zone 4 등 행 평면 통합) 컨테이너 토큰에는
`ELEVATION_TOKENS.*`, `rounded-*`, `p-N` (layout spacing이 아닌 surface padding) 이 포함되어서는 안 됨.
행 안 컴포넌트는 host row의 bounding box를 존중해야 하며, 독립 elevation을 만들면 행 평면이 깨짐.

**탐지 대상:** `workflow-panel.ts`의 `container.compact` 토큰 정의.
(향후 다른 도메인 토큰 파일에 `compact` 키 추가 시 동일 기준 적용)

**탐지 명령어:**
```bash
# compact 컨테이너 토큰에 elevation/shadow/rounded/padding 포함 탐지
# workflow-panel.ts compact: 정의 라인 추출 후 금지 클래스 검색
COMPACT_LINE=$(grep -n "compact:" apps/frontend/lib/design-tokens/components/workflow-panel.ts | grep "container\|compact:" | head -1 | cut -d: -f1)
if [ -n "$COMPACT_LINE" ]; then
  sed -n "${COMPACT_LINE}p" apps/frontend/lib/design-tokens/components/workflow-panel.ts \
    | grep -E "rounded-[a-z]|shadow-|p-[0-9]|ELEVATION_TOKENS|bg-" \
    | grep -v "gap-"
fi
# 기대: 0 hits (layout-only: inline-flex flex-col gap-0.5)

# 다른 Layer 3 파일에도 compact 키 확인 (일반화 대비)
grep -rn "compact:.*ELEVATION_TOKENS\|compact:.*rounded-\|compact:.*shadow-\|compact:.*p-[0-9]" \
  apps/frontend/lib/design-tokens/components/ --include="*.ts"
# 기대: 0 hits
```

**PASS:**
- `container.compact` 토큰에 elevation/shadow/rounded/surface-padding 클래스 0건
- layout 전용 클래스(`inline-flex`, `flex-col`, `gap-*`)만 포함

**FAIL:**
- `container.compact`에 `ELEVATION_TOKENS.surface.*` 추가 → 행 평면 이탈 (시각 회귀)
- `rounded-*` 추가 → host row와 중첩 radius 발생
- `p-N` (surface padding, `gap-`이 아닌 padding) 추가 → Zone 4 내부 공간 충돌

**예외:**
- `gap-*` (자식 요소 간 간격) — layout 목적, 허용
- `w-*` / `h-*` / `min-w-*` — 폭/높이 제약, 허용
- `overflow-*` / `text-*` / `font-*` — 텍스트 정책, 허용

**관련 파일:**
- `apps/frontend/lib/design-tokens/components/workflow-panel.ts` — `container.compact` 정의 (`inline-flex flex-col gap-0.5`)
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — `NextStepPanel variant="compact"` 사용처
- `apps/frontend/components/shared/NextStepPanel.tsx` — compact container 소비처
```

---

## CLAUDE.md / skills-index.md 갱신 필요 여부

### CLAUDE.md: 불필요

- "Verify skills (19)" 카운트와 목록은 신규 스킬 생성 시에만 갱신 필요.
- Proposal A(review-design 원칙 추가), B(Step 46), C(Step 47)은 모두 기존 스킬 내부 수정이므로 CLAUDE.md 갱신 불필요.

### skills-index.md: 불필요

- verify-design-tokens, verify-ssot의 한줄 요약은 Step 추가로 바뀌지 않음.
- `docs/references/skills-index.md`는 스킬 단위 설명만 포함 — Step 세부 내용은 SKILL.md에 위임.

---

## 적용 우선순위 및 권고

| Proposal | 위험도 | 구현 복잡도 | 우선순위 | 적용 결정 기준 |
|----------|--------|------------|---------|----------------|
| **A** (review-design 원칙) | LOW | 낮음 (텍스트 추가) | 낮음 | button.tsx 이외 도메인에 alertRing 패턴 도입 시 진행 |
| **B** (button outline focus Step 46) | MEDIUM | 낮음 (grep 2줄) | **즉시 권장** | shadcn 업데이트 가능성 + 회귀 비용 비교 시 즉시 추가 타당 |
| **C** (compact elevation 0 Step 47) | MEDIUM | 낮음 (grep 간단) | **즉시 권장** | workflow-panel.ts 변경 빈도 낮지만 위반 시 시각 회귀 심각 |

**권고 순서:** B → C → A (B와 C는 같은 스킬 파일을 수정하므로 동시 적용 효율적)

---

## 요약

| # | 패턴 | 결론 |
|---|------|------|
| 1 | Hero priority selection | verify-ssot Step 41 ✅ 충분 — 추가 작업 불필요 |
| 2 | Grid 토큰 SSOT + 미러링 | Step 45 + Step 31 ✅ 충분 — 추가 작업 불필요 |
| 3 | Atom signature 보존 + host alertRing | Proposal A — review-design 원칙 추가 (낮은 우선순위) |
| 4 | Button outline focus 통일 | **Proposal B** — verify-design-tokens Step 46 신규 (즉시 권장) |
| 5 | compact elevation 0 정책 | **Proposal C** — verify-design-tokens Step 47 신규 (즉시 권장) |
