#!/usr/bin/env bash
# check-migrated.sh — 마이그레이션된 컴포넌트의 design-tokens import 여부 확인
# Usage: bash .claude/skills/verify-design-tokens/scripts/check-migrated.sh

set -euo pipefail

files=(
  "apps/frontend/components/layout/ThemeToggle.tsx"
  "apps/frontend/components/layout/UserProfileDropdown.tsx"
  "apps/frontend/components/layout/DashboardShell.tsx"
  "apps/frontend/components/notifications/notifications-dropdown.tsx"
  "apps/frontend/components/layout/MobileNav.tsx"
  "apps/frontend/components/auth/LoginForm.tsx"
  "apps/frontend/components/auth/LoginPageContent.tsx"
  "apps/frontend/components/auth/AzureAdButton.tsx"
  "apps/frontend/components/notifications/notification-item.tsx"
  "apps/frontend/components/dashboard/WelcomeHeader.tsx"
  "apps/frontend/components/dashboard/PendingApprovalCard.tsx"
  "apps/frontend/components/dashboard/RecentActivities.tsx"
  "apps/frontend/components/dashboard/QuickActionBar.tsx"
  "apps/frontend/components/dashboard/CalibrationDdayList.tsx"
  "apps/frontend/components/dashboard/KpiStatusGrid.tsx"
  "apps/frontend/components/dashboard/MiniCalendar.tsx"
  "apps/frontend/components/dashboard/TeamEquipmentDistribution.tsx"
  "apps/frontend/components/equipment/EquipmentCardGrid.tsx"
  "apps/frontend/components/equipment/EquipmentFilters.tsx"
  "apps/frontend/components/equipment/EquipmentListContent.tsx"
  "apps/frontend/components/equipment/EquipmentTable.tsx"
  "apps/frontend/components/equipment/EquipmentPageHeader.tsx"
  "apps/frontend/components/equipment/StatusSummaryStrip.tsx"
  "apps/frontend/components/equipment/EquipmentEmptyState.tsx"
  "apps/frontend/app/(dashboard)/calibration/CalibrationContent.tsx"
  "apps/frontend/app/(dashboard)/calibration/register/CalibrationRegisterContent.tsx"
  "apps/frontend/components/shared/FormWizardStepper.tsx"
  "apps/frontend/components/equipment/ManagementNumberPreviewBar.tsx"
  "apps/frontend/components/calibration/CalibrationListTable.tsx"
  "apps/frontend/components/calibration/CalibrationStatsCards.tsx"
  "apps/frontend/components/calibration/CalibrationTimeline.tsx"
  "apps/frontend/components/calibration/IntermediateChecksTab.tsx"
  "apps/frontend/components/calibration/SelfInspectionTab.tsx"
  "apps/frontend/components/equipment/shared/EquipmentTimeline.tsx"
  "apps/frontend/components/equipment/BasicInfoTab.tsx"
  "apps/frontend/components/equipment/EquipmentDetailClient.tsx"
  "apps/frontend/components/equipment/EquipmentTabs.tsx"
  "apps/frontend/components/equipment/CalibrationHistoryTab.tsx"
  "apps/frontend/components/equipment/IncidentHistorySection.tsx"
  "apps/frontend/components/equipment/IncidentHistoryTab.tsx"
  "apps/frontend/components/equipment/CalibrationApprovalActions.tsx"
  "apps/frontend/components/equipment/CalibrationResultBadge.tsx"
  "apps/frontend/components/checkouts/CheckoutGroupCard.tsx"
  "apps/frontend/components/checkouts/CheckoutStatusBadge.tsx"
  "apps/frontend/components/checkouts/CheckoutMiniProgress.tsx"
  "apps/frontend/components/approvals/ApprovalDetailModal.tsx"
  "apps/frontend/components/approvals/ApprovalRow.tsx"
  "apps/frontend/components/approvals/ApprovalCategorySidebar.tsx"
  "apps/frontend/components/approvals/ApprovalKpiStrip.tsx"
  "apps/frontend/components/approvals/ApprovalMobileCategoryBar.tsx"
  "apps/frontend/components/approvals/ApprovalList.tsx"
  "apps/frontend/components/approvals/ApprovalsClient.tsx"
  "apps/frontend/components/approvals/BulkActionBar.tsx"
  "apps/frontend/components/approvals/RejectModal.tsx"
  "apps/frontend/app/(dashboard)/admin/audit-logs/AuditLogsContent.tsx"
  "apps/frontend/components/audit-logs/AuditDetailSheet.tsx"
  "apps/frontend/components/audit-logs/AuditSummaryBar.tsx"
  "apps/frontend/components/audit-logs/AuditTimelineFeed.tsx"
  "apps/frontend/app/(dashboard)/admin/non-conformance-approvals/NonConformanceApprovalsContent.tsx"
  "apps/frontend/components/equipment/EquipmentStickyHeader.tsx"
  "apps/frontend/components/equipment/EquipmentKpiStrip.tsx"
  "apps/frontend/components/layout/GlobalSearchDialog.tsx"
  "apps/frontend/components/layout/GlobalSearchTrigger.tsx"
  "apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx"
  "apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx"
  "apps/frontend/components/calibration/CalibrationAlertBanners.tsx"
  "apps/frontend/components/calibration/VersionHistory.tsx"
  "apps/frontend/components/auth/IdleTimeoutDialog.tsx"
  "apps/frontend/components/settings/SettingsToggleField.tsx"
  "apps/frontend/app/(dashboard)/settings/SettingsPageHeader.tsx"
  "apps/frontend/components/dashboard/OverdueCheckoutsCard.tsx"
  "apps/frontend/components/teams/TeamCard.tsx"
  "apps/frontend/components/teams/TeamListContent.tsx"
  "apps/frontend/components/teams/TeamMemberList.tsx"
  "apps/frontend/components/teams/LeaderCombobox.tsx"
  "apps/frontend/components/teams/MemberProfileDialog.tsx"
)

pass=0
fail=0
missing=0

for f in "${files[@]}"; do
  if [ -f "$f" ]; then
    if grep -q "from '@/lib/design-tokens'" "$f"; then
      echo "OK: $f"
      ((pass++))
    else
      echo "MISSING: $f (design-tokens import 없음)"
      ((fail++))
    fi
  else
    echo "NOT FOUND: $f"
    ((missing++))
  fi
done

echo ""
echo "=== Summary ==="
echo "OK: $pass | MISSING: $fail | NOT FOUND: $missing"
echo "Total: ${#files[@]}"

if [ "$fail" -gt 0 ] || [ "$missing" -gt 0 ]; then
  exit 1
fi
