---
name: equipment-pwa-audit-i18n
description: 하드코딩 한글 3파일(VirtualizedEquipmentList/PrintableAuditReport/PWAInstallBanner) i18n 외부화
type: Mode 1
slug: equipment-pwa-audit-i18n
---

## 범위

3개 컴포넌트의 하드코딩된 한국어 문자열을 next-intl `useTranslations` 패턴으로 외부화.
ko/en 양쪽 메시지 파일에 동일 키 추가 필수 (verify-i18n parity 기준).

## MUST 기준

| # | 기준 | 검증 명령 |
|---|------|-----------|
| M1 | `pnpm --filter frontend run tsc --noEmit` exit 0 | tsc 직접 실행 |
| M2 | 대상 3개 파일 하드코딩 한글 0 hit | `grep -n "관리번호\|장비명\|마지막 교정일\|로딩 중입니다\|검색 결과가 없습니다\|앱으로 설치\|감사 로그 보고서\|출력 일시" apps/frontend/components/equipment/VirtualizedEquipmentList.tsx apps/frontend/components/audit-logs/PrintableAuditReport.tsx apps/frontend/components/pwa/PWAInstallBanner.tsx` |
| M3 | ko/en 키 parity — `verify-i18n` PASS | verify-i18n 스킬 실행 |
| M4 | 신규 키 ko/en 양쪽 존재 | `grep "virtualizedList\|report.title\|pwa.installBanner" apps/frontend/messages/ko/*.json apps/frontend/messages/en/*.json` |

## SHOULD 기준

- PWAInstallBanner의 `설치하기`, `나중에`, `홈 화면에 추가해...` 등 나머지 한글도 외부화
- PrintableAuditReport footer note, renderChangesSummary 문자열도 외부화
- `formatFilters` 내부 label compound 문자열 외부화 (복잡성으로 SHOULD 분류)

## 성공 기준

MUST M1~M4 전부 PASS → git-commit 실행.
SHOULD 실패 시 tech-debt-tracker.md 추가 후 계속.
