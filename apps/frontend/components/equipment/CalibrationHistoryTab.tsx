'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
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
import { queryKeys } from '@/lib/api/query-config';
import { CONTENT_TOKENS, TIMELINE_TOKENS } from '@/lib/design-tokens';
import calibrationApi, {
  type CreateCalibrationDto,
  type Calibration,
} from '@/lib/api/calibration-api';
import { addMonths } from 'date-fns';
import { formatDate, toDate } from '@/lib/utils/date';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import {
  CalibrationResultEnum,
  CALIBRATION_RESULT_LABELS,
  CALIBRATION_APPROVAL_STATUS_LABELS,
  type CalibrationResult,
} from '@equipment-management/schemas';

// 교정 등록 스키마 (calibrationCycle은 UI 계산용, API 전송하지 않음)
const calibrationSchema = z.object({
  calibrationDate: z.string().min(1, '교정일을 입력하세요'),
  nextCalibrationDate: z.string().min(1, '다음 교정일을 입력하세요'),
  calibrationAgency: z.string().min(1, '교정 기관을 입력하세요').max(100),
  certificateNumber: z.string().min(1, '교정성적서 번호를 입력하세요').max(100),
  calibrationCycle: z.coerce.number().min(1, '교정 주기를 입력하세요 (최소 1개월)'),
  result: CalibrationResultEnum, // SSOT 적용 (lowercase: 'pass', 'fail', 'conditional')
  notes: z.string().optional(),
});

type CalibrationFormData = z.infer<typeof calibrationSchema>;

interface CalibrationHistoryTabProps {
  equipment: Equipment;
}

// 결과값 라벨 가져오기 (백엔드 정규화 완료 — lowercase만 수신)
const getResultLabel = (result: string): string => {
  return CALIBRATION_RESULT_LABELS[result as CalibrationResult] || result;
};

/**
 * 교정 이력 탭 - 테이블 UI
 *
 * 특이사항:
 * - 교정 API 사용 (equipment API와 별도)
 * - 승인 프로세스 포함 (시험실무자 등록 → 기술책임자 승인)
 */
export function CalibrationHistoryTab({ equipment }: CalibrationHistoryTabProps) {
  const t = useTranslations('equipment');
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
      calibrationDate: formatDate(new Date(), 'yyyy-MM-dd'),
      nextCalibrationDate: formatDate(addMonths(new Date(), 12), 'yyyy-MM-dd'),
      calibrationAgency: '',
      certificateNumber: '',
      calibrationCycle: 12,
      result: undefined,
      notes: '',
    },
  });

  // 장비 식별자: 백엔드는 id 필드에 UUID를 저장
  const equipmentId = String(equipment.id);

  // 교정 이력 조회
  // API Client에서 페이지네이션 응답 처리 완료 → 배열로 반환
  const { data: calibrations = [], isLoading } = useQuery({
    queryKey: queryKeys.calibrations.byEquipment(equipmentId),
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
        title: t('calibrationHistoryTab.toasts.fileRequired'),
        description: t('calibrationHistoryTab.toasts.fileRequiredDesc'),
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
        result: data.result,
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
      queryClient.invalidateQueries({ queryKey: queryKeys.calibrations.byEquipment(equipmentId) });
      setIsDialogOpen(false);
      setCertificateFile(null);
      form.reset({
        calibrationDate: formatDate(new Date(), 'yyyy-MM-dd'),
        nextCalibrationDate: formatDate(addMonths(new Date(), 12), 'yyyy-MM-dd'),
        calibrationAgency: '',
        certificateNumber: '',
        calibrationCycle: 12,
        result: undefined,
        notes: '',
      });
      toast({
        title: t('calibrationHistoryTab.toasts.success'),
        description: t('calibrationHistoryTab.toasts.successDesc'),
      });
    } catch (error: unknown) {
      console.error('Calibration registration failed:', error);
      toast({
        title: t('calibrationHistoryTab.toasts.error'),
        description: getErrorMessage(error, t('calibrationHistoryTab.toasts.errorDesc')),
        variant: 'destructive',
      });
    }
  };

  // 전체 로딩 상태 (교정 등록 또는 파일 업로드 중)
  const isSubmitting = createMutation.isPending || uploadMutation.isPending;

  // 교정일 변경 시 다음 교정일 자동 계산
  const handleCalibrationDateChange = (date: string) => {
    const currentCycle = form.getValues('calibrationCycle') || 12;
    const nextDate = formatDate(addMonths(toDate(date) ?? new Date(), currentCycle), 'yyyy-MM-dd');
    form.setValue('nextCalibrationDate', nextDate);
  };

  // 교정 주기 변경 시 다음 교정일 자동 계산
  const handleCycleChange = (cycle: number) => {
    const currentDate = form.getValues('calibrationDate');
    if (currentDate) {
      const nextDate = formatDate(
        addMonths(toDate(currentDate) ?? new Date(), cycle),
        'yyyy-MM-dd'
      );
      form.setValue('nextCalibrationDate', nextDate);
    }
  };

  // 등록 권한 확인: UL-QP-18에 따라 시험실무자만 교정 기록 등록 가능
  // 교정 관리는 다른 기능과 달리 lab_manager도 등록 불가 (등록/승인 완전 분리 정책)
  const canCreate = hasRole(['test_engineer']);

  // 등록 Dialog
  const RegisterDialog = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('calibrationHistoryTab.register')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('calibrationHistoryTab.dialog.title')}</DialogTitle>
          <DialogDescription>{t('calibrationHistoryTab.dialog.description')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="calibrationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('calibrationHistoryTab.dialog.calibrationDate')}</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ''}
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
                    <FormLabel>{t('calibrationHistoryTab.dialog.calibrationCycle')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        value={field.value ?? ''}
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
                  <FormLabel>{t('calibrationHistoryTab.dialog.nextCalibrationDate')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ''} />
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
                  <FormLabel>{t('calibrationHistoryTab.dialog.calibrationAgency')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('calibrationHistoryTab.dialog.calibrationAgencyPlaceholder')}
                      {...field}
                      value={field.value || ''}
                    />
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
                  <FormLabel>{t('calibrationHistoryTab.dialog.certificateNumber')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('calibrationHistoryTab.dialog.certificateNumberPlaceholder')}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="result"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('calibrationHistoryTab.dialog.result')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('calibrationHistoryTab.dialog.resultPlaceholder')}
                        />
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
              <FormLabel>{t('calibrationHistoryTab.dialog.certificateFile')}</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                {t('calibrationHistoryTab.dialog.certificateFileHint')}
              </p>
              {!certificateFile && (
                <p className="text-xs text-destructive">
                  {t('calibrationHistoryTab.dialog.certificateFileRequired')}
                </p>
              )}
            </FormItem>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('calibrationHistoryTab.dialog.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('calibrationHistoryTab.dialog.notesPlaceholder')}
                      rows={3}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('calibrationHistoryTab.dialog.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t('calibrationHistoryTab.dialog.submitting')
                  : t('calibrationHistoryTab.dialog.submit')}
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
            {t('calibrationHistoryTab.title')}
          </CardTitle>
          {canCreate && RegisterDialog}
        </CardHeader>
        <CardContent>
          <div className={TIMELINE_TOKENS.empty.container}>
            <Calendar className={TIMELINE_TOKENS.empty.icon} />
            <p className={TIMELINE_TOKENS.empty.text}>{t('calibrationHistoryTab.empty')}</p>
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
          {t('calibrationHistoryTab.title')}
        </CardTitle>
        {canCreate && RegisterDialog}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('calibrationHistoryTab.tableHeaders.calibrationDate')}</TableHead>
              <TableHead>{t('calibrationHistoryTab.tableHeaders.nextCalibrationDate')}</TableHead>
              <TableHead>{t('calibrationHistoryTab.tableHeaders.calibrationAgency')}</TableHead>
              <TableHead>{t('calibrationHistoryTab.tableHeaders.result')}</TableHead>
              <TableHead>{t('calibrationHistoryTab.tableHeaders.approvalStatus')}</TableHead>
              <TableHead>{t('calibrationHistoryTab.tableHeaders.notes')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calibrations.map((cal: Calibration) => (
              <TableRow key={cal.id}>
                <TableCell className={CONTENT_TOKENS.numeric.tabular}>
                  {formatDate(cal.calibrationDate, 'yyyy-MM-dd')}
                </TableCell>
                <TableCell className={CONTENT_TOKENS.numeric.tabular}>
                  {formatDate(cal.nextCalibrationDate, 'yyyy-MM-dd')}
                </TableCell>
                <TableCell>{cal.calibrationAgency}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      cal.result === 'pass'
                        ? 'default'
                        : cal.result === 'conditional'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {cal.result ? getResultLabel(cal.result) : '-'}
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
                      {CALIBRATION_APPROVAL_STATUS_LABELS[
                        cal.approvalStatus as keyof typeof CALIBRATION_APPROVAL_STATUS_LABELS
                      ] || cal.approvalStatus}
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
