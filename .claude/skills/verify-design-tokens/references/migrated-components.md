# Migrated Components (Design Token System v2)

Design Token 3-Layer 아키텍처로 마이그레이션된 컴포넌트 목록입니다.
이 목록의 컴포넌트는 반드시 `@/lib/design-tokens`에서 import하여 토큰을 사용해야 합니다.

## Layout

- `apps/frontend/components/layout/ThemeToggle.tsx`
- `apps/frontend/components/layout/UserProfileDropdown.tsx`
- `apps/frontend/components/layout/DashboardShell.tsx`
- `apps/frontend/components/layout/MobileNav.tsx`
- `apps/frontend/components/layout/GlobalSearchDialog.tsx`
- `apps/frontend/components/layout/GlobalSearchTrigger.tsx`

## Auth

- `apps/frontend/components/auth/LoginForm.tsx`
- `apps/frontend/components/auth/LoginPageContent.tsx`
- `apps/frontend/components/auth/AzureAdButton.tsx`
- `apps/frontend/components/auth/IdleTimeoutDialog.tsx`

## Notifications

- `apps/frontend/components/notifications/notifications-dropdown.tsx`
- `apps/frontend/components/notifications/notification-item.tsx`

## Dashboard

- `apps/frontend/components/dashboard/WelcomeHeader.tsx`
- `apps/frontend/components/dashboard/PendingApprovalCard.tsx`
- `apps/frontend/components/dashboard/RecentActivities.tsx`
- `apps/frontend/components/dashboard/QuickActionBar.tsx`
- `apps/frontend/components/dashboard/CalibrationDdayList.tsx`
- `apps/frontend/components/dashboard/KpiStatusGrid.tsx`
- `apps/frontend/components/dashboard/MiniCalendar.tsx`
- `apps/frontend/components/dashboard/TeamEquipmentDistribution.tsx`
- `apps/frontend/components/dashboard/OverdueCheckoutsCard.tsx`

## Equipment

- `apps/frontend/components/equipment/EquipmentCardGrid.tsx`
- `apps/frontend/components/equipment/EquipmentFilters.tsx`
- `apps/frontend/components/equipment/EquipmentListContent.tsx`
- `apps/frontend/components/equipment/EquipmentTable.tsx`
- `apps/frontend/components/equipment/EquipmentPageHeader.tsx`
- `apps/frontend/components/equipment/StatusSummaryStrip.tsx`
- `apps/frontend/components/equipment/EquipmentEmptyState.tsx`
- `apps/frontend/components/equipment/shared/EquipmentTimeline.tsx`
- `apps/frontend/components/equipment/BasicInfoTab.tsx`
- `apps/frontend/components/equipment/EquipmentDetailClient.tsx`
- `apps/frontend/components/equipment/EquipmentTabs.tsx`
- `apps/frontend/components/equipment/CalibrationHistoryTab.tsx`
- `apps/frontend/components/equipment/IncidentHistorySection.tsx`
- `apps/frontend/components/equipment/IncidentHistoryTab.tsx`
- `apps/frontend/components/equipment/CalibrationApprovalActions.tsx`
- `apps/frontend/components/equipment/CalibrationResultBadge.tsx`
- `apps/frontend/components/equipment/ManagementNumberPreviewBar.tsx`
- `apps/frontend/components/equipment/EquipmentStickyHeader.tsx`
- `apps/frontend/components/equipment/EquipmentKpiStrip.tsx`

## Calibration

- `apps/frontend/app/(dashboard)/calibration/CalibrationContent.tsx`
- `apps/frontend/app/(dashboard)/calibration/register/CalibrationRegisterContent.tsx`
- `apps/frontend/components/calibration/CalibrationListTable.tsx`
- `apps/frontend/components/calibration/CalibrationStatsCards.tsx`
- `apps/frontend/components/calibration/CalibrationTimeline.tsx`
- `apps/frontend/components/calibration/IntermediateChecksTab.tsx`
- `apps/frontend/components/calibration/SelfInspectionTab.tsx`
- `apps/frontend/components/calibration/CalibrationAlertBanners.tsx`
- `apps/frontend/components/calibration/VersionHistory.tsx` ← 교정 기록 도메인 (이 경로는 calibration module)

## Calibration Plans (calibration-plans 도메인 — 3단계 승인 계획서)

- `apps/frontend/components/calibration-plans/ApprovalTimeline.tsx`
- `apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx`
- `apps/frontend/components/calibration-plans/PlanItemsTable.tsx`
- `apps/frontend/components/calibration-plans/VersionHistory.tsx`

## Checkouts

- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx`
- `apps/frontend/components/checkouts/CheckoutStatusBadge.tsx`
- `apps/frontend/components/checkouts/CheckoutMiniProgress.tsx`
- `apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx`
- `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx`

## Approvals

- `apps/frontend/components/approvals/ApprovalDetailModal.tsx`
- `apps/frontend/components/approvals/ApprovalRow.tsx`
- `apps/frontend/components/approvals/ApprovalCategorySidebar.tsx`
- `apps/frontend/components/approvals/ApprovalKpiStrip.tsx`
- `apps/frontend/components/approvals/ApprovalMobileCategoryBar.tsx`
- `apps/frontend/components/approvals/ApprovalList.tsx`
- `apps/frontend/components/approvals/ApprovalsClient.tsx`
- `apps/frontend/components/approvals/BulkActionBar.tsx`
- `apps/frontend/components/approvals/RejectModal.tsx`

## Audit

- `apps/frontend/app/(dashboard)/admin/audit-logs/AuditLogsContent.tsx`
- `apps/frontend/components/audit-logs/AuditDetailSheet.tsx`
- `apps/frontend/components/audit-logs/AuditSummaryBar.tsx`
- `apps/frontend/components/audit-logs/AuditTimelineFeed.tsx`

## Admin

- `apps/frontend/app/(dashboard)/admin/non-conformance-approvals/NonConformanceApprovalsContent.tsx`

## Settings

- `apps/frontend/components/settings/SettingsToggleField.tsx`
- `apps/frontend/app/(dashboard)/settings/SettingsPageHeader.tsx`

## Shared

- `apps/frontend/components/shared/FormWizardStepper.tsx`

## Teams

- `apps/frontend/components/teams/TeamCard.tsx`
- `apps/frontend/components/teams/TeamListContent.tsx`
- `apps/frontend/components/teams/TeamMemberList.tsx`
- `apps/frontend/components/teams/LeaderCombobox.tsx`
- `apps/frontend/components/teams/MemberProfileDialog.tsx`
