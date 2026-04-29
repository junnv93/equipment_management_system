---
slug: nc-p3p4p8p9-qr
title: NC 페이지 후속 4건 + QR SSOT 수정
type: contract
created: 2026-04-21
---

# Contract: nc-p3p4p8p9-qr

## Scope

- P3: NCDetailClient InfoRow 제거 + management.* i18n 레거시 키 삭제
- P4: NC 접근성 일괄 (aria-pressed / aria-hidden / aria-label+aria-current)
- P8: NC 리스트 모바일 카드 레이아웃 + stripe
- P9: NC 카드 계층화 (hero KPI / spacing / gridRepairLinked)
- QR SSOT: verify-qr-ssot SKILL.md step 3d 동적 배열 수정

## Files

- `apps/frontend/components/non-conformances/NCDetailClient.tsx`
- `apps/frontend/app/(dashboard)/non-conformances/NonConformancesContent.tsx`
- `apps/frontend/lib/design-tokens/components/non-conformance.ts`
- `apps/frontend/messages/ko/non-conformances.json`
- `apps/frontend/messages/en/non-conformances.json`
- `.claude/skills/verify-qr-ssot/SKILL.md`

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | tsc --noEmit green | `pnpm --filter frontend exec tsc --noEmit` |
| M2 | InfoRow 3개 완전 제거 | `grep "fields.version\|fields.createdAt\|fields.updatedAt" NCDetailClient.tsx → 0 hit` |
| M3 | management.* 완전 제거 | `grep '"management"' ko/non-conformances.json en/non-conformances.json → 0 hit` |
| M4 | aria-pressed 추가 | `grep "aria-pressed" NonConformancesContent.tsx → 1+ hit` |
| M5 | MiniWorkflow aria-hidden | `grep "aria-hidden" NonConformancesContent.tsx → 1+ hit` |
| M6 | 페이지네이션 aria-label | `grep "aria-label" NonConformancesContent.tsx → 3+ hit` |
| M7 | NC_LIST_MOBILE_TOKENS export | `grep "NC_LIST_MOBILE_TOKENS" non-conformance.ts → 1+ hit` |
| M8 | NC_SPACING_TOKENS export | `grep "NC_SPACING_TOKENS" non-conformance.ts → 1+ hit` |
| M9 | QR SSOT 동적 참조 | verify-qr-ssot SKILL.md step 3d 검증 스크립트에 getSamplerPresetOrder dist 참조 |

## SHOULD Criteria (루프 차단 없음)

- S1: 모바일 카드 레이아웃 브라우저 시각 확인 (375px)
- S2: hero KPI 카드 시각 강조 확인
