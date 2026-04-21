---
slug: permission-labels-ts-ssot
mode: 1
date: 2026-04-21
---

# Contract: Permission 라벨 i18n → TypeScript SSOT 직접 파생

## 목표
프론트엔드 permission label 렌더링을 i18n JSON에서 TypeScript 상수로 교체.
`Record<Permission, string>` 타입이 컴파일 타임에 완전성을 강제.

## MUST 기준

| # | 기준 | 검증 방법 |
|---|------|-----------|
| M1 | `pnpm tsc --noEmit` 에러 없음 | tsc 실행 |
| M2 | `PERMISSION_LABELS_EN: Record<Permission, string>` 이 permissions.ts에 존재 | grep |
| M3 | `PERMISSION_LABELS_LOCALIZED` 이 permissions.ts에 존재하고 ko/en 키를 가짐 | grep + 코드 확인 |
| M4 | `PERMISSION_LABELS_LOCALIZED` 이 shared-constants index.ts에서 export됨 | grep |
| M5 | ProfileContent.tsx가 `t.raw('profile.permissions.labels')` 를 사용하지 않음 | grep (없어야 PASS) |
| M6 | ProfileContent.tsx가 `PERMISSION_LABELS_LOCALIZED` 를 사용함 | grep |
| M7 | ko/settings.json `profile.permissions.labels` 섹션이 제거됨 | grep (없어야 PASS) |
| M8 | en/settings.json `profile.permissions.labels` 섹션이 제거됨 | grep (없어야 PASS) |
| M9 | ko/settings.json `profile.permissions.categories` 섹션은 유지됨 | grep |
| M10 | en/settings.json `profile.permissions.categories` 섹션은 유지됨 | grep |

## SHOULD 기준

| # | 기준 | 검증 방법 |
|---|------|-----------|
| S1 | PERMISSION_LABELS_EN 에 91개 Permission 값이 모두 포함됨 (tsc가 강제) | tsc |
| S2 | `PERMISSION_LABELS` 주석에서 "서버 사이드 전용" 제거됨 | grep |

## 변경 대상 파일

1. `packages/shared-constants/src/permissions.ts` — PERMISSION_LABELS_EN, PERMISSION_LABELS_LOCALIZED 추가
2. `packages/shared-constants/src/index.ts` — 새 export 추가
3. `apps/frontend/app/(dashboard)/settings/profile/ProfileContent.tsx` — import 교체
4. `apps/frontend/messages/ko/settings.json` — labels 섹션 제거
5. `apps/frontend/messages/en/settings.json` — labels 섹션 제거

## 성공 기준
새 Permission enum 값 추가 시 PERMISSION_LABELS_EN에 누락되면 `tsc --noEmit` 실패
