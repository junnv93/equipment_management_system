'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Printer, User, Server, MapPin } from 'lucide-react';
import { EntityLinkCell } from '@/components/ui/entity-link-cell';
import { AuditLogDiffViewer } from '@/components/ui/audit-log-diff-viewer';
import { PrintableAuditReport } from './PrintableAuditReport';
import { formatDateTime } from '@/lib/utils/date';
import {
  type AuditLog,
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_COLORS,
  AUDIT_ENTITY_TYPE_LABELS,
  type AuditAction,
  type AuditEntityType,
} from '@equipment-management/schemas';
import { USER_ROLE_LABELS, type UserRole } from '@equipment-management/shared-constants';

interface AuditLogDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: AuditLog;
}

/**
 * 감사 로그 상세 다이얼로그
 *
 * 감사 로그의 모든 정보를 시각화합니다:
 * - 사용자 정보 (userName, userRole, userId, ipAddress)
 * - 엔티티 정보 (entityType, entityName, 상세보기 링크)
 * - 변경 사항 (previousValue ↔ newValue diff)
 * - 인쇄 기능 (PrintableAuditReport)
 *
 * @example
 * ```tsx
 * const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
 * const [dialogOpen, setDialogOpen] = useState(false);
 *
 * <AuditLogDetailDialog
 *   open={dialogOpen}
 *   onOpenChange={setDialogOpen}
 *   log={selectedLog!}
 * />
 * ```
 */
export function AuditLogDetailDialog({ open, onOpenChange, log }: AuditLogDetailDialogProps) {
  const handlePrint = () => {
    window.print();
  };

  const hasDetails = log.details && (log.details.previousValue || log.details.newValue);
  const hasAdditionalInfo = log.details?.additionalInfo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* 화면 표시용 */}
        <div className="print:hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <DialogTitle>감사 로그 상세</DialogTitle>
                <DialogDescription>시스템에서 발생한 활동의 상세 기록입니다.</DialogDescription>
              </div>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                인쇄
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            {/* 액션 및 타임스탬프 */}
            <div className="flex items-center justify-between">
              <Badge className={AUDIT_ACTION_COLORS[log.action as AuditAction] || 'bg-gray-100'}>
                {AUDIT_ACTION_LABELS[log.action as AuditAction] || log.action}
              </Badge>
              <span className="text-sm text-muted-foreground">{formatDateTime(log.timestamp)}</span>
            </div>

            {/* 사용자 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  사용자 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">사용자:</span>
                    <span className="ml-2 font-medium">{log.userName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">역할:</span>
                    <span className="ml-2 font-medium">
                      {USER_ROLE_LABELS[log.userRole as UserRole] || log.userRole}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">사용자 ID:</span>
                    <span className="ml-2 font-mono text-xs">{log.userId}</span>
                  </div>
                  {log.ipAddress && (
                    <div className="col-span-2 flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">IP 주소:</span>
                      <span className="ml-2 font-mono text-xs">{log.ipAddress}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 엔티티 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Server className="h-4 w-4" />
                  대상 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">대상 타입:</span>
                    <span className="ml-2 font-medium">
                      {AUDIT_ENTITY_TYPE_LABELS[log.entityType as AuditEntityType] ||
                        log.entityType}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">대상 ID:</span>
                    <span className="ml-2 font-mono text-xs">{log.entityId}</span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <EntityLinkCell
                    entityType={log.entityType}
                    entityId={log.entityId}
                    entityName={log.entityName}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 변경 사항 (details가 있을 때만) */}
            {hasDetails && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">변경 사항</CardTitle>
                </CardHeader>
                <CardContent>
                  <AuditLogDiffViewer
                    previousValue={log.details!.previousValue || {}}
                    newValue={log.details!.newValue || {}}
                    entityType={log.entityType}
                  />
                </CardContent>
              </Card>
            )}

            {/* 추가 정보 (additionalInfo가 있을 때만) */}
            {hasAdditionalInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">추가 정보</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-4 rounded overflow-x-auto">
                    {JSON.stringify(log.details!.additionalInfo, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* 메타데이터 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">메타데이터</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <div>
                  <span>로그 ID:</span>
                  <span className="ml-2 font-mono text-xs">{log.id}</span>
                </div>
                <div>
                  <span>생성 시간:</span>
                  <span className="ml-2">{formatDateTime(log.createdAt)}</span>
                </div>
                {log.details?.requestId && (
                  <div>
                    <span>요청 ID:</span>
                    <span className="ml-2 font-mono text-xs">{log.details.requestId}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 인쇄용 */}
        <PrintableAuditReport
          logs={[log]}
          title={`${AUDIT_ENTITY_TYPE_LABELS[log.entityType as AuditEntityType] || log.entityType} 감사 로그 상세`}
        />
      </DialogContent>
    </Dialog>
  );
}
