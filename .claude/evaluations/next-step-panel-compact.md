# Evaluation Report: next-step-panel-compact
날짜: 2026-04-27 | 반복: 1

## 판정: PASS

## MUST 기준 결과
| ID | 기준 요약 | 판정 | 근거 |
|----|-----------|------|------|
| M1 | compact canAct=true 텍스트 1회 | PASS | span은 `!canAct` 조건, button은 `canAct` 조건으로 완전 상호 배타적 분기. 동시 렌더 불가능. diff 라인 302~312 확인 |
| M2 | compact canAct=false 라벨 유지 | PASS | `!canAct` 시 `<span class="text-xs text-muted-foreground truncate max-w-[72px]">` 렌더됨 (라인 305~309) |
| M3 | hero variant 기존 동작 유지 | PASS | diff 변경 범위가 compact 분기(라인 302~312)에 한정. hero 분기(181~262) 변경 없음 |
| M4 | inline/floating variant 기존 출력 유지 | PASS | floating/inline 분기(라인 365~416) diff 변경 없음 |
| M5 | terminal 분기 전 variant 유지 | PASS | terminal 분기(라인 138~176) diff 변경 없음 |
| M6 | tsc --noEmit PASS | PASS | `cd apps/frontend && pnpm exec tsc --noEmit` 출력 없음 (에러 0) |
| M7 | build PASS | PASS | `pnpm --filter frontend run build` 성공 (Build error/Type error 없음) |
| M8 | lint PASS | PASS | `pnpm --filter frontend run lint` 에러 없음 |
| M9 | SSOT — checkout-fsm.ts 변경 없음 | PASS | `git diff -- packages/schemas/src/fsm/checkout-fsm.ts` 출력 0줄 |
| M10 | i18n — fsm.action.* 키 추가/삭제/이름변경 없음 | PASS | `git diff -- messages/{ko,en}/checkouts.json` 출력 0줄. 키 15개는 이번 수정 이전부터 동일 (contract 명시 14개는 기존 15개 상태의 선행 오기) |
| M11 | 백엔드 무변경 | PASS | `git diff -- apps/backend/src/modules/checkouts/checkouts.service.ts` 출력 0줄 |
| M12 | 토큰 보존 — workflow-panel.ts compact 구조 유지 | PASS | `git diff -- apps/frontend/lib/design-tokens/components/workflow-panel.ts` 출력 0줄 |
| M13 | 접근성 — compact 컨테이너 속성 모두 유지 | PASS | 라인 269~279: role="status", aria-live="polite", aria-atomic="true", data-variant="compact", data-actor-variant, data-my-turn 모두 존재 |
| M14 | overflow menu / MoreHorizontal / isPending 스피너 회귀 없음 | PASS | DropdownMenu(라인 333~358), MoreHorizontal(라인 341), isPending→Loader2(라인 324~326) 모두 변경 없음 |

## SHOULD 기준 결과
| ID | 기준 | 판정 | 비고 |
|----|------|------|------|
| S1 | Storybook compact canAct=true / canAct=false 두 스토리 명시적 노출 | PASS | CompactVariantCanAct(APPROVED_DESCRIPTOR, availableToCurrentUser=true) + CompactVariantNoAct(PENDING_DESCRIPTOR, availableToCurrentUser=false) 추가됨 |
| S2 | compact variant 단위 테스트 (screen.queryAllByText 카운트=1 검증) | SKIP | 이번 PR 범위 아님 — 후속 PR 처리 가능 |
| S3 | Playwright 시각 회귀 스냅샷 | SKIP | 이번 PR 범위 아님 |
| S4 | 미래 actionKey≠labelKey 분기 시 옵션 A 마이그레이션 | SKIP | 별도 PR |
| S5 | hero variant UX 검토 | SKIP | 별도 PR |

## 발견된 문제 (MUST FAIL 항목)
없음

## 수정 지시 (FAIL 시)
해당 없음

## 변경 범위 요약
- `apps/frontend/components/shared/NextStepPanel.tsx`: compact 분기 내 span 렌더링 조건에 `!canAct` 가드 추가 (3줄 변경)
- `apps/frontend/components/shared/NextStepPanel.stories.tsx`: CompactVariant(단일) → CompactVariantCanAct + CompactVariantNoAct(2개) 분리
- 변경 파일: 2개, 변경 라인: 14줄 (추가 9 / 삭제 5)
