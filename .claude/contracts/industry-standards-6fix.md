# Contract: industry-standards-6fix

## Objective
업계 표준 미준수 6개 이슈를 동시 수정.

## Changed Files
1. `apps/frontend/components/auth/AuthProviders.tsx`
2. `apps/frontend/components/shared/DocumentPreviewDialog.tsx`
3. `apps/backend/src/modules/users/users.controller.ts`
4. `packages/db/src/schema/equipment-incident-history.ts`
5. `.github/workflows/main.yml`
6. `apps/backend/src/modules/audit/audit.service.ts`

## MUST Criteria
- [ ] `AuthProviders` 컴포넌트가 `useAuthProviders` 훅을 사용 (DRY)
- [ ] `useAuthProviders` 훅에 unmount cleanup (cancelled 플래그 또는 AbortController)
- [ ] `DocumentPreviewDialog` blob URL cleanup이 ref 기반으로 stale closure 없음
- [ ] `syncUser` 엔드포인트에 `@AuditLog` 데코레이터 추가
- [ ] `incident_history` 스키마에 `occurredAt` 인덱스 추가
- [ ] DB 마이그레이션 생성 및 적용
- [ ] `audit.service.ts`에서 `as unknown as SchemasAuditLog[]` 이중 캐스팅 제거
- [ ] `pnpm --filter backend run tsc --noEmit` 오류 없음
- [ ] `pnpm --filter frontend run tsc --noEmit` 오류 없음

## SHOULD Criteria
- [ ] `.github/workflows/main.yml` download-artifact SHA 핀닝
