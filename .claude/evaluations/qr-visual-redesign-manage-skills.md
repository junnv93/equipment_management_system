# manage-skills: qr-visual-redesign Sprint Closure

**날짜**: 2026-05-12  
**스프린트**: refactor/qr-visual-redesign → main (commit 99d61436)  
**분석 대상**: 8 TASK + 12 갭 (G-1~G-12)

---

## 1. 식별 패턴 13건

| # | 패턴 | 파일 | 회귀 위험 |
|---|------|------|----------|
| P-1 | `EQUIPMENT_STATUS_TONE` `Record<EquipmentStatus, EquipmentStatusTone>` exhaustive SSOT | `packages/shared-constants/src/equipment-status-tone.ts` | HIGH — 새 status 추가 시 매핑 누락 |
| P-2 | `QR_ACTION_GROUP` + `QR_ACTION_GROUP_ORDER` SSOT (그룹 렌더링 분기) | `packages/shared-constants/src/qr-access.ts` | MED — 인라인 분기 복귀 |
| P-3 | `HandoverItem` Zod schema + `handovers: HandoverItem[]` 다중 응답 | `packages/schemas/src/qr-handover.ts` | MED — 단일 `handoverCheckoutId` 패턴 부활 |
| P-4 | `TONE_TO_SEMANTIC` 어댑터 (`warn` → `warning` 매핑, `StatusBadge` 내부) | `apps/frontend/components/ui/StatusBadge.tsx` | HIGH — inline switch 복귀 |
| P-5 | CSS_VAR_NAMES 9 신규 엔트리 (brand-urgent/mute + touch-target + text-mobile + text-mono) | `apps/frontend/lib/design-tokens/css-variables.ts` | LOW — verify-hardcoding Step 36 awk 동적 커버 |
| P-6 | `.text-mono` 유틸리티 class (font-mono tabular-nums + --text-mono) | `apps/frontend/styles/globals.css` | LOW — 단일 파일 패턴 |
| P-7 | `AutoProgressCountdown` SSR-safe `useReducedMotion` (useState+useEffect 패턴) | `apps/frontend/components/mobile/AutoProgressCountdown.tsx` | MED — SSR-unsafe matchMedia 직접 접근 복귀 |
| P-8 | `StepperHeader` `CONDITION_CHECK_STEP_VALUES` SSOT 소비 (인라인 4-step 배열 금지) | `apps/frontend/components/checkouts/StepperHeader.tsx` | MED — FSM step 추가 시 drift |
| P-9 | `documentApi.deleteOrphan` + `submittedRef` orphan cleanup 3-piece 패턴 | `components/checkouts/EquipmentConditionForm.tsx`, `ReturnInspectionForm.tsx` | MED — cleanup 누락 시 orphan 누적 |
| P-10 | `LABEL_SIZE_PRESETS.recommendedForKey` i18n SSOT (7 preset → i18n catalog parity) | `packages/shared-constants/src/qr-config.ts` | MED — 신규 preset 추가 시 i18n 누락 |
| P-11 | backend `resolveHandoverActions` drizzle leftJoin + condition_check 다중 row 매핑 | `apps/backend/src/modules/equipment/services/qr-access.service.ts` | LOW — 아키텍처 패턴 (회귀 위험 낮음) |
| P-12 | Cherry-pick `-n` + `git restore --staged --worktree` 분리 패턴 (G-3 closure) | 운영 절차 | LOW — memory feedback 적합 |
| P-13 | `BRAND_CLASS_MATRIX` `urgent`/`mute` 신규 2 시멘틱 키 (BRAND_COLORS_HEX 3곳 동시 갱신 규칙) | `apps/frontend/lib/design-tokens/brand.ts` | LOW — verify-design-tokens Step 20 자동 커버 |

---

## 2. 기존 스킬 커버리지 매핑

| 패턴 | 기존 커버 | 판정 |
|------|----------|------|
| P-1 EQUIPMENT_STATUS_TONE | verify-ssot: 미등록 | **GAP** |
| P-2 QR_ACTION_GROUP | verify-handover-qr: 미등록 | **GAP** |
| P-3 HandoverItem schema | verify-handover-qr: 미등록 | **GAP** |
| P-4 TONE_TO_SEMANTIC (P-1과 연계) | verify-ssot Step 62 에 통합 | **Step 62로 처리** |
| P-5 CSS_VAR_NAMES 9 엔트리 | verify-hardcoding Step 36 awk 동적 추출로 자동 커버 | **자동 커버** |
| P-6 .text-mono | 단일 globals.css 패턴, 회귀 위험 낮음 | **over-engineering 회피** |
| P-7 useReducedMotion SSR-safe | verify-frontend-state: 미등록 | **GAP** |
| P-8 StepperHeader SSOT 소비 | verify-checkout-fsm: 미등록 | **GAP** |
| P-9 orphan cleanup | verify-frontend-state: 미등록 | **GAP** |
| P-10 recommendedForKey parity | verify-handover-qr Step 4 (재정의 탐지만, parity 미검증) | **GAP** |
| P-11 resolveHandoverActions | 아키텍처 패턴, 단일 서비스 내부 구현 | **over-engineering 회피** |
| P-12 Cherry-pick split | memory feedback 적합 | **memory append** |
| P-13 BRAND_CLASS_MATRIX urgent/mute | verify-design-tokens Step 20 (3곳 동시 갱신 규칙 자동 커버) | **자동 커버** |

---

## 3. 즉시 적용 변경 (5개 스킬 파일)

| 파일 | 변경 내용 |
|------|----------|
| `.claude/skills/verify-ssot/SKILL.md` | Step 62 신설: `EQUIPMENT_STATUS_TONE` exhaustive Record + `TONE_TO_SEMANTIC` StatusBadge 소비 회귀 차단 |
| `.claude/skills/verify-handover-qr/SKILL.md` | Step 16 신설: `QR_ACTION_GROUP`/`QR_ACTION_GROUP_ORDER` SSOT 소비; Step 17: `HandoverItem` Zod schema 다중 핸드오버 SSOT; Step 18: `LABEL_SIZE_PRESETS.recommendedForKey` i18n parity (+ Output Format 테이블 3행 추가) |
| `.claude/skills/verify-frontend-state/SKILL.md` | Step 47 신설: `submittedRef`+`deleteOrphan` orphan cleanup 3-piece 패턴; Step 48: SSR-safe `useReducedMotion` matchMedia guard |
| `.claude/skills/verify-checkout-fsm/SKILL.md` | Step 53 신설: `StepperHeader` `CONDITION_CHECK_STEP_VALUES` SSOT 소비 — 인라인 4-step 배열 금지 (+ Output Format 테이블 1행 추가) |
| `.claude/skills/manage-skills/SKILL.md` | verify-ssot / verify-frontend-state / verify-handover-qr / verify-checkout-fsm 4개 스킬 테이블 한줄 요약 갱신 |

---

## 4. Memory Feedback 추가

| 파일 | 내용 |
|------|------|
| `memory/feedback_cherry_pick_split.md` (신규) | `git cherry-pick -n` + `git restore --staged --worktree` 분리 패턴 — 혼합 커밋에서 내 파일만 분리하는 표준 절차 (G-3 closure 학습) |

---

## 5. Over-engineering 회피 결정

| 패턴 | 회피 사유 |
|------|----------|
| P-5 CSS_VAR_NAMES 9 신규 엔트리 | verify-hardcoding Step 36 awk 동적 추출이 신규 엔트리 자동 포함 — 별도 Step 불필요 |
| P-6 `.text-mono` 유틸리티 class | 단일 globals.css 정의 + 컴포넌트 직접 className 적용, 회귀 위험 0 — verify 불필요 |
| P-11 resolveHandoverActions drizzle leftJoin 패턴 | 단일 서비스 내부 구현 세부사항, 도메인 wrapper 신설 패턴 아님 — 아키텍처 기록으로 충분 |
| P-13 BRAND_CLASS_MATRIX urgent/mute | verify-design-tokens Step 20 `satisfies Record<SemanticColorKey, BrandClassSet>` 컴파일타임 강제 + 3곳 동시 갱신 규칙이 신규 키에 자동 적용 — 별도 Step 불필요 |

---

## 6. 신규 Skill 신설 권고

없음 — 모든 갭이 기존 verify-* 스킬 Step 추가로 처리 가능. 새 도메인 wrapper 신설 패턴 없음.

---

*Generated: 2026-05-12, qr-visual-redesign sprint closure*
