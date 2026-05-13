---
slug: help-faq-infra
title: help-faq-content-authoring 인프라 sprint
mode: 1
date: 2026-05-13
---

## Context

운영팀 FAQ 콘텐츠 공급 전 기술 인프라를 완성한다.
실제 FAQ 카피는 `feedback_no_fabricate_domain_data` 정책에 따라 생성 금지 — 구조만.

## MUST Criteria

| ID | Criterion | Verify Method |
|----|-----------|---------------|
| M-1 | `HelpTopicKey` 타입이 `packages/shared-constants/src/frontend-routes.ts`에서 export됨 | `grep -n "HelpTopicKey" packages/shared-constants/src/frontend-routes.ts` |
| M-2 | `FRONTEND_ROUTES.HELP.TOPIC`의 파라미터가 `HelpTopicKey` 타입 (string 아님) | `grep -n "topicKey: HelpTopicKey" packages/shared-constants/src/frontend-routes.ts` |
| M-3 | `help/page.tsx`에서 로컬 `HELP_SECTION_KEYS` 상수가 제거되고 shared-constants import로 대체 | `grep -n "HELP_SECTION_KEYS" apps/frontend/app/(dashboard)/help/page.tsx` — 빈 결과 PASS |
| M-4 | `help/page.tsx`에서 `HelpTopicKey` 또는 `HELP_TOPIC_KEYS` (SSOT)를 import하여 사용 | `grep -n "HelpTopicKey\|HELP_TOPIC_KEYS" apps/frontend/app/(dashboard)/help/page.tsx` |
| M-5 | `ko/help.json` 각 섹션에 `faqs: []` 배열 필드 추가 | `grep -n '"faqs"' apps/frontend/messages/ko/help.json` — 4개 이상 |
| M-6 | `en/help.json` 각 섹션에 `faqs: []` 배열 필드 추가 | `grep -n '"faqs"' apps/frontend/messages/en/help.json` — 4개 이상 |
| M-7 | `help/page.tsx`에서 `faqs` 배열이 비었을 때 description placeholder fallback 렌더링 | `grep -n "faqs\|length" apps/frontend/app/(dashboard)/help/page.tsx` |
| M-8 | `CheckoutEmptyState` 또는 호출 컨텍스트에서 `/help#checkout` 진입점 연결 (`FRONTEND_ROUTES.HELP.TOPIC('checkout')` 사용) | `grep -rn "FRONTEND_ROUTES.HELP.TOPIC\|help#checkout\|help#" apps/frontend/components/ apps/frontend/app/` |
| M-9 | `pnpm --filter frontend tsc --noEmit` EXIT 0 | 빌드 실행 |
| M-10 | `pnpm --filter shared-constants tsc --noEmit` EXIT 0 | 빌드 실행 |

## SHOULD Criteria

| ID | Criterion | Note |
|----|-----------|------|
| S-1 | calibration/nonConformance/permissions EmptyState에도 help 링크 연결 | 진입점 범위에 따라 조정 |
| S-2 | FAQ 아코디언 컴포넌트 추출 (page.tsx inline → HelpFaqSection component) | 섹션 autonomy 4원칙 — 파일 복잡도에 따라 판단 |
| S-3 | `FRONTEND_ROUTES.HELP.TOPIC` 사용처에서 타입 오류 없음 검증 | tsc 자동 확인 |

## Out of Scope

- 실제 FAQ 카피 (q/a 텍스트) 생성 금지
- 백엔드/DB 변경
- 신규 패키지 추가
