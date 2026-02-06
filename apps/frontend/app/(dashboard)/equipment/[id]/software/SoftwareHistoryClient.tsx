'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
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
  SOFTWARE_APPROVAL_STATUS_COLORS,
  SoftwareApprovalStatus,
} from '@/lib/api/software-api';
// ✅ 직접 import (barrel import 제거)
import equipmentApi from '@/lib/api/equipment-api';
import { format } from 'date-fns';
import { ArrowLeft, Plus, History, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from 'next-auth/react';

interface SoftwareHistoryClientProps {
  equipmentId: string;
}

export default function SoftwareHistoryClient({ equipmentId }: SoftwareHistoryClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newChange, setNewChange] = useState({
    softwareName: '',
    previousVersion: '',
    newVersion: '',
    verificationRecord: '',
  });

  // 장비 정보 조회
  const { data: equipment, isLoading: isLoadingEquipment } = useQuery({
    queryKey: ['equipment', equipmentId],
    queryFn: () => equipmentApi.getEquipment(equipmentId),
  });

  // 소프트웨어 변경 이력 조회
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['software-history', equipmentId],
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
        changedBy: session?.user?.id as string,
      });
    },
    onSuccess: () => {
      toast({
        title: '변경 요청 완료',
        description: '소프트웨어 변경 요청이 등록되었습니다. 기술책임자의 승인을 기다려주세요.',
      });
      queryClient.invalidateQueries({ queryKey: ['software-history', equipmentId] });
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
        title: '변경 요청 실패',
        description: error.message || '소프트웨어 변경 요청 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  const handleCreateSubmit = () => {
    if (!newChange.softwareName.trim()) {
      toast({
        title: '입력 오류',
        description: '소프트웨어명을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    if (!newChange.newVersion.trim()) {
      toast({
        title: '입력 오류',
        description: '새 버전을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }
    if (!newChange.verificationRecord.trim()) {
      toast({
        title: '입력 오류',
        description: '검증 기록은 필수입니다.',
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate(newChange);
  };

  const getStatusIcon = (status: SoftwareApprovalStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const isLoading = isLoadingEquipment || isLoadingHistory;

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로가기
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">소프트웨어 변경 이력</h1>
          <p className="text-muted-foreground">
            {equipment?.name || '장비'} ({equipment?.managementNumber || equipmentId})
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              변경 요청
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>소프트웨어 변경 요청</DialogTitle>
              <DialogDescription>
                소프트웨어 변경 내용과 검증 기록을 입력하세요. 검증 기록은 필수입니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="softwareName">소프트웨어명 *</Label>
                <Input
                  id="softwareName"
                  placeholder="예: EMC32"
                  value={newChange.softwareName}
                  onChange={(e) => setNewChange({ ...newChange, softwareName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="previousVersion">이전 버전</Label>
                  <Input
                    id="previousVersion"
                    placeholder="예: 10.2.0"
                    value={newChange.previousVersion}
                    onChange={(e) =>
                      setNewChange({ ...newChange, previousVersion: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newVersion">새 버전 *</Label>
                  <Input
                    id="newVersion"
                    placeholder="예: 10.3.0"
                    value={newChange.newVersion}
                    onChange={(e) => setNewChange({ ...newChange, newVersion: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="verificationRecord">검증 기록 *</Label>
                <Textarea
                  id="verificationRecord"
                  placeholder="변경 후 검증 내용을 상세히 입력하세요 (예: 기존 측정 결과와 비교하여 0.1dB 이내 차이 확인)"
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
                취소
              </Button>
              <Button onClick={handleCreateSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? '요청 중...' : '변경 요청'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 현재 소프트웨어 정보 */}
      {equipment?.softwareName && (
        <Card>
          <CardHeader>
            <CardTitle>현재 소프트웨어 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">소프트웨어명</p>
                <p className="font-medium">{equipment.softwareName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">버전</p>
                <p className="font-medium">{equipment.softwareVersion || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">타입</p>
                <p className="font-medium">{equipment.softwareType || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">펌웨어 버전</p>
                <p className="font-medium">{equipment.firmwareVersion || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 변경 이력 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>변경 이력</CardTitle>
          <CardDescription>
            총 {historyData?.data?.length || 0}개의 변경 이력이 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!historyData?.data || historyData.data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>소프트웨어 변경 이력이 없습니다</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>소프트웨어명</TableHead>
                  <TableHead>버전 변경</TableHead>
                  <TableHead>변경일</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>검증 기록</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyData.data.map((item: SoftwareHistory) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.softwareName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
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
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.approvalStatus)}
                        <Badge className={SOFTWARE_APPROVAL_STATUS_COLORS[item.approvalStatus]}>
                          {SOFTWARE_APPROVAL_STATUS_LABELS[item.approvalStatus]}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={item.verificationRecord}>
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
