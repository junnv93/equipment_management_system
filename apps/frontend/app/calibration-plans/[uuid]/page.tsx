'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import calibrationPlansApi, {
  CalibrationPlan,
  CalibrationPlanItem,
  CALIBRATION_PLAN_STATUS_LABELS,
  CALIBRATION_PLAN_STATUS_COLORS,
  SITE_LABELS,
} from '@/lib/api/calibration-plans-api';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Send,
  Trash2,
  CheckCircle2,
  Edit2,
  Save,
  X,
  AlertCircle,
  FileText,
  Download,
} from 'lucide-react';

export default function CalibrationPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const uuid = params.uuid as string;
  const { toast } = useToast();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [editingItemUuid, setEditingItemUuid] = useState<string | null>(null);
  const [editingAgency, setEditingAgency] = useState('');
  const [editingNotes, setEditingNotes] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  // 계획서 상세 조회
  const {
    data: plan,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['calibration-plan', uuid],
    queryFn: () => calibrationPlansApi.getCalibrationPlan(uuid),
    enabled: !!uuid,
  });

  // 승인 요청 뮤테이션
  const submitMutation = useMutation({
    mutationFn: () => calibrationPlansApi.submitCalibrationPlan(uuid),
    onSuccess: () => {
      toast({
        title: '승인 요청 완료',
        description: '교정계획서가 승인 요청되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['calibration-plan', uuid] });
      setIsSubmitDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: '승인 요청 실패',
        description: error.response?.data?.message || '승인 요청 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: () => calibrationPlansApi.deleteCalibrationPlan(uuid),
    onSuccess: () => {
      toast({
        title: '삭제 완료',
        description: '교정계획서가 삭제되었습니다.',
      });
      router.push('/calibration-plans');
    },
    onError: (error: any) => {
      toast({
        title: '삭제 실패',
        description: error.response?.data?.message || '삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 항목 수정 뮤테이션
  const updateItemMutation = useMutation({
    mutationFn: ({
      itemUuid,
      data,
    }: {
      itemUuid: string;
      data: { plannedCalibrationAgency?: string; notes?: string };
    }) => calibrationPlansApi.updatePlanItem(uuid, itemUuid, data),
    onSuccess: () => {
      toast({
        title: '항목 수정 완료',
        description: '항목이 수정되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['calibration-plan', uuid] });
      setEditingItemUuid(null);
    },
    onError: (error: any) => {
      toast({
        title: '항목 수정 실패',
        description: error.response?.data?.message || '항목 수정 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 항목 확인 뮤테이션
  const confirmItemMutation = useMutation({
    mutationFn: (itemUuid: string) =>
      calibrationPlansApi.confirmPlanItem(uuid, itemUuid, {
        confirmedBy: session?.user?.id as string,
      }),
    onSuccess: () => {
      toast({
        title: '확인 완료',
        description: '항목이 확인되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['calibration-plan', uuid] });
    },
    onError: (error: any) => {
      toast({
        title: '확인 실패',
        description: error.response?.data?.message || '항목 확인 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  const handleStartEdit = (item: CalibrationPlanItem) => {
    setEditingItemUuid(item.uuid);
    setEditingAgency(item.plannedCalibrationAgency || '');
    setEditingNotes(item.notes || '');
  };

  const handleSaveEdit = () => {
    if (!editingItemUuid) return;
    updateItemMutation.mutate({
      itemUuid: editingItemUuid,
      data: {
        plannedCalibrationAgency: editingAgency,
        notes: editingNotes,
      },
    });
  };

  const handleCancelEdit = () => {
    setEditingItemUuid(null);
    setEditingAgency('');
    setEditingNotes('');
  };

  const handlePrintView = () => {
    calibrationPlansApi.openPrintView(uuid);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>오류</AlertTitle>
          <AlertDescription>교정계획서를 불러오는 중 오류가 발생했습니다.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isDraft = plan.status === 'draft';
  const isApproved = plan.status === 'approved';
  const items = plan.items || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/calibration-plans">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {plan.year}년 {SITE_LABELS[plan.siteId]} 교정계획서
              </h1>
              <Badge className={CALIBRATION_PLAN_STATUS_COLORS[plan.status]}>
                {CALIBRATION_PLAN_STATUS_LABELS[plan.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              작성자: {plan.createdBy} | 작성일: {format(new Date(plan.createdAt), 'yyyy-MM-dd')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isApproved && (
            <Button variant="outline" onClick={handlePrintView}>
              <Download className="h-4 w-4 mr-2" />
              인쇄/PDF
            </Button>
          )}
          {isDraft && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                삭제
              </Button>
              <Button
                onClick={() => setIsSubmitDialogOpen(true)}
                disabled={submitMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                승인 요청
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 반려 사유 표시 */}
      {plan.status === 'rejected' && plan.rejectionReason && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>반려됨</AlertTitle>
          <AlertDescription>{plan.rejectionReason}</AlertDescription>
        </Alert>
      )}

      {/* 승인 정보 */}
      {plan.approvedAt && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 text-sm">
              <span>승인자: {plan.approvedBy}</span>
              <span>승인일: {format(new Date(plan.approvedAt), 'yyyy-MM-dd HH:mm')}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 항목 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>교정 계획 항목</CardTitle>
          <CardDescription>총 {items.length}개의 장비가 포함되어 있습니다</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>계획서에 포함된 장비가 없습니다</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">순번</TableHead>
                    <TableHead>관리번호</TableHead>
                    <TableHead>장비명</TableHead>
                    <TableHead className="text-center" colSpan={3}>
                      현황 (스냅샷)
                    </TableHead>
                    <TableHead className="text-center" colSpan={3}>
                      계획
                    </TableHead>
                    <TableHead>비고</TableHead>
                    {(isDraft || isApproved) && <TableHead className="w-[100px]">액션</TableHead>}
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    <TableHead>유효일자</TableHead>
                    <TableHead>교정주기</TableHead>
                    <TableHead>교정기관</TableHead>
                    <TableHead>교정일자</TableHead>
                    <TableHead>교정기관</TableHead>
                    <TableHead>확인</TableHead>
                    <TableHead>실제교정일</TableHead>
                    {(isDraft || isApproved) && <TableHead></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: CalibrationPlanItem) => (
                    <TableRow key={item.uuid}>
                      <TableCell>{item.sequenceNumber}</TableCell>
                      <TableCell className="font-mono">
                        {item.equipment?.managementNumber || '-'}
                      </TableCell>
                      <TableCell>{item.equipment?.name || '-'}</TableCell>
                      <TableCell>
                        {item.snapshotValidityDate
                          ? format(new Date(item.snapshotValidityDate), 'yyyy-MM-dd')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {item.snapshotCalibrationCycle
                          ? `${item.snapshotCalibrationCycle}개월`
                          : '-'}
                      </TableCell>
                      <TableCell>{item.snapshotCalibrationAgency || '-'}</TableCell>
                      <TableCell>
                        {item.plannedCalibrationDate
                          ? format(new Date(item.plannedCalibrationDate), 'yyyy-MM-dd')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {editingItemUuid === item.uuid ? (
                          <Input
                            value={editingAgency}
                            onChange={(e) => setEditingAgency(e.target.value)}
                            className="w-[100px]"
                          />
                        ) : (
                          item.plannedCalibrationAgency || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {item.confirmedBy ? (
                          <Badge variant="outline" className="bg-green-50">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            확인됨
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingItemUuid === item.uuid ? (
                          <Input
                            value={editingNotes}
                            onChange={(e) => setEditingNotes(e.target.value)}
                            placeholder="비고"
                            className="w-[100px]"
                          />
                        ) : (
                          <>
                            {item.actualCalibrationDate
                              ? format(new Date(item.actualCalibrationDate), 'yyyy-MM-dd')
                              : item.notes || '-'}
                          </>
                        )}
                      </TableCell>
                      {(isDraft || isApproved) && (
                        <TableCell>
                          {editingItemUuid === item.uuid ? (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={updateItemMutation.isPending}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              {isDraft && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStartEdit(item)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              )}
                              {isApproved && !item.confirmedBy && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => confirmItemMutation.mutate(item.uuid)}
                                  disabled={confirmItemMutation.isPending}
                                  title="확인"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>계획서 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 교정계획서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 승인 요청 확인 다이얼로그 */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>승인 요청</DialogTitle>
            <DialogDescription>
              교정계획서를 시험소장에게 승인 요청하시겠습니까? 승인 요청 후에는 수정이 불가합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
              승인 요청
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
