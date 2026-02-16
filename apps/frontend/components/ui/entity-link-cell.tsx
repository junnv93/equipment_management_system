'use client';

import Link from 'next/link';
import {
  ExternalLink,
  Package,
  Gauge,
  ArrowRightLeft,
  FileText,
  User,
  Users,
  Activity,
  AlertTriangle,
  Code,
  Wrench,
  MapPin,
  FileCheck,
  Settings,
} from 'lucide-react';
import { type AuditEntityType, AUDIT_ENTITY_TYPE_LABELS } from '@equipment-management/schemas';
import { getEntityRoute } from '@equipment-management/shared-constants';

/**
 * 엔티티 타입별 아이콘 매핑
 */
const ENTITY_ICONS: Record<string, React.ReactNode> = {
  equipment: <Package className="h-4 w-4" />,
  calibration: <Gauge className="h-4 w-4" />,
  checkout: <ArrowRightLeft className="h-4 w-4" />,
  rental: <ArrowRightLeft className="h-4 w-4" />,
  calibration_plan: <FileText className="h-4 w-4" />,
  non_conformance: <AlertTriangle className="h-4 w-4" />,
  user: <User className="h-4 w-4" />,
  team: <Users className="h-4 w-4" />,
  calibration_factor: <Activity className="h-4 w-4" />,
  software: <Code className="h-4 w-4" />,
  repair_history: <Wrench className="h-4 w-4" />,
  equipment_import: <Package className="h-4 w-4" />,
  location_history: <MapPin className="h-4 w-4" />,
  maintenance_history: <Wrench className="h-4 w-4" />,
  incident_history: <AlertTriangle className="h-4 w-4" />,
  settings: <Settings className="h-4 w-4" />,
};

/**
 * 엔티티 타입으로 아이콘 조회
 */
function getEntityIcon(entityType: string): React.ReactNode {
  return ENTITY_ICONS[entityType] || <FileCheck className="h-4 w-4" />;
}

interface EntityLinkCellProps {
  entityType: string;
  entityId: string;
  entityName?: string | null;
  className?: string;
}

/**
 * 엔티티 링크 셀 컴포넌트
 *
 * 감사 로그, 테이블 등에서 엔티티를 링크로 표시합니다.
 * - 엔티티 타입별 아이콘 표시
 * - getEntityRoute()로 URL 생성 (SSOT)
 * - 라우팅 불가능한 엔티티는 일반 텍스트로 표시
 *
 * @example
 * ```tsx
 * <EntityLinkCell
 *   entityType="equipment"
 *   entityId="123e4567"
 *   entityName="네트워크 분석기 (SUW-E0326)"
 * />
 * ```
 */
export function EntityLinkCell({
  entityType,
  entityId,
  entityName,
  className,
}: EntityLinkCellProps) {
  const route = getEntityRoute(entityType, entityId);

  // 라우팅 불가능한 엔티티는 일반 텍스트로 표시
  if (!route) {
    return (
      <span className={`flex items-center gap-2 text-muted-foreground ${className || ''}`}>
        {getEntityIcon(entityType)}
        <span className="truncate">
          {entityName ||
            `${AUDIT_ENTITY_TYPE_LABELS[entityType as AuditEntityType] || entityType} (${entityId.substring(0, 8)}...)`}
        </span>
      </span>
    );
  }

  return (
    <Link
      href={route}
      className={`flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline transition-colors ${className || ''}`}
      title={`${AUDIT_ENTITY_TYPE_LABELS[entityType as AuditEntityType] || entityType} 상세 보기`}
    >
      {getEntityIcon(entityType)}
      <span className="truncate">
        {entityName ||
          `${AUDIT_ENTITY_TYPE_LABELS[entityType as AuditEntityType] || entityType} (${entityId.substring(0, 8)}...)`}
      </span>
      <ExternalLink className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
    </Link>
  );
}
