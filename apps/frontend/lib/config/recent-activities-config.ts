/**
 * 최근 활동 피드 설정 (SSOT)
 *
 * RecentActivities 컴포넌트에서 사용하는 인라인 상수를
 * 이 파일로 추출하여 비즈니스 로직과 UI를 분리합니다.
 */

import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import type { RecentActivity } from '@/lib/api/dashboard-api';
import {
  Clock,
  Pen,
  Send,
  Truck,
  PlusCircle,
  Wrench,
  FileCheck,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── 활동 타입 메타데이터 ───────────────────────────────────────

export interface ActivityTypeMeta {
  icon: LucideIcon;
  labelKey: string; // i18n key under 'dashboard.activities.types'
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  category: string;
}

export const ACTIVITY_TYPES: Record<string, ActivityTypeMeta> = {
  equipment_added: {
    icon: PlusCircle,
    labelKey: 'equipment_added',
    variant: 'default',
    category: 'equipment',
  },
  equipment_updated: {
    icon: Pen,
    labelKey: 'equipment_updated',
    variant: 'secondary',
    category: 'equipment',
  },
  equipment_approved: {
    icon: CheckCircle,
    labelKey: 'equipment_approved',
    variant: 'default',
    category: 'equipment',
  },
  equipment_rejected: {
    icon: XCircle,
    labelKey: 'equipment_rejected',
    variant: 'destructive',
    category: 'equipment',
  },
  calibration_created: {
    icon: Wrench,
    labelKey: 'calibration_created',
    variant: 'default',
    category: 'calibration',
  },
  calibration_approved: {
    icon: CheckCircle,
    labelKey: 'calibration_approved',
    variant: 'default',
    category: 'calibration',
  },
  calibration_updated: {
    icon: Wrench,
    labelKey: 'calibration_updated',
    variant: 'secondary',
    category: 'calibration',
  },
  non_conformance_created: {
    icon: XCircle,
    labelKey: 'non_conformance_created',
    variant: 'destructive',
    category: 'equipment',
  },
  non_conformance_updated: {
    icon: Pen,
    labelKey: 'non_conformance_updated',
    variant: 'secondary',
    category: 'equipment',
  },
  non_conformance_resolved: {
    icon: CheckCircle,
    labelKey: 'non_conformance_resolved',
    variant: 'default',
    category: 'equipment',
  },
  calibration_plan_created: {
    icon: FileCheck,
    labelKey: 'calibration_plan_created',
    variant: 'default',
    category: 'calibration',
  },
  calibration_plan_approved: {
    icon: CheckCircle,
    labelKey: 'calibration_plan_approved',
    variant: 'default',
    category: 'calibration',
  },
  calibration_plan_rejected: {
    icon: XCircle,
    labelKey: 'calibration_plan_rejected',
    variant: 'destructive',
    category: 'calibration',
  },
  rental_created: {
    icon: Send,
    labelKey: 'rental_created',
    variant: 'outline',
    category: 'rental',
  },
  rental_approved: {
    icon: CheckCircle,
    labelKey: 'rental_approved',
    variant: 'default',
    category: 'rental',
  },
  checkout_created: {
    icon: Truck,
    labelKey: 'checkout_created',
    variant: 'outline',
    category: 'checkout',
  },
  checkout_approved: {
    icon: CheckCircle,
    labelKey: 'checkout_approved',
    variant: 'default',
    category: 'checkout',
  },
};

// ─── 라우트 정보 (SSOT: FRONTEND_ROUTES) ────────────────────────

export const ACTIVITY_ROUTES: Record<string, (entityId: string) => string> = {
  equipment_added: (id) => FRONTEND_ROUTES.EQUIPMENT.DETAIL(id),
  equipment_updated: (id) => FRONTEND_ROUTES.EQUIPMENT.DETAIL(id),
  equipment_approved: (id) => FRONTEND_ROUTES.EQUIPMENT.DETAIL(id),
  equipment_rejected: (id) => FRONTEND_ROUTES.EQUIPMENT.DETAIL(id),
  calibration_created: (id) => FRONTEND_ROUTES.CALIBRATION.DETAIL(id),
  calibration_updated: (id) => FRONTEND_ROUTES.CALIBRATION.DETAIL(id),
  calibration_approved: (id) => FRONTEND_ROUTES.CALIBRATION.DETAIL(id),
  calibration_plan_created: (id) => FRONTEND_ROUTES.CALIBRATION_PLANS.DETAIL(id),
  calibration_plan_approved: (id) => FRONTEND_ROUTES.CALIBRATION_PLANS.DETAIL(id),
  calibration_plan_rejected: (id) => FRONTEND_ROUTES.CALIBRATION_PLANS.DETAIL(id),
  // non_conformance_*: NC UUID로는 /equipment/[equipmentId]/non-conformance 접근 불가 — 라우트 미등록
  rental_created: (id) => FRONTEND_ROUTES.CHECKOUTS.DETAIL(id),
  rental_approved: (id) => FRONTEND_ROUTES.CHECKOUTS.DETAIL(id),
  rental_returned: (id) => FRONTEND_ROUTES.CHECKOUTS.DETAIL(id),
  checkout_created: (id) => FRONTEND_ROUTES.CHECKOUTS.DETAIL(id),
  checkout_approved: (id) => FRONTEND_ROUTES.CHECKOUTS.DETAIL(id),
  checkout_returned: (id) => FRONTEND_ROUTES.CHECKOUTS.DETAIL(id),
};

// ─── 역할별 표시 카테고리 ────────────────────────────────────────

export const ROLE_CATEGORIES: Record<string, string[]> = {
  test_engineer: ['equipment', 'calibration', 'rental', 'checkout'],
  technical_manager: ['equipment', 'calibration', 'rental'],
  quality_manager: ['calibration', 'equipment'],
  lab_manager: ['equipment', 'calibration', 'rental', 'checkout'],
  system_admin: ['equipment', 'calibration', 'rental', 'checkout'],
};

// ─── 카테고리 탭 정의 ────────────────────────────────────────────

export interface CategoryTab {
  key: string;
  labelKey: string; // i18n key under 'dashboard.activities.categories'
}

export const CATEGORY_TABS: CategoryTab[] = [
  { key: 'all', labelKey: 'all' },
  { key: 'equipment', labelKey: 'equipment' },
  { key: 'calibration', labelKey: 'calibration' },
  { key: 'rental', labelKey: 'rental' },
  { key: 'checkout', labelKey: 'checkout' },
];

// ─── 기본 활동 메타 (타입 미등록 시 fallback) ──────────────────

export const DEFAULT_ACTIVITY_META: ActivityTypeMeta = {
  icon: FileCheck,
  labelKey: 'other',
  variant: 'default',
  category: 'other',
};

export type { RecentActivity };
