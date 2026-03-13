'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import softwareApi, {
  SoftwareHistory,
  SOFTWARE_APPROVAL_STATUS_LABELS,
  SoftwareApprovalStatus,
} from '@/lib/api/software-api';
import {
  SOFTWARE_APPROVAL_BADGE_TOKENS,
  SOFTWARE_HISTORY_PAGE_TOKENS as TOKENS,
} from '@/lib/design-tokens';
import { SoftwareApprovalStatusValues as SAVal } from '@equipment-management/schemas';
// ✅ 직접 import (barrel import 제거)
import equipmentApi from '@/lib/api/equipment-api';
import { queryKeys } from '@/lib/api/query-config';
import { format } from 'date-fns';
import { ArrowLeft, Plus, History, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SoftwareHistoryClientProps {
  equipmentId: string;
}

export default function SoftwareHistoryClient({ equipmentId }: SoftwareHistoryClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('equipment.softwareHistory');

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newChange, setNewChange] = useState({
    softwareName: '',
    previousVersion: '',
    newVersion: '',
    verificationRecord: '',
  });

  // 장비 정보 조회
  const { data: equipment, isLoading: isLoadingEquipment } = useQuery({
    queryKey: queryKeys.equipment.detail(equipmentId),
    queryFn: () => equipmentApi.getEquipment(equipmentId),
  });

  // 소프트웨어 변경 이력 조회
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: queryKeys.software.history(equipmentId),
    queryFn: () => softwareApi.getSoftwareHistory({ equipmentId }),
  });

  // 소프트웨어 변경 요청 뮤테이션
  const createMutation = useMutation({
    mutationFn: async (data: typeof newChange) => {
      return softwareApi.createSoftwareChange({
        equipmentId,
        softwareName: data.softwareName,
        previousVersion: data.previousVersion || undefined,
        newVersion: data.newVersion,
        verificationRecord: data.verificationRecord,
      });
    },
    onSuccess: () => {
      toast({
        title: t('toast.createSuccess'),
        description: t('toast.createSuccessDesc'),
      });
      setIsCreateDialogOpen(false);
      setNewChange({
        softwareName: '',
        previousVersion: '',
        newVersion: '',
        verificationRecord: '',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('toast.createError'),
        description: error.message || t('toast.createErrorFallback'),
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.software.history(equipmentId) });
    },
  });

  const handleCreateSubmit = () => {
    if (!newChange.softwareName.trim()) {
      toast({
        title: t('validation.inputError'),
        description: t('validation.softwareNameRequired'),
        variant: 'destructive',
      });
      return;
    }
    if (!newChange.newVersion.trim()) {
      toast({
        title: t('validation.inputError'),
        description: t('validation.newVersionRequired'),
        variant: 'destructive',
      });
      return;
    }
    if (!newChange.verificationRecord.trim()) {
      toast({
        title: t('validation.inputError'),
        description: t('validation.verificationRequired'),
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate(newChange);
  };

  const getStatusIcon = (status: SoftwareApprovalStatus) => {
    const iconClasses = TOKENS.statusIcon[status as keyof typeof TOKENS.statusIcon];
    switch (status) {
      case SAVal.APPROVED:
        return <CheckCircle2 className={iconClasses ?? TOKENS.statusIcon.pending} />;
      case SAVal.REJECTED:
        return <XCircle className={iconClasses ?? TOKENS.statusIcon.pending} />;
      default:
        return <Clock className={TOKENS.statusIcon.pending} />;
    }
  };

  const isLoading = isLoadingEquipment || isLoadingHistory;

  if (isLoading) {
    return (
      <div className={TOKENS.skeleton.container}>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={TOKENS.container}>
      <div className={TOKENS.nav.container}>
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className={TOKENS.nav.backIcon} />
          {t('back')}
        </Button>
      </div>

      <div className={TOKENS.header.container}>
        <div>
          <h1 className={TOKENS.header.title}>{t('title')}</h1>
          <p className={TOKENS.header.subtitle}>
            {equipment?.name || ''} ({equipment?.managementNumber || equipmentId})
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('createRequest')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('dialog.title')}</DialogTitle>
              <DialogDescription>{t('dialog.description')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="softwareName">{t('dialog.softwareNameLabel')} *</Label>
                <Input
                  id="softwareName"
                  placeholder={t('dialog.softwareNamePlaceholder')}
                  value={newChange.softwareName}
                  onChange={(e) => setNewChange({ ...newChange, softwareName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="previousVersion">{t('dialog.previousVersionLabel')}</Label>
                  <Input
                    id="previousVersion"
                    placeholder={t('dialog.previousVersionPlaceholder')}
                    value={newChange.previousVersion}
                    onChange={(e) =>
                      setNewChange({ ...newChange, previousVersion: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newVersion">{t('dialog.newVersionLabel')} *</Label>
                  <Input
                    id="newVersion"
                    placeholder={t('dialog.newVersionPlaceholder')}
                    value={newChange.newVersion}
                    onChange={(e) => setNewChange({ ...newChange, newVersion: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="verificationRecord">{t('dialog.verificationLabel')} *</Label>
                <Textarea
                  id="verificationRecord"
                  placeholder={t('dialog.verificationPlaceholder')}
                  value={newChange.verificationRecord}
                  onChange={(e) =>
                    setNewChange({ ...newChange, verificationRecord: e.target.value })
                  }
                  className="min-h-[120px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setNewChange({
                    softwareName: '',
                    previousVersion: '',
                    newVersion: '',
                    verificationRecord: '',
                  });
                }}
              >
                {t('dialog.cancel')}
              </Button>
              <Button onClick={handleCreateSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? t('dialog.submitting') : t('dialog.submit')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 현재 소프트웨어 정보 */}
      {equipment?.softwareName && (
        <Card>
          <CardHeader>
            <CardTitle>{t('currentInfo.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={TOKENS.currentInfo.grid}>
              <div>
                <p className={TOKENS.currentInfo.label}>{t('currentInfo.name')}</p>
                <p className={TOKENS.currentInfo.value}>{equipment.softwareName}</p>
              </div>
              <div>
                <p className={TOKENS.currentInfo.label}>{t('currentInfo.version')}</p>
                <p className={TOKENS.currentInfo.value}>{equipment.softwareVersion || '-'}</p>
              </div>
              <div>
                <p className={TOKENS.currentInfo.label}>{t('currentInfo.type')}</p>
                <p className={TOKENS.currentInfo.value}>{equipment.softwareType || '-'}</p>
              </div>
              <div>
                <p className={TOKENS.currentInfo.label}>{t('currentInfo.firmwareVersion')}</p>
                <p className={TOKENS.currentInfo.value}>{equipment.firmwareVersion || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 변경 이력 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('history.title')}</CardTitle>
          <CardDescription>
            {t('history.count', { count: historyData?.data?.length || 0 })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!historyData?.data || historyData.data.length === 0 ? (
            <div className={TOKENS.emptyState.container}>
              <History className={TOKENS.emptyState.icon} />
              <p>{t('history.empty')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('history.colSoftware')}</TableHead>
                  <TableHead>{t('history.colVersionChange')}</TableHead>
                  <TableHead>{t('history.colChangedDate')}</TableHead>
                  <TableHead>{t('history.colStatus')}</TableHead>
                  <TableHead>{t('history.colVerification')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyData.data.map((item: SoftwareHistory) => (
                  <TableRow key={item.id} className={TOKENS.table.row}>
                    <TableCell className={TOKENS.table.cellName}>{item.softwareName}</TableCell>
                    <TableCell>
                      <div className={TOKENS.table.versionBadge}>
                        {item.previousVersion && (
                          <>
                            <Badge variant="outline">{item.previousVersion}</Badge>
                            <span>-&gt;</span>
                          </>
                        )}
                        <Badge variant="default">{item.newVersion}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(item.changedAt), 'yyyy-MM-dd HH:mm')}</TableCell>
                    <TableCell>
                      <div className={TOKENS.table.statusCell}>
                        {getStatusIcon(item.approvalStatus)}
                        <Badge className={SOFTWARE_APPROVAL_BADGE_TOKENS[item.approvalStatus]}>
                          {SOFTWARE_APPROVAL_STATUS_LABELS[item.approvalStatus]}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell
                      className={TOKENS.table.truncatedCell}
                      title={item.verificationRecord}
                    >
                      {item.verificationRecord}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
