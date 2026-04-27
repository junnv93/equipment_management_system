---
name: equipment-pwa-audit-i18n evaluation
slug: equipment-pwa-audit-i18n
iteration: 2
verdict: PASS
---

## Iteration History

| Iteration | Verdict | Key Finding |
|-----------|---------|-------------|
| 1 | FAIL | `VirtualizedEquipmentList.tsx:72` — `상세` 버튼 레이블 하드코딩 (계약 grep 패턴 외 항목) |
| 2 | PASS | Round 1 FAIL 수정 완료 확인. 모든 기준 통과 |

---

## Iteration 2 Results

### MUST Criteria

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| M1 backend tsc | PASS | `pnpm --filter backend exec tsc --noEmit` exit 0 |
| M1 frontend tsc | PASS | `pnpm --filter frontend exec tsc --noEmit` exit 0 |
| M2 hardcoded grep 0 hit (extended, incl. `상세\b`) | PASS | 유일한 hit은 `PrintableAuditReport.tsx:16` JSDoc 주석(`인쇄 가능한 감사 로그 보고서`) — UI 렌더 문자열 아님, 허용 |
| M2b additional strings (`변경 없음`, `출력자`, `설치하기`, `나중에`, `앱 설치 안내`) | PASS | 0 hit — 해당 문자열 없음 (i18n 키 사용 중) |
| M3 ko/en key parity — `equipment.virtualizedList` | PASS | 8 keys (headers.{managementNumber,name,classification,status,lastCalibration,location,detail} + loading + emptySearch), ko/en 완전 일치 |
| M3 ko/en key parity — `audit.report` | PASS | 6 keys (title, printedAt, printedBy, noChanges, fieldsChanged, footerNote), ko/en 완전 일치 |
| M3 ko/en key parity — `audit.table.changes` | PASS | `changes` 키 ko/en 양쪽 존재 확인 |
| M3 ko/en key parity — `common.pwa.installBanner` | PASS | 5 keys (ariaLabel, installCta, laterCta, subtitle, title), ko/en 완전 일치 |
| M4 UPLOAD_DOCUMENT enum | PASS | `permissions.ts:228` — `UPLOAD_DOCUMENT = 'upload:document'` |
| M4 UPLOAD_DOCUMENT PERMISSION_LABELS (ko) | PASS | `permissions.ts:346` — `'문서 업로드'` |
| M4 UPLOAD_DOCUMENT PERMISSION_LABELS_EN | PASS | `permissions.ts:467` — `'Upload Document'` |
| M4 UPLOAD_DOCUMENT in ROLE_PERMISSIONS (3 roles) | PASS | `role-permissions.ts:94` (test_engineer), `:192` (technical_manager), `:333` (lab_manager) |
| M4 documents.controller.ts uses UPLOAD_DOCUMENT | PASS | `documents.controller.ts:353` — `@RequirePermissions(Permission.UPLOAD_DOCUMENT)` (CREATE_CALIBRATION 없음) |

### SHOULD Criteria

| Item | Verdict | Notes |
|------|---------|-------|
| `PrintableAuditReport.tsx` `formatFilters` label compound 문자열 외부화 | SHOULD FAIL (기술 부채) | `대상=`, `액션=`, `사용자=`, `시작일=`, `종료일=`, `전체` 6개 문자열이 렌더된 필터 요약 문자열에 잔존. 계약 SHOULD 항목 — MUST 아님. tech-debt-tracker 등록 권고. |

---

## Summary

Round 1 FAIL 항목(`VirtualizedEquipmentList.tsx:72` `상세` 하드코딩)이 수정됨. 모든 MUST 기준 통과. SHOULD 미이행 항목(`formatFilters` compound 문자열) 1건 잔존하나 계약상 MUST 아님 — 기술 부채로 관리 권고.

**최종 판정: PASS**
