---
slug: approvals-record-cast
mode: 1
created: 2026-04-14
---

# Contract: approvals-api.ts as Record cast 10건 제거

## Problem

`approvals-api.ts`의 private mapper/guard 함수들이 `as Record<string, unknown>` 캐스트를
10곳에서 사용함. 런타임 안전성은 동일하지만 TypeScript strict를 우회하여 오탐/과실을 숨김.

## Root Cause

1. **Type guard**: `isCheckout` / `isEquipmentImport` — `unknown → Record<string, unknown>` 캐스트
   후 `'key' in obj` 패턴. TypeScript는 `typeof x === 'object'` 이후 `in` 연산자를 직접 지원함.

2. **Checkout.user.team**: `Checkout.user` 타입에 `team` 필드 누락 → 강제 캐스트.

3. **미타입 백엔드 응답**: disposal, equipment-request, calibration-plan, software, inspection
   mapper들이 `Record<string, unknown>` 파라미터를 받으며 내부에서 중첩 캐스트.

## MUST Criteria

- [ ] `as Record<string, unknown>` 캐스트 10건 모두 제거 (grep으로 검증)
- [ ] `tsc --noEmit` PASS (frontend)
- [ ] `pnpm --filter frontend run build` PASS
- [ ] SSOT 준수: 새 인터페이스는 파일 상단 또는 전용 섹션에 명확히 문서화
- [ ] 기존 `transformArrayResponse<Record<string, unknown>>` 호출을 구체 타입으로 교체

## SHOULD Criteria

- [ ] 새 인터페이스에 `@internal` 또는 `// approvals 전용` 주석 포함
- [ ] `Checkout.user.team` 추가 후 기존 코드에서 캐스트 제거

## Changed Files

| File | Change |
|------|--------|
| `apps/frontend/lib/api/approvals-api.ts` | 인터페이스 정의 + mapper 시그니처 교체 + type guard 수정 |
| `apps/frontend/lib/api/checkout-api.ts` | `Checkout.user`에 `team?: { name: string }` 추가 |

## Verification

```bash
grep -n "as Record<string, unknown>" apps/frontend/lib/api/approvals-api.ts
pnpm --filter frontend run tsc --noEmit
```
