---
slug: i18n-permission-labels
mode: 1
date: 2026-04-21
---

# Contract: i18n Permission Labels 완전 동기화

## 목표
`Permission` enum → `PERMISSION_CATEGORIES` → i18n labels 3단 체인을 완전 동기화하여
프로필 페이지 권한 목록에서 raw permission string이 표시되지 않도록 한다.

## MUST 기준

| # | 기준 | 검증 방법 |
|---|------|-----------|
| M1 | `pnpm tsc --noEmit` 에러 없음 | tsc 실행 |
| M2 | `pnpm --filter frontend run build` 성공 | build 실행 |
| M3 | PERMISSION_CATEGORIES에 포함된 모든 Permission 값이 ko/settings.json labels에 존재 | grep 교차검증 |
| M4 | PERMISSION_CATEGORIES에 포함된 모든 Permission 값이 en/settings.json labels에 존재 | grep 교차검증 |
| M5 | 스테일 키(Permission enum에 없는 키) 제거됨: view:software, create:software-change, approve:software-change, view:software:requests, create:self-inspection, confirm:self-inspection | grep 검증 |
| M6 | PERMISSION_CATEGORY_KEYS에 intermediateInspections, formTemplates 추가됨 | grep 검증 |
| M7 | 신규 카테고리에 대한 i18n categories 번역 존재 (ko/en 모두) | grep 검증 |

## SHOULD 기준

| # | 기준 | 검증 방법 |
|---|------|-----------|
| S1 | 모든 Permission enum 값 (PERMISSION_CATEGORIES 밖 포함) 에도 i18n label 존재 | 수동 검증 |
| S2 | perform:data:migration이 system 카테고리에 포함됨 | grep 검증 |

## 변경 대상 파일

1. `packages/shared-constants/src/permission-categories.ts`
   - nonConformances에 upload/delete:non-conformance-attachment 추가
   - software에 approve:software-validation:technical/quality, revalidate:software-validation 추가
   - intermediateInspections 카테고리 신규 추가
   - formTemplates 카테고리 신규 추가
   - system에 perform:data:migration 추가

2. `apps/frontend/messages/ko/settings.json`
   - labels: 누락 20개 추가, 스테일 5개 제거
   - categories: intermediateInspections, formTemplates 추가

3. `apps/frontend/messages/en/settings.json`
   - labels: 누락 20개 추가, 스테일 5개 제거
   - categories: intermediateInspections, formTemplates 추가
