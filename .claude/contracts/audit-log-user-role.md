# Contract: audit-log-user-role

## Objective
`AuditLog.userRole`과 `CreateAuditLogDto.userRole`에 `AuditLogUserRole` 전용 타입을 도입하여
write/read path 모두 `string` 대신 명확한 유니온 타입으로 타입 안전성 복원.

## Changed Files
1. `packages/schemas/src/audit-log.ts`
2. `apps/frontend/components/audit-logs/AuditTimelineFeed.tsx`

## MUST Criteria
- [ ] `AuditLogUserRole = UserRole | 'system' | 'unknown'` 타입이 `audit-log.ts`에 export됨
- [ ] `CreateAuditLogDto.userRole`이 `string` 대신 `AuditLogUserRole`로 변경됨
- [ ] `AuditLog.userRole`이 `UserRole` 대신 `AuditLogUserRole`로 변경됨
- [ ] `pnpm tsc --noEmit` (전체) 오류 없음
- [ ] `pnpm --filter backend run tsc --noEmit` 오류 없음
- [ ] `pnpm --filter frontend run tsc --noEmit` 오류 없음

## SHOULD Criteria
- [ ] `AuditTimelineFeed.tsx`의 `roleLabel` prop이 `(role: AuditLogUserRole) => string`로 업데이트됨
- [ ] 기존 `as UserRole` 캐스팅 코드(audit.service.ts, reports.service.ts)에 대한 주석 추가 (선택)
