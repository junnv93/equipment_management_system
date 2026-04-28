# Manage-Skills — Phase 4.5

> 생성: 2026-04-28 | 검증자: Claude Sonnet 4.6 (background agent — Write 권한 부족으로 메인 컨텍스트가 보관)
> 대상 세션: checkouts Phase 4.5 (wireframe GAP 보정 + verify-design-tokens Step 46/47 + B/C/D 보강 cycle)

---

## Pattern coverage matrix

| # | Pattern | Coverage | Risk | Recommendation |
|---|---------|----------|------|----------------|
| 1 | `Partial<Record<SemanticColorKey, string>>` 오버라이드 + 폴백 | PARTIAL | LOW | 신규 Step 불필요. Step 45 extension이 dead-token은 이미 커버 |
| 2 | aria-label ICU 인터폴레이션 + 시각 배지 `aria-hidden` 조합 | PARTIAL | LOW-MED | 신규 Step 불필요. Step 16 + Step 5 조합으로 충분 |
| 3 | 토큰 정의 시점 헬퍼 호출 (`getSemanticContainerTextClasses` at definition time) | FULL | N/A | Step 22(JIT 보간 금지)의 올바른 반대 패턴으로 이미 커버됨 |
| 4 | 선택적 atom prop 슬롯 (`badge?: ReactNode`) | NONE | LOW | 범용 React/TypeScript 언어 패턴. verify Step 불필요 |
| 5 | 자기 검증 grep word-boundary 교정 (`\bp-[0-9]` false positive 방지) | FULL | N/A | Step 47이 이미 `\b` 적용. manage-skills 가이드라인 추가 권고(LOW) |

---

## 상세 분석

### Pattern 1 — `Partial<Record<SemanticColorKey, string>>` 오버라이드

`CHECKOUT_STATS_VARIANTS.hero.surfaceVariant/labelVariant`가 `as Partial<Record<SemanticColorKey, string>>`로 선언됨.

- Step 45 extension이 `surfaceVariant`, `labelVariant`, `priorityBadge` 세 토큰의 소비처 ≥ 1건을 이미 검증 (실행 결과: 각 1 hit, PASS)
- `Partial<>` 패턴은 "선택적 오버라이드" 의도로 TypeScript가 undefined 반환을 허용 — HeroKPI atom 내부의 `|| tokens.surface` 폴백이 이미 방어함
- 폴백 없는 직접 사용이 신규 도입될 위험도는 1건 사용처 + 코드 리뷰로 충분히 차단 가능
- **신규 Step 불필요**

### Pattern 2 — aria-label i18n ICU 인터폴레이션

`t('outbound.priorityHeroAriaLabel', { label: t(card.labelKey) })` 패턴이 코드베이스 전역 20+ 건 이미 존재 (PendingApprovalCard, EquipmentTabs 등).

- verify-i18n Step 16(call-sites)이 키 존재를 검증하고, Step 5(INFO)가 ICU 변수명 en/ko 동기화를 확인함
- 실제 en/ko 파일 확인: `priorityBadge`, `priorityHeroAriaLabel` 양쪽 모두 496-497 라인 존재, `{label}` 인터폴레이션 변수 동일함 — PASS
- **신규 Step 불필요**

### Pattern 3 — 토큰 정의 시점 헬퍼 호출

`labelVariant.critical: getSemanticContainerTextClasses('critical')` — 모듈 초기화 시점 정적 클래스 계산.

- Step 22의 "JIT 동적 보간 금지" 규칙의 올바른 반대 패턴
- 기존 코드베이스에 `CHECKOUT_MINI_PROGRESS.special`, `CONDITION_COMPARISON_TOKENS` 등 동일 패턴 10+ 건
- **완전 커버됨**

### Pattern 4 — 선택적 atom prop 슬롯

`badge?: ReactNode` — TypeScript `?` 선택적 속성으로 컴파일 타임 완전 보장. 범용 React 패턴, verify 스킬 게이트 대상 아님.

- **신규 Step 불필요**

### Pattern 5 — word-boundary grep 교정

Step 47 탐지 명령어에 `\bp-[0-9]` 패턴 사용으로 `gap-0.5` substring false positive 방지.

- 현재 코드베이스 PASS 상태 실증 완료: `compact: 'inline-flex flex-col gap-0.5'` — 금지 클래스 0건
- **완전 커버됨**

---

## Proposals

### Proposal 1 (LOW 우선순위) — manage-skills SKILL.md grep word-boundary 가이드라인

신규 verify Step 작성 시 알파뉴메릭 suffix Tailwind 클래스(`p-[0-9]`, `rounded-[a-z]`) 탐지 grep에 `\b` word-boundary 사용 권고를 manage-skills 체크리스트에 추가.

- 대상 파일: `.claude/skills/manage-skills/SKILL.md`
- 긴급 아님, 다음 manage-skills 수정 세션에 병행 권장
- 동기: 본 세션이 Step 47 작성 직후 self-verify로 false positive 발견 → word-boundary 즉시 수정. 이 학습을 manage-skills 체크리스트에 표면화하면 다음 verify Step 신설 시 동일 함정 회피.

---

## 이미 반영된 업데이트 (세션 내 완료)

**verify-design-tokens Step 45 extension** — Phase 4.5 신규 hero 토큰 dead-token 검사가 이미 SKILL.md에 반영됨:

```bash
for token in "surfaceVariant" "labelVariant" "priorityBadge"; do
  hits=$(grep -rn "tokens\.${token}\|hero\.${token}\|heroTokens\.${token}" \
    apps/frontend/app apps/frontend/components | wc -l)
  echo "${token}: ${hits} hits (expected ≥ 1)"
done
# 실행 결과: 각 1 hits (PASS) — HeroKPI.tsx/OutboundCheckoutsTab.tsx에서 소비됨
```

---

## CLAUDE.md / skills-index.md 업데이트 필요 여부

**불필요.** 신규 스킬 파일 생성 없음. verify-design-tokens Step 45 extension은 세션 내 이미 반영됨.

---

## 결론 요약

| 항목 | 결과 |
|------|------|
| 신규 스킬 생성 | **0건** |
| 기존 스킬 업데이트 | **1건** (verify-design-tokens Step 45 extension — 세션 내 이미 반영) |
| 제안 사항 | **1건** (manage-skills word-boundary 가이드라인 — LOW 우선순위, tech-debt-tracker 등록) |

5개 패턴 중 신규 verify Step이 필요한 패턴은 없습니다. Pattern 1/2의 PARTIAL은 기존 Step들의 조합으로 충분히 커버되며, 신규 도입 위험도가 낮아 over-engineering 회피.
