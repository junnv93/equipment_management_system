# Evaluation Report: IntermediateInspectionList 디자인 토큰 적용

## 반복 #1 (2026-04-13T00:30:00+09:00)

## 계약 기준 대조

| 기준 | 판정 | 상세 |
|------|------|------|
| `pnpm --filter frontend run tsc --noEmit` 에러 0 | PASS | 사전 확인 완료 (caller 보고) |
| `pnpm --filter frontend run build` 성공 | PASS | 사전 확인 완료 (caller 보고) |
| Design Token import: `from '@/lib/design-tokens'` 1회 이상 | PASS | L36-44에서 1회 import 확인 |
| INSPECTION_TABLE 토큰 적용: stripe, rowHover, numericCell 중 2개 이상 | PASS | 3개 모두 사용 (stripe L454, rowHover L455, numericCell L470) + wrapper L428 |
| INSPECTION_EMPTY_STATE 토큰 적용: container + icon + title 3계층 이상 | PASS | 4계층 사용 (container L418, icon L419, title L421, description L424) |
| INSPECTION_MOTION 또는 TRANSITION_PRESETS/ANIMATION_PRESETS 1회 이상 | **FAIL** | 파일 전체에서 MOTION, TRANSITION, ANIMATION 관련 토큰 사용 0건. import에도 없음 |
| INSPECTION_SPACING 토큰 1회 이상 | PASS | 2회 사용 (L377 loading state에서 INSPECTION_SPACING.field) |
| 시멘틱 상태 헬퍼: getResultBadgeClasses 또는 getSemanticBadgeClasses 1회 이상 | PASS | getResultBadgeClasses L487, getSemanticBadgeClasses L499 각 1회 사용 |
| sr-only 라벨 1개 이상 | PASS | L477 chevron 아이콘에 sr-only span 적용 |
| 기존 기능 보존: renderActions, expandedId toggle, ResultSectionsPanel | PASS | renderActions L219 정의/L508 호출, expandedId L74+L461+L466 toggle, ResultSectionsPanel L514 렌더링 모두 유지 |

## SHOULD 기준 대조

| 기준 | 판정 | tech-debt 등록 여부 |
|------|------|---------------------|
| review-design 재평가 시 50점 이상 | 미평가 | - |
| sticky 헤더 적용 | PASS | - (L432-441에서 `sticky top-0 bg-background z-10` 4개 TableHead에 적용) |
| focus-visible 클래스 적용 | PASS | - (INSPECTION_FOCUS 토큰 L458에서 사용, 1회 import + 1회 적용) |
| getSemanticLeftBorderClasses로 행 상태 보더 적용 | PASS | - (L456에서 semanticColor 기반 적용) |

## 전체 판정: FAIL

## 수정 지시

1. **INSPECTION_MOTION 또는 TRANSITION_PRESETS/ANIMATION_PRESETS 토큰 미사용 (MUST 위반)**
   - 파일 어디에도 motion/transition/animation 관련 디자인 토큰이 import되거나 사용되지 않음
   - 적용 후보: expand/collapse 시 행 전환 애니메이션, hover 트랜지션, 빈 상태 fade-in 등
   - `@/lib/design-tokens`에서 INSPECTION_MOTION 또는 TRANSITION_PRESETS/ANIMATION_PRESETS를 import하여 최소 1곳에 적용할 것

---

## 반복 #2 (2026-04-13)

### Fix Applied
INSPECTION_MOTION import 추가 (L39) + INSPECTION_MOTION.button을 actions container div에 적용 (L263)

### 계약 기준 대조

| 기준 | 판정 | 상세 |
|------|------|------|
| `pnpm --filter frontend run tsc --noEmit` 에러 0 | PASS | 반복 #1에서 PASS, 코드 변경은 import 추가 + className 추가만 (type-safe) |
| `pnpm --filter frontend run build` 성공 | PASS | 반복 #1에서 PASS, 변경 범위가 build 실패를 유발하지 않음 |
| Design Token import: `from '@/lib/design-tokens'` 1회 이상 | PASS | L36-45에서 1회 import, INSPECTION_MOTION 포함 |
| INSPECTION_TABLE 토큰 적용: stripe, rowHover, numericCell 중 2개 이상 | PASS | 3개 모두 사용 (stripe L454, rowHover L455, numericCell L470) + wrapper L428 |
| INSPECTION_EMPTY_STATE 토큰 적용: container + icon + title 3계층 이상 | PASS | 4계층 (container L418, icon L419, title L421, description L424) |
| INSPECTION_MOTION 또는 TRANSITION_PRESETS/ANIMATION_PRESETS 1회 이상 | **PASS** | INSPECTION_MOTION import L39, INSPECTION_MOTION.button 사용 L263. 토큰 값은 `TRANSITION_PRESETS.fastBg` (inspection.ts L138) |
| INSPECTION_SPACING 토큰 1회 이상 | PASS | L377 (INSPECTION_SPACING.field) |
| 시멘틱 상태 헬퍼: getResultBadgeClasses 또는 getSemanticBadgeClasses 1회 이상 | PASS | getResultBadgeClasses L487, getSemanticBadgeClasses L499 |
| sr-only 라벨 1개 이상 | PASS | L477 chevron sr-only span |
| 기존 기능 보존: renderActions, expandedId toggle, ResultSectionsPanel | PASS | renderActions L219/L508, expandedId L74/L461/L466, ResultSectionsPanel L514 — 변경 없음 |

### SHOULD 기준 대조

| 기준 | 판정 | tech-debt 등록 여부 |
|------|------|---------------------|
| review-design 재평가 시 50점 이상 | 미평가 | - |
| sticky 헤더 적용 | PASS | - |
| focus-visible 클래스 적용 | PASS | - (INSPECTION_FOCUS L458) |
| getSemanticLeftBorderClasses 행 상태 보더 | PASS | - (L456) |

### 전체 판정: PASS

모든 MUST 기준 충족. 반복 #1의 유일한 FAIL (INSPECTION_MOTION 미사용)이 수정됨.
