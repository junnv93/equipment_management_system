# 반출입 Phase 4 (P1-1) 완료 + 후속 fix — 세션 핸드오프 (2026-04-28)

> 다음 세션 시작 시 이 문서를 먼저 읽어주세요.
> Phase 4 P1-1 (KPI 1-hero + 3-mini) 완료 + button focus indicator + NextStepPanel compact glow 후속 fix 모두 처리.
> 다음 세션은 **Phase 4.5 (디자인 정합성 GAP 5건 + verify-design-tokens 회귀 가드 2건)** 진행 권장.

## 세션 결과 요약

| 영역 | 상태 |
|---|---|
| Phase 4 (P1-1 KPI 1-hero + 3-mini) | ✅ 완료 — selectHeroVariant SSOT + grid 토큰 + alertRing wrapper + a11y |
| Button focus indicator 통일 | ✅ 완료 — shadcn ring → outline-ring (a11y 보존, glow 차단) |
| NextStepPanel compact "외곽 사각형" 효과 제거 | ✅ 완료 — padding/shadow cut → layout-only (`inline-flex flex-col gap-0.5`) |
| aria-current 비표준 사용 제거 | ✅ 완료 — alertRing + label + aria-pressed로 강조 신호 충분 |
| verify-* skill 신규 Step 3건 | ✅ 완료 — verify-ssot Step 41 + verify-hardcoding Step 31 + verify-design-tokens Step 45 |
| tsc / build / 단위 테스트 | ✅ 0 errors / build PASS / 6/6 PASS |

## 본 세션 commit (4건)

| Commit | 핵심 |
|---|---|
| `4a788493` | Phase 4 P1-1 — selectHeroVariant SSOT + grid 토큰 + 호스트 통합 + 검증 게이트 |
| `71fc8e27` | Button focus glow → outline-ring 전환 (시스템 1076 호출처 영향) |
| `27f6fad9` | (병렬 세션) 사이드바 wrench → UL 로고 SVG (lint-staged 부산물 — 본 세션 책임 외) |
| `d1e6a513` | NextStepPanel compact padding/shadow 0 — "외곽 사각형 glow" 제거 (DashboardShell + ul-logo lint-staged 부산물 동반) |

추가로 본 핸드오프 commit에서 aria-current 제거 + 핸드오프 문서 commit 예정.

## 22-항목 매트릭스 진행 상황 (Phase 4 완료 후)

| # | 항목 | 상태 | Phase |
|---|---|---|---|
| 1 | P0-1 진행 stepper 통합 | ✅ 완료 | Phase 1 |
| 2 | P0-2 단계명 줄바꿈 (`label-ko`) | ✅ 완료 | Phase 0 + 1 |
| 3 | P0-3 inline-action soft-tint | ✅ 완료 | Phase 3 |
| 4 | **P1-1 KPI 1-hero + 3-mini** | **✅ 완료** | **Phase 4** |
| 5 | P1-2 알림 단일 노출 | ⏳ 대기 | **Phase 5** |
| 6 | P1-3 필터 legend 분리 + chip | ⏳ 대기 | Phase 6 |
| 7 | P1-4 반입 3-section | ⏳ 대기 | Phase 7 |
| 8 | P1-5 탭 ↑/↓ + 부제 | ⏳ 대기 | Phase 8 |
| 9 | P1-6 결재선 "내 차례" | ⏳ 대기 | Phase 9 |
| 10 | P1-7 그룹 일괄 액션 | ⏳ 대기 | Phase 12 |
| 11~22 | 토큰/UI 보강 | (Phase 0/1/3에서 완료, 나머지 후속) |

**완료 8/22 (P0 3건 + P1-1 + 토큰 4건) + 의도적 비채택 1 + 대기 13.**

## Phase 4 시니어 원칙 적용 결과 (4-axis)

| 축 | 결과 |
|---|---|
| **SSOT** | `selectHeroVariant`(hero 우선순위) + `CHECKOUT_STATS_GRID_TOKENS`(grid) + `containerInGrid`(hero col-span) + `hero.alertRing`(alert 시각) — 4-축 단일 위치 |
| **하드코딩 0** | OutboundCheckoutsTab + HeroKPISkeleton 양쪽 raw `col-span-N`/`grid-cols-N`/`ring-*` 0건 |
| **워크플로/성능** | `useStatCards` useMemo, `selectHeroVariant` useMemo, `handleStatActivate` useCallback (referential stability) |
| **접근성** | `aria-pressed`(필터 토글) + onKeyDown Enter/Space + alertRing(색상 + ring weight 이중 신호) — `aria-current="true"` 비표준 제거 |
| **i18n** | 신규 키 0건 (기존 `outbound.overdue` 재사용), ko/en parity 보장 |
| **다크모드** | `bg-card` + `ELEVATION_TOKENS.surface.floating` + `text-brand-critical` + `ring-brand-critical/20` 모두 semantic — 자동 전환 |
| **검증 게이트** | verify-ssot Step 41 + verify-hardcoding Step 31 + verify-design-tokens Step 45 — 회귀 자동 차단 |

## 다음 세션 — Phase 4.5 (디자인 정합성 GAP 보정 + verify 가드 보강)

### 0. 시작 시 필수 확인 (3분)

```bash
# 1. 본 세션 commit 4건 확인
git log --oneline -7
# 기대: d1e6a513 (compact glow) / 27f6fad9 (UL 로고) / 71fc8e27 (button focus) / 4a788493 (Phase 4)

# 2. 본 세션 변경 파일 dirty 0
git status -s
# 기대: 깔끔 (또는 다른 세션 inflight만)

# 3. tsc / build 0 errors 확인
cd apps/frontend && pnpm exec tsc --noEmit; echo "EXIT: $?"
pnpm --filter @equipment-management/shared-constants build
# 기대: EXIT 0
```

### 1. 와이어프레임 매칭 GAP 5건 (`.claude/evaluations/session-2026-04-28-wireframe-match.md` 전체 읽기)

본 세션 매칭률 ~72%. 다음 세션에서 GAP 5건 보정:

| GAP | 중요도 | 현재 구현 | wireframe 사양 | 처리 방향 |
|---|---|---|---|---|
| **GAP-1** | MEDIUM | `hero.surface = 'bg-card ${ELEVATION_TOKENS.surface.floating}'` | `bg-gradient-to-b from-brand-critical/[0.04] to-brand-critical/[0.02]` | `CHECKOUT_STATS_VARIANTS.hero.surface`에 isAlert 분기 토큰 추가 |
| **GAP-2** | LOW | `hero.label = TYPOGRAPHY_TOKENS.kpiLabel` (text-muted-foreground 톤) | `color: brand-critical` | `hero.labelAlert: 'text-brand-critical'` 신설 + isAlert 시 합성 |
| **GAP-3** | LOW | HeroKPI atom에 badge slot 없음 | 우측 상단 `badge-danger "우선"` | `HeroKPI` atom에 `badge?: ReactNode` slot 추가 (atom signature 변경 boundary 확장 결정 필요) |
| **GAP-4** | MEDIUM | `sm:grid-cols-6` + hero `sm:col-span-3` → mini 4개 = 7칸 → 1개 orphan | `sm:grid-cols-5` + hero `sm:col-span-2` (mini 3개 정확) | `CHECKOUT_STATS_GRID_TOKENS.withHero` sm 분기 변경 |
| **GAP-7** | MINOR | `aria-current="true"` 부착 (비표준) | (제거) | **본 세션에서 처리 완료 — Phase 4.5 X** |

### 2. verify-design-tokens Step 46/47 신규 가드 (`.claude/evaluations/session-2026-04-28-manage-skills.md` 전체 읽기)

본 세션이 도입한 패턴 2건이 회귀 차단 게이트 부재 — 다음 세션 즉시 추가 권장:

| Proposal | 패턴 | 설명 |
|---|---|---|
| **B (Step 46)** | Button base cva ring → outline 통일 회귀 차단 | `apps/frontend/components/ui/button.tsx`의 base에서 `focus-visible:ring-*` 패턴 발견 시 fail. shadcn 업데이트로 덮어쓰기 회귀 방지 |
| **C (Step 47)** | "행 안 panel/atom" elevation 0 정책 | `NEXT_STEP_PANEL_TOKENS.container.compact`에 `ELEVATION_TOKENS.surface.*` 또는 `shadow-*` 패턴 발견 시 fail. 행 평면 통합 정책 보존 |

### 3. SHOULD-2 후속 (verify-implementation 보고)

- **handlePageChange / handleSubTabChange useCallback 미적용** — 현재 소비처(`CheckoutSubTabBar`) memo 없으므로 MUST는 아니지만, 향후 memo 도입 시 회귀 위험. 방어적 적용 권장 (1줄 추가).

### 4. Phase 4 외 별도 PR 항목 (이미 tech-debt-tracker에 등록)

- dashboard `PendingApprovalCard` raw alertRing 2건 → 토큰화 PR
- HeroKPI atom React.memo 적용
- Phase 4.6: SparklineMini trend API + 실데이터 연결
- Phase 5: pending hero 승격 + P1-2 알림 단일 노출
- Phase 3 잔여 W-2/W-3/W-5
- 7건 외부 디자인 리뷰 핸드오프 debt
- (신규 발견) `verify-hardcoding/SKILL.md` Step 30 중복 정의 (570/702 line)

### 5. lint-staged 부산물 정리 (병렬 세션 결과)

본 세션 commit에 다른 세션 inflight 파일 2건 동반 commit됨:
- `apps/frontend/components/layout/DashboardShell.tsx` (UL 로고 교체)
- `apps/frontend/lib/brand-assets/ul-logo.tsx` (신규)

다음 세션이 이 변경 의도와 commit 메시지가 정합한지 검토 필요. 사용자 메모리 `feedback_lintstaged_other_session_files.md`에 따라 revert 금지.

## 다음 세션 권장 시작 멘트

> "Phase 4 완료 핸드오프 확인. `.claude/evaluations/checkouts-phase4-completion-handoff-2026-04-28.md` + `session-2026-04-28-{verify-implementation,manage-skills,wireframe-match}.md` 읽기.
> Phase 4.5 (와이어프레임 GAP 5건 + verify Step 46/47) 진행. GAP-1/4가 MEDIUM이라 우선. GAP-3 'HeroKPI badge slot'은 atom signature 변경이라 boundary 결정 필요 — Phase 4 plan/contract 수정 후 진행 vs Phase 4.6 분리.
> verify-design-tokens Step 46/47 신규 추가는 본 세션에서 도입한 패턴 회귀 차단 — 즉시 적용 권장.
> SHOULD-2 (useCallback 방어적 적용)는 1줄 fix.
> 시니어 원칙(SSOT/하드코딩 0/워크플로/성능/접근성, 단편적 임시방편 금지) 일관 적용. /harness Mode 1 또는 직접 처리."

## 핵심 참조 파일

| 파일 | 용도 |
|---|---|
| `/mnt/c/Users/kmjkd/Downloads/반출입페이지/REVIEW_RESULT.md` | 사양 SSOT (P1-1 line 107-109 + §4 토큰) |
| `/mnt/c/Users/kmjkd/Downloads/반출입페이지/01_list_recommended.html` | KPI 영역 wireframe — GAP 매칭 검증용 |
| `/mnt/c/Users/kmjkd/Downloads/반출입페이지/_shared.css` | wireframe 토큰 — gradient/elevation 사양 |
| `apps/frontend/lib/utils/checkout-hero-selector.ts` | hero priority SSOT (Phase 5 확장 포인트) |
| `apps/frontend/lib/design-tokens/components/checkout.ts` | hero/grid 토큰 (`CHECKOUT_STATS_VARIANTS.hero` + `CHECKOUT_STATS_GRID_TOKENS`) |
| `apps/frontend/components/checkouts/HeroKPI.tsx` | atom (Phase 4.5에서 badge slot 추가 가능) |
| `apps/frontend/lib/design-tokens/components/workflow-panel.ts` | NextStepPanel 토큰 (compact는 layout-only) |
| `apps/frontend/components/ui/button.tsx` | shadcn Button — base focus-visible:outline-ring |
| `.claude/evaluations/session-2026-04-28-verify-implementation.md` | verify 결과 (PASS, SHOULD 2) |
| `.claude/evaluations/session-2026-04-28-manage-skills.md` | skill 강화 제안 (Step 46/47) |
| `.claude/evaluations/session-2026-04-28-wireframe-match.md` | wireframe GAP 5건 상세 |

## 사용자 정책 재확인

- **Main 직접 작업, 브랜치 금지** — 1인 trunk-based, pre-push hook 게이트
- **lint-staged**: 다른 세션 파일 보존 (revert 금지). 본 세션도 부산물 2건 동반.
- **시니어 아키텍처 수준** — 단편적 임시방편 금지, SSOT 준수, 하드코딩 0, 워크플로/성능/접근성 고려
- **타협 없이 100% 일치** — wireframe과 REVIEW_RESULT.md 정확 복제 (GAP 5건 식별됨 → Phase 4.5 후속)
- **세션 정리 시 자동 커밋** — 본 세션 완료 (push는 별도 요청 시)
- **공식 문서/업계 표준 우선** — aria-current 비표준 사용 제거 (ARIA 1.2 표준 부합)

## 검증 인프라 상태 (Phase 4 게이트)

본 세션이 추가한 verify-* Step 3건은 Phase 4 패턴 회귀 차단:

| Skill | Step | 차단 패턴 |
|---|---|---|
| verify-ssot | Step 41 | `summary.overdue > 0 ?` 같은 inline hero 분기 (selectHeroVariant 우회) |
| verify-hardcoding | Step 31 | checkouts KPI 영역 raw `grid-cols-N` / `col-span-N` |
| verify-design-tokens | Step 45 | `containerInGrid` 미적용 + `alertRing` 미사용 dead token + raw `ring-*` |

**다음 세션 추가 예정 (Proposal B/C)**:
- verify-design-tokens Step 46: button base cva ring 패턴 회귀 차단
- verify-design-tokens Step 47: `container.compact` elevation/shadow 회귀 차단
