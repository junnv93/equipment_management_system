/**
 * 승인 카테고리 아이콘 매핑 — SSOT
 *
 * TAB_META[category].icon 문자열 → Lucide React 컴포넌트
 * ApprovalCategorySidebar, ApprovalMobileCategoryBar에서 공유
 */

import {
  Package,
  FileCheck,
  ClipboardCheck,
  ArrowUpFromLine,
  ArrowDownToLine,
  AlertTriangle,
  Trash2,
  Calendar,
  Code,
  PackagePlus,
  Share2,
} from 'lucide-react';

export const APPROVAL_ICONS: Record<string, React.ElementType> = {
  Package,
  FileCheck,
  ClipboardCheck,
  ArrowUpFromLine,
  ArrowDownToLine,
  AlertTriangle,
  Trash2,
  Calendar,
  Code,
  PackagePlus,
  Share2,
};
