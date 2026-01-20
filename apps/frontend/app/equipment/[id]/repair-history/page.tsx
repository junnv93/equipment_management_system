'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getRepairHistoryByEquipment,
  getRepairSummary,
  createRepairHistory,
  updateRepairHistory,
  deleteRepairHistory,
  RepairHistory,
  RepairResult,
  CreateRepairHistoryDto,
} from '@/lib/api/repair-history-api';
import RepairHistoryTimeline from '@/components/equipment/RepairHistoryTimeline';
import { format } from 'date-fns';
import { ArrowLeft, Plus, Wrench, DollarSign, Hash } from 'lucide-react';
import Link from 'next/link';

const REPAIR_RESULT_OPTIONS = [
  { value: 'completed', label: '수리 완료' },
  { value: 'partial', label: '부분 수리' },
  { value: 'failed', label: '수리 실패' },
];

export default function EquipmentRepairHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const equipmentId = params.id as string;

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<RepairHistory | null>(null);
  const [formData, setFormData] = useState<CreateRepairHistoryDto>({
    repairDate: '',
    repairDescription: '',
    repairedBy: '',
    repairCompany: '',
    cost: undefined,
    repairResult: undefined,
    notes: '',
  });

  // 수리 이력 조회
  const { data: repairData, isLoading } = useQuery({
    queryKey: ['repair-history', equipmentId],
    queryFn: () => getRepairHistoryByEquipment(equipmentId, { sort: 'repairDate.desc' }),
    enabled: !!equipmentId,
  });

  // 수리 비용 요약 조회
  const { data: summary } = useQuery({
    queryKey: ['repair-summary', equipmentId],
    queryFn: () => getRepairSummary(equipmentId),
    enabled: !!equipmentId,
  });

  // 수리 이력 생성
  const createMutation = useMutation({
    mutationFn: (dto: CreateRepairHistoryDto) => createRepairHistory(equipmentId, dto),
    onSuccess: () => {
      toast({ title: '성공', description: '수리 이력이 등록되었습니다.' });
      queryClient.invalidateQueries({ queryKey: ['repair-history', equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['repair-summary', equipmentId] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: '오류',
        description: error.message || '수리 이력 등록 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 수리 이력 수정
  const updateMutation = useMutation({
    mutationFn: (params: { uuid: string; dto: Partial<CreateRepairHistoryDto> }) =>
      updateRepairHistory(params.uuid, params.dto),
    onSuccess: () => {
      toast({ title: '성공', description: '수리 이력이 수정되었습니다.' });
      queryClient.invalidateQueries({ queryKey: ['repair-history', equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['repair-summary', equipmentId] });
      setIsEditDialogOpen(false);
      setSelectedRepair(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: '오류',
        description: error.message || '수리 이력 수정 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 수리 이력 삭제
  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => deleteRepairHistory(uuid),
    onSuccess: () => {
      toast({ title: '성공', description: '수리 이력이 삭제되었습니다.' });
      queryClient.invalidateQueries({ queryKey: ['repair-history', equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['repair-summary', equipmentId] });
      setIsDeleteDialogOpen(false);
      setSelectedRepair(null);
    },
    onError: (error: any) => {
      toast({
        title: '오류',
        description: error.message || '수리 이력 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      repairDate: '',
      repairDescription: '',
      repairedBy: '',
      repairCompany: '',
      cost: undefined,
      repairResult: undefined,
      notes: '',
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setFormData((prev) => ({
      ...prev,
      repairDate: format(new Date(), 'yyyy-MM-dd'),
    }));
    setIsCreateDialogOpen(true);
  };

  const handleOpenEdit = (repair: RepairHistory) => {
    setSelectedRepair(repair);
    setFormData({
      repairDate: format(new Date(repair.repairDate), 'yyyy-MM-dd'),
      repairDescription: repair.repairDescription,
      repairedBy: repair.repairedBy || '',
      repairCompany: repair.repairCompany || '',
      cost: repair.cost,
      repairResult: repair.repairResult,
      notes: repair.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDelete = (repair: RepairHistory) => {
    setSelectedRepair(repair);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = () => {
    if (!formData.repairDate || !formData.repairDescription) {
      toast({
        title: '입력 오류',
        description: '수리 일자와 수리 내용은 필수 항목입니다.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.repairDescription.length < 10) {
      toast({
        title: '입력 오류',
        description: '수리 내용은 최소 10자 이상 입력해야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedRepair) return;

    if (!formData.repairDate || !formData.repairDescription) {
      toast({
        title: '입력 오류',
        description: '수리 일자와 수리 내용은 필수 항목입니다.',
        variant: 'destructive',
      });
      return;
    }

    updateMutation.mutate({ uuid: selectedRepair.uuid, dto: formData });
  };

  const handleDelete = () => {
    if (!selectedRepair) return;
    deleteMutation.mutate(selectedRepair.uuid);
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '0';
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const repairs = repairData?.items || [];

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/equipment/${equipmentId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">수리 이력</h1>
            <p className="text-muted-foreground">장비 ID: {equipmentId}</p>
          </div>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          수리 이력 추가
        </Button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 수리 횟수</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.count || 0}회</div>
            <p className="text-xs text-muted-foreground mt-1">전체 수리 이력 건수</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 수리 비용</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.totalCost)}원</div>
            <p className="text-xs text-muted-foreground mt-1">누적 수리 비용</p>
          </CardContent>
        </Card>
      </div>

      {/* 수리 이력 타임라인 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            수리 이력 타임라인
          </CardTitle>
          <CardDescription>장비의 수리 이력을 시간순으로 확인합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <RepairHistoryTimeline
            repairs={repairs}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
            onAdd={handleOpenCreate}
            canEdit={true}
          />
        </CardContent>
      </Card>

      {/* 생성 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>수리 이력 등록</DialogTitle>
            <DialogDescription>새로운 수리 이력을 등록합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="repairDate">수리 일자 *</Label>
              <Input
                id="repairDate"
                type="date"
                value={formData.repairDate}
                onChange={(e) => setFormData({ ...formData, repairDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repairDescription">수리 내용 * (최소 10자)</Label>
              <Textarea
                id="repairDescription"
                placeholder="수리 내용을 상세히 입력해주세요"
                value={formData.repairDescription}
                onChange={(e) => setFormData({ ...formData, repairDescription: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="repairedBy">수리 담당자</Label>
                <Input
                  id="repairedBy"
                  placeholder="홍길동"
                  value={formData.repairedBy || ''}
                  onChange={(e) => setFormData({ ...formData, repairedBy: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repairCompany">외부 수리 업체</Label>
                <Input
                  id="repairCompany"
                  placeholder="키사이트 코리아"
                  value={formData.repairCompany || ''}
                  onChange={(e) => setFormData({ ...formData, repairCompany: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost">수리 비용 (원)</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  placeholder="500000"
                  value={formData.cost || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cost: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repairResult">수리 결과</Label>
                <Select
                  value={formData.repairResult || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, repairResult: value as RepairResult })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPAIR_RESULT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">비고</Label>
              <Textarea
                id="notes"
                placeholder="추가 참고사항"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? '등록 중...' : '등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>수리 이력 수정</DialogTitle>
            <DialogDescription>수리 이력을 수정합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editRepairDate">수리 일자 *</Label>
              <Input
                id="editRepairDate"
                type="date"
                value={formData.repairDate}
                onChange={(e) => setFormData({ ...formData, repairDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRepairDescription">수리 내용 * (최소 10자)</Label>
              <Textarea
                id="editRepairDescription"
                placeholder="수리 내용을 상세히 입력해주세요"
                value={formData.repairDescription}
                onChange={(e) => setFormData({ ...formData, repairDescription: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editRepairedBy">수리 담당자</Label>
                <Input
                  id="editRepairedBy"
                  placeholder="홍길동"
                  value={formData.repairedBy || ''}
                  onChange={(e) => setFormData({ ...formData, repairedBy: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRepairCompany">외부 수리 업체</Label>
                <Input
                  id="editRepairCompany"
                  placeholder="키사이트 코리아"
                  value={formData.repairCompany || ''}
                  onChange={(e) => setFormData({ ...formData, repairCompany: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editCost">수리 비용 (원)</Label>
                <Input
                  id="editCost"
                  type="number"
                  min="0"
                  placeholder="500000"
                  value={formData.cost || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cost: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRepairResult">수리 결과</Label>
                <Select
                  value={formData.repairResult || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, repairResult: value as RepairResult })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPAIR_RESULT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editNotes">비고</Label>
              <Textarea
                id="editNotes"
                placeholder="추가 참고사항"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? '수정 중...' : '수정'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>수리 이력 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 수리 이력을 삭제하시겠습니까? 삭제된 이력은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
