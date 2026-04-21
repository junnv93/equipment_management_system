# Contract: dashboard-role-layout

**날짜**: 2026-04-21
**참조 Exec Plan**: `.claude/exec-plans/active/2026-04-21-dashboard-role-layout.md`

---

## MUST 기준 (26개)

### Config SSOT
- [ ] M-01: `ApprovalCategoryPriority`, `SidebarWidget`, `PendingApprovalLayoutHint` 타입이 `dashboard-config.ts`에서 export됨
- [ ] M-02: `ControlCenterConfig`에 `pendingApprovalLayoutHint`, `approvalCategoryPriorities`, `sidebarWidgets` 필드가 존재
- [ ] M-03: `ControlCenterConfig`에 `showTeamDistribution`, `showMiniCalendar` 필드가 더 이상 존재하지 않음
- [ ] M-04: `system_admin.showPendingApprovals === false`
- [ ] M-05: 5개 역할 모두 `sidebarWidgets` 배열이 exec-plan 표와 일치
- [ ] M-06: 5개 역할 모두 `pendingApprovalLayoutHint`가 exec-plan 표와 일치
- [ ] M-07: 5개 역할 모두 `approvalCategoryPriorities`가 exec-plan 표와 일치

### Design Token SSOT
- [ ] M-08: `DASHBOARD_PENDING_APPROVAL_TOKENS`가 `dashboard.ts`에 export됨
- [ ] M-09: `DASHBOARD_SYSTEM_HEALTH_TOKENS`가 `dashboard.ts`에 export됨
- [ ] M-10: 두 토큰 객체가 `as const` + 원시 Tailwind 클래스만 사용 (동적 계산 없음)

### Approval Count Utils
- [ ] M-11: `DashboardApprovalCategory`에 `priority: ApprovalCategoryPriority` 필드 존재
- [ ] M-12: `getDashboardApprovalCategories`가 4번째 파라미터 `priorities?`를 수락
- [ ] M-13: `priority`가 `priorities?.[tab] ?? 'default'`로 계산됨

### PendingApprovalCard
- [ ] M-14: `layoutHint?: PendingApprovalLayoutHint` prop 존재 (기본값 `'grid'`)
- [ ] M-15: `priorities?: Partial<Record<ApprovalCategory, ApprovalCategoryPriority>>` prop 존재
- [ ] M-16: `single-focus` 모드에서 `DASHBOARD_PENDING_APPROVAL_TOKENS.heroCard` 클래스 사용
- [ ] M-17: `prioritized-grid` 모드에서 `data-priority` attribute가 카드에 설정됨
- [ ] M-18: 역할 리터럴(`quality_manager`, `technical_manager` 등) 참조 0건

### SystemHealthCard
- [ ] M-19: `SystemHealthCard.tsx`가 `components/dashboard/`에 존재
- [ ] M-20: 신규 API 호출 0건 — props로만 데이터 수신
- [ ] M-21: `role="region"`, `aria-label` 속성 존재
- [ ] M-22: `DASHBOARD_SYSTEM_HEALTH_TOKENS` 100% 사용
- [ ] M-23: `dashboard.systemHealth.*` i18n 키가 ko/en 양쪽에 존재

### DashboardClient
- [ ] M-24: `sidebarWidgets.map()` 패턴 사용 (boolean 분기 제거)
- [ ] M-25: `PendingApprovalCard`에 `layoutHint`, `priorities` props 전달
- [ ] M-26: `pnpm --filter frontend run tsc --noEmit` 에러 0건

---

## SHOULD 기준 (7개)

- [ ] S-01: `SIDEBAR_WIDGET_RENDERERS` 모듈 레벨 상수로 선언 (컴포넌트 외부)
- [ ] S-02: `single-focus` heroCard에 아이콘 크기 h-8 w-8, 카운트 text-5xl 적용
- [ ] S-03: `prioritized-grid` 모드에서 hero 카드 col-span-2
- [ ] S-04: SystemHealthCard loading 상태에 Skeleton 사용
- [ ] S-05: TC-05 (system_admin) E2E 테스트가 widget-visibility.spec.ts에 추가됨
- [ ] S-06: Prettier 포맷팅 통과
- [ ] S-07: 기존 TC-01~TC-04 로직이 변경 없이 유지됨

---

## 검증 스크립트

```bash
# M-26: 타입 체크
pnpm --filter frontend run tsc --noEmit

# M-03: showTeamDistribution/showMiniCalendar 제거 확인
grep -n "showTeamDistribution\|showMiniCalendar" apps/frontend/lib/config/dashboard-config.ts && echo "FAIL" || echo "PASS"

# M-04: system_admin.showPendingApprovals=false
grep -A5 "SYSTEM_ADMIN" apps/frontend/lib/config/dashboard-config.ts | grep "showPendingApprovals"

# M-18: 역할 리터럴 0건
grep -nE "'(quality_manager|technical_manager|test_engineer|lab_manager|system_admin)'" \
  apps/frontend/components/dashboard/PendingApprovalCard.tsx \
  apps/frontend/components/dashboard/DashboardClient.tsx \
  apps/frontend/components/dashboard/SystemHealthCard.tsx && echo "FAIL" || echo "PASS"

# M-19: SystemHealthCard 존재
ls apps/frontend/components/dashboard/SystemHealthCard.tsx

# M-20: 신규 API 호출 없음
grep -n "useQuery\|apiClient" apps/frontend/components/dashboard/SystemHealthCard.tsx && echo "FAIL - API 호출 있음" || echo "PASS"

# M-24: sidebarWidgets.map 패턴
grep -n "sidebarWidgets" apps/frontend/components/dashboard/DashboardClient.tsx

# S-05: TC-05 존재
grep -n "TC-05\|system_admin" apps/frontend/tests/e2e/features/dashboard/comprehensive/widget-visibility.spec.ts
```
