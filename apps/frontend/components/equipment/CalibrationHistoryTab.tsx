'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';
import calibrationApi, { type CreateCalibrationDto, type Calibration } from '@/lib/api/calibration-api';
import dayjs from 'dayjs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import {
  CalibrationResultEnum,
  CALIBRATION_RESULT_LABELS,
  CALIBRATION_APPROVAL_STATUS_LABELS,
  type CalibrationResult,
} from '@equipment-management/schemas';

// 교정 등록 스키마
const calibrationSchema = z.object({
  calibrationDate: z.string().min(1, '교정일을 입력하세요'),
  nextCalibrationDate: z.string().min(1, '다음 교정일을 입력하세요'),
  calibrationAgency: z.string().min(1, '교정 기관을 입력하세요').max(100),
  certificateNumber: z.string().min(1, '교정성적서 번호를 입력하세요').max(100),
  calibrationCycle: z.coerce.number().min(1, '교정 주기를 입력하세요 (최소 1개월)'),
  calibrationResult: CalibrationResultEnum, // SSOT 적용
  notes: z.string().optional(),
});

type CalibrationFormData = z.infer<typeof calibrationSchema>;

interface CalibrationHistoryTabProps {
  equipment: Equipment;
}

// SSOT에서 import한 CALIBRATION_RESULT_LABELS, CALIBRATION_APPROVAL_STATUS_LABELS 사용
// 기존 대문자 값과의 호환성을 위한 매핑 (레거시 데이터 지원)
const LEGACY_RESULT_MAP: Record<string, CalibrationResult> = {
  PASS: 'pass',
  FAIL: 'fail',
  CONDITIONAL: 'conditional',
};

// 결과값 라벨 가져오기 (레거시 대문자 값 호환)
const getResultLabel = (result: string): string => {
  const normalizedResult = LEGACY_RESULT_MAP[result] || result;
  return CALIBRATION_RESULT_LABELS[normalizedResult as CalibrationResult] || result;
};

/**
 * 교정 이력 탭 - 테이블 UI
 *
 * 특이사항:
 * - 교정 API 사용 (equipment API와 별도)
 * - 승인 프로세스 포함 (시험실무자 등록 → 기술책임자 승인)
 */
export function CalibrationHistoryTab({ equipment }: CalibrationHistoryTabProps) {
  const { hasRole, user: _user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // 파일 업로드 상태
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  // 폼 설정
  const form = useForm<CalibrationFormData>({
    resolver: zodResolver(calibrationSchema),
    defaultValues: {
      calibrationDate: dayjs().format('YYYY-MM-DD'),
      nextCalibrationDate: dayjs().add(12, 'month').format('YYYY-MM-DD'),
      calibrationAgency: '',
      certificateNumber: '',
      calibrationCycle: 12,
      calibrationResult: undefined,
      notes: '',
    },
  });

  // 장비 식별자: 백엔드는 id 필드에 UUID를 저장
  const equipmentId = String(equipment.id);

  // 교정 이력 조회
  // API Client에서 페이지네이션 응답 처리 완료 → 배열로 반환
  const { data: calibrations = [], isLoading } = useQuery({
    queryKey: ['calibrations', 'equipment', equipmentId],
    queryFn: () => calibrationApi.getEquipmentCalibrations(equipmentId),
    enabled: !!equipmentId,
  });

  // 교정 등록 mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateCalibrationDto) => calibrationApi.createCalibration(data),
  });

  // 파일 업로드 mutation
  const uploadMutation = useMutation({
    mutationFn: ({ calibrationId, file }: { calibrationId: string; file: File }) =>
      calibrationApi.uploadCertificate(calibrationId, file),
  });

  // 폼 제출 핸들러: 교정 등록 → 파일 업로드 순차 실행
  const handleSubmit = async (data: CalibrationFormData) => {
    // 파일 업로드 검증
    if (!certificateFile) {
      toast({
        title: '파일 필요',
        description: '교정성적서 파일을 첨부해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // 1. 교정 기록 생성
      const calibration = await createMutation.mutateAsync({
        equipmentId: equipmentId,
        calibrationDate: data.calibrationDate,
        nextCalibrationDate: data.nextCalibrationDate,
        calibrationAgency: data.calibrationAgency,
        certificateNumber: data.certificateNumber,
        calibrationCycle: data.calibrationCycle,
        calibrationResult: data.calibrationResult,
        notes: data.notes || undefined,
      });

      // 2. 교정성적서 파일 업로드
      if (calibration?.id) {
        await uploadMutation.mutateAsync({
          calibrationId: calibration.id,
          file: certificateFile,
        });
      }

      // 3. 성공 처리
      queryClient.invalidateQueries({ queryKey: ['calibrations', 'equipment', equipmentId] });
      setIsDialogOpen(false);
      setCertificateFile(null);
      form.reset({
        calibrationDate: dayjs().format('YYYY-MM-DD'),
        nextCalibrationDate: dayjs().add(12, 'month').format('YYYY-MM-DD'),
        calibrationAgency: '',
        certificateNumber: '',
        calibrationCycle: 12,
        calibrationResult: undefined,
        notes: '',
      });
      toast({
        title: '교정 이력 등록 완료',
        description: '교정 이력이 성공적으로 등록되었습니다. 승인을 기다리고 있습니다.',
      });
    } catch (error: unknown) {
      console.error('교정 이력 등록 실패:', error);
      toast({
        title: '등록 실패',
        description: getErrorMessage(error, '교정 이력 등록 중 오류가 발생했습니다.'),
        variant: 'destructive',
      });
    }
  };

  // 전체 로딩 상태 (교정 등록 또는 파일 업로드 중)
  const isSubmitting = createMutation.isPending || uploadMutation.isPending;

  // 교정일 변경 시 다음 교정일 자동 계산
  const handleCalibrationDateChange = (date: string) => {
    const currentCycle = form.getValues('calibrationCycle') || 12;
    const nextDate = dayjs(date).add(currentCycle, 'month').format('YYYY-MM-DD');
    form.setValue('nextCalibrationDate', nextDate);
  };

  // 교정 주기 변경 시 다음 교정일 자동 계산
  const handleCycleChange = (cycle: number) => {
    const currentDate = form.getValues('calibrationDate');
    if (currentDate) {
      const nextDate = dayjs(currentDate).add(cycle, 'month').format('YYYY-MM-DD');
      form.setValue('nextCalibrationDate', nextDate);
    }
  };

  // 등록 권한 확인: UL-QP-18에 따라 시험실무자만 등록 가능 (lab_manager/system_admin은 모든 권한)
  const canCreate = hasRole(['test_engineer', 'lab_manager', 'system_admin']);

  // 등록 Dialog
  const RegisterDialog = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          교정 등록
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>교정 이력 등록</DialogTitle>
          <DialogDescription>
            교정 정보를 입력하세요. 등록 후 기술책임자의 승인이 필요합니다.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="calibrationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>교정일 *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleCalibrationDateChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="calibrationCycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>교정 주기 (개월) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleCycleChange(parseInt(e.target.value) || 12);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="nextCalibrationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>다음 교정일 *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="calibrationAgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>교정 기관 *</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 한국표준과학연구원(KRISS)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="certificateNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>교정성적서 번호 *</FormLabel>
                  <FormControl>
                    <Input placeholder="예: CAL-2026-0001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="calibrationResult"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>교정 결과 *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="결과 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CalibrationResultEnum.options.map((value) => (
                        <SelectItem key={value} value={value}>
                          {CALIBRATION_RESULT_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>교정성적서 파일 *</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">PDF 또는 이미지 파일 (최대 10MB)</p>
              {!certificateFile && (
                <p className="text-xs text-destructive">교정성적서 파일을 첨부해주세요</p>
              )}
            </FormItem>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비고</FormLabel>
                  <FormControl>
                    <Textarea placeholder="교정 관련 특이사항" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '저장 중...' : '등록 (승인 요청)'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );

  // 로딩 상태
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  // 빈 상태
  if (!calibrations || calibrations.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-ul-midnight" />
            교정 이력
          </CardTitle>
          {canCreate && RegisterDialog}
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>등록된 교정 이력이 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-ul-midnight" />
          교정 이력
        </CardTitle>
        {canCreate && RegisterDialog}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>교정일</TableHead>
              <TableHead>다음 교정일</TableHead>
              <TableHead>교정 기관</TableHead>
              <TableHead>결과</TableHead>
              <TableHead>승인 상태</TableHead>
              <TableHead>비고</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calibrations.map((cal: Calibration) => (
              <TableRow key={cal.id}>
                <TableCell>{dayjs(cal.calibrationDate).format('YYYY-MM-DD')}</TableCell>
                <TableCell>{dayjs(cal.nextCalibrationDate).format('YYYY-MM-DD')}</TableCell>
                <TableCell>{cal.calibrationAgency}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      cal.calibrationResult === 'pass' || cal.calibrationResult === 'PASS'
                        ? 'default'
                        : cal.calibrationResult === 'conditional' || cal.calibrationResult === 'CONDITIONAL'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {getResultLabel(cal.calibrationResult)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {cal.approvalStatus && (
                    <Badge
                      variant={
                        cal.approvalStatus === 'approved'
                          ? 'default'
                          : cal.approvalStatus === 'rejected'
                            ? 'destructive'
                            : 'outline'
                      }
                    >
                      {CALIBRATION_APPROVAL_STATUS_LABELS[cal.approvalStatus as keyof typeof CALIBRATION_APPROVAL_STATUS_LABELS] || cal.approvalStatus}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={cal.notes}>
                  {cal.notes || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
