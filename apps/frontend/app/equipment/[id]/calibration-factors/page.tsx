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
import { Skeleton } from '@/components/ui/skeleton';
import calibrationFactorsApi, {
  CalibrationFactor,
  CalibrationFactorType,
  FACTOR_TYPE_LABELS,
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_COLORS,
} from '@/lib/api/calibration-factors-api';
import { format } from 'date-fns';
import { ArrowLeft, Plus, Calculator, Clock, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function EquipmentCalibrationFactorsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const equipmentId = params.id as string;

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFactor, setNewFactor] = useState({
    factorType: '' as CalibrationFactorType | '',
    factorName: '',
    factorValue: '',
    unit: '',
    effectiveDate: '',
    expiryDate: '',
    parameters: '',
  });

  // 장비별 보정계수 조회
  const { data: equipmentFactors, isLoading } = useQuery({
    queryKey: ['equipment-factors', equipmentId],
    queryFn: () => calibrationFactorsApi.getEquipmentFactors(equipmentId),
    enabled: !!equipmentId,
  });

  // 전체 보정계수 조회 (대기 중인 것 포함)
  const { data: allFactors } = useQuery({
    queryKey: ['calibration-factors', equipmentId],
    queryFn: () => calibrationFactorsApi.getCalibrationFactors({ equipmentId }),
    enabled: !!equipmentId,
  });

  // 보정계수 생성 뮤테이션
  const createMutation = useMutation({
    mutationFn: calibrationFactorsApi.createCalibrationFactor,
    onSuccess: () => {
      toast({
        title: '변경 요청 완료',
        description: '보정계수 변경 요청이 등록되었습니다. 기술책임자의 승인을 기다려주세요.',
      });
      queryClient.invalidateQueries({ queryKey: ['equipment-factors', equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['calibration-factors', equipmentId] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: '요청 실패',
        description: error.message || '보정계수 변경 요청 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setNewFactor({
      factorType: '',
      factorName: '',
      factorValue: '',
      unit: '',
      effectiveDate: '',
      expiryDate: '',
      parameters: '',
    });
  };

  const handleCreate = () => {
    if (
      !newFactor.factorType ||
      !newFactor.factorName ||
      !newFactor.factorValue ||
      !newFactor.unit ||
      !newFactor.effectiveDate
    ) {
      toast({
        title: '입력 오류',
        description: '필수 항목을 모두 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    let parameters: Record<string, unknown> | undefined;
    if (newFactor.parameters) {
      try {
        parameters = JSON.parse(newFactor.parameters);
      } catch {
        toast({
          title: '입력 오류',
          description: '파라미터 형식이 올바르지 않습니다. JSON 형식으로 입력해주세요.',
          variant: 'destructive',
        });
        return;
      }
    }

    createMutation.mutate({
      equipmentId,
      factorType: newFactor.factorType as CalibrationFactorType,
      factorName: newFactor.factorName,
      factorValue: parseFloat(newFactor.factorValue),
      unit: newFactor.unit,
      effectiveDate: newFactor.effectiveDate,
      expiryDate: newFactor.expiryDate || undefined,
      parameters,
      requestedBy: session?.user?.id as string,
    });
  };

  const currentFactors = equipmentFactors?.factors || [];
  const pendingFactors = allFactors?.data?.filter((f) => f.approvalStatus === 'pending') || [];

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
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
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
            <h1 className="text-3xl font-bold tracking-tight">보정계수 관리</h1>
            <p className="text-muted-foreground">장비 ID: {equipmentId}</p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              보정계수 변경 요청
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>보정계수 변경 요청</DialogTitle>
              <DialogDescription>
                새로운 보정계수를 등록합니다. 기술책임자의 승인 후 적용됩니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="factorType">보정계수 타입 *</Label>
                <Select
                  value={newFactor.factorType}
                  onValueChange={(value) =>
                    setNewFactor({ ...newFactor, factorType: value as CalibrationFactorType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="타입 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FACTOR_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="factorName">보정계수 이름 *</Label>
                <Input
                  id="factorName"
                  placeholder="예: 3GHz 안테나 이득"
                  value={newFactor.factorName}
                  onChange={(e) => setNewFactor({ ...newFactor, factorName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="factorValue">값 *</Label>
                  <Input
                    id="factorValue"
                    type="number"
                    step="0.000001"
                    placeholder="12.5"
                    value={newFactor.factorValue}
                    onChange={(e) => setNewFactor({ ...newFactor, factorValue: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">단위 *</Label>
                  <Input
                    id="unit"
                    placeholder="dB, dBi, dBm"
                    value={newFactor.unit}
                    onChange={(e) => setNewFactor({ ...newFactor, unit: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="effectiveDate">적용 시작일 *</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={newFactor.effectiveDate}
                    onChange={(e) => setNewFactor({ ...newFactor, effectiveDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">만료일</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={newFactor.expiryDate}
                    onChange={(e) => setNewFactor({ ...newFactor, expiryDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parameters">추가 파라미터 (JSON)</Label>
                <Textarea
                  id="parameters"
                  placeholder='{"frequency": "3GHz", "temperature": "25C"}'
                  value={newFactor.parameters}
                  onChange={(e) => setNewFactor({ ...newFactor, parameters: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? '요청 중...' : '변경 요청'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 승인 대기 중인 요청 */}
      {pendingFactors.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Clock className="h-5 w-5" />
              승인 대기 중인 변경 요청
            </CardTitle>
            <CardDescription className="text-yellow-700">
              기술책임자의 승인을 기다리는 보정계수 변경 요청입니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>타입</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>값</TableHead>
                  <TableHead>적용 시작일</TableHead>
                  <TableHead>요청일</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingFactors.map((factor) => (
                  <TableRow key={factor.id}>
                    <TableCell>
                      <Badge variant="outline">{FACTOR_TYPE_LABELS[factor.factorType]}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{factor.factorName}</TableCell>
                    <TableCell>
                      {factor.factorValue} {factor.unit}
                    </TableCell>
                    <TableCell>{format(new Date(factor.effectiveDate), 'yyyy-MM-dd')}</TableCell>
                    <TableCell>
                      {format(new Date(factor.requestedAt), 'yyyy-MM-dd HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge className={APPROVAL_STATUS_COLORS[factor.approvalStatus]}>
                        {APPROVAL_STATUS_LABELS[factor.approvalStatus]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 현재 적용 중인 보정계수 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            현재 적용 중인 보정계수
          </CardTitle>
          <CardDescription>
            승인되어 현재 적용 중인 보정계수 목록입니다 (총 {currentFactors.length}개)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentFactors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>적용 중인 보정계수가 없습니다</p>
              <p className="text-sm mt-2">새로운 보정계수를 등록해주세요</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>타입</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>값</TableHead>
                  <TableHead>파라미터</TableHead>
                  <TableHead>적용 기간</TableHead>
                  <TableHead>승인일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentFactors.map((factor) => (
                  <TableRow key={factor.id}>
                    <TableCell>
                      <Badge variant="outline">{FACTOR_TYPE_LABELS[factor.factorType]}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{factor.factorName}</TableCell>
                    <TableCell className="font-mono">
                      {factor.factorValue} {factor.unit}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {factor.parameters ? (
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {JSON.stringify(factor.parameters)}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(factor.effectiveDate), 'yyyy-MM-dd')}
                      {factor.expiryDate && (
                        <> ~ {format(new Date(factor.expiryDate), 'yyyy-MM-dd')}</>
                      )}
                    </TableCell>
                    <TableCell>
                      {factor.approvedAt ? format(new Date(factor.approvedAt), 'yyyy-MM-dd') : '-'}
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
