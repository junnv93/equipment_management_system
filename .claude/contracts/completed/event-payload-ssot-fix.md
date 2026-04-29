# Contract: event-payload-ssot-fix
Date: 2026-04-20
Mode: 1

## Scope

4개 이슈 수정:
1. completeIntermediateCheck 이벤트 페이로드 빈 문자열 하드코딩
2. qr-access.service.ts 하드코딩 상태 문자열 → SSOT enum 상수
3. intermediate-check-scheduler.ts 배치 미스 시 빈 데이터 전송 → warn+skip
4. test-software.service.ts 하드코딩 availability 문자열 → SoftwareAvailabilityEnum

## MUST Criteria

| ID | Criterion |
|----|-----------|
| M1 | `completeIntermediateCheck` 이벤트 payload의 `equipmentName`, `managementNumber`, `teamId`가 하드코딩 `''`이 아님. `equip` 쿼리 select절에 name/managementNumber/teamId 포함, 이벤트에 `equip?.name ?? ''` 형식으로 전달 |
| M2 | `qr-access.service.ts:51` — `equipment.status === EquipmentStatusEnum.enum.available` 사용 |
| M3 | `qr-access.service.ts:90` — `[CheckoutStatusEnum.enum.checked_out]` 사용 |
| M4 | `qr-access.service.ts` import에 `EquipmentStatusEnum`, `CheckoutStatusEnum` 추가 (from `@equipment-management/schemas`) |
| M5 | `intermediate-check-scheduler.ts` 3곳(line ~170, ~297, ~378)의 `?? { name: '', ... }` 패턴 제거. `equipmentMap.get()` 실패 시 warn 로그 + skip (skippedCount++ or push error result) |
| M6 | `test-software.service.ts:387` — `SoftwareAvailabilityEnum.enum.available`/`.unavailable` 사용 |
| M7 | `test-software.service.ts` import에 `SoftwareAvailabilityEnum` 추가 (from `@equipment-management/schemas`) |
| MC1 | `pnpm exec tsc --noEmit` PASS (0 errors) |
| MC2 | `pnpm --filter backend run lint` PASS |
| MC3 | `pnpm --filter backend run test` PASS |

## SHOULD Criteria

| ID | Criterion |
|----|-----------|
| S1 | test-software.service.ts:110 `dto.availability ?? 'available'` 도 enum 상수로 교체 |

## Out of Scope

- actorName: '' — dispatcher가 actorId로 해석하는 의도된 설계, 변경 금지
- as Record<string, unknown> — Drizzle ORM version + 1 타입 제약 우회, 변경 금지
- approvedEquip?.name ?? '' — TX 내 검증으로 도달 불가 방어 코드, 변경 금지
