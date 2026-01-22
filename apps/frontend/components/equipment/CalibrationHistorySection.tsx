'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Plus, CalendarCheck, ExternalLink, Trash2, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';
import Link from 'next/link';
import { ApiError } from '@/lib/errors/equipment-errors';

interface CalibrationRecord {
  id: string;
  calibrationDate: string | Date;
  completionDate?: string | Date;
  nextCalibrationDate?: string | Date;
  agencyName?: string;
  calibrationAgency?: string; // API 응답 호환
  certificateNumber?: string;
  certificationNumber?: string; // API 응답 호환
  result?: string;
  calibrationResult?: 'PASS' | 'FAIL' | 'CONDITIONAL'; // API 응답 호환
  isPassed?: boolean | null; // 교정 결과: true=적합, false=부적합, null=미완료
  status: string;
  approvalStatus?: string;
}

// 교정 이력 생성 입력 타입
export interface CreateCalibrationHistoryInput {
  calibrationDate: string;
  nextCalibrationDate: string;
  calibrationAgency: string;
  calibrationCycle: number;
  calibrationResult: 'PASS' | 'FAIL' | 'CONDITIONAL';
  notes?: string;
}

interface CalibrationHistorySectionProps {
  equipmentUuid?: string;
  history: CalibrationRecord[];
  onAdd?: (data: CreateCalibrationHistoryInput) => Promise<void> | void;
  onDelete?: (historyId: string) => Promise<void> | void;
  isLoading?: boolean;
  disabled?: boolean;
  isCreateMode?: boolean; // 등록 모드 여부
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: '예정됨',
  in_progress: '진행 중',
  completed: '완료됨',
  failed: '실패',
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending_approval: '승인 대기',
  approved: '승인됨',
  rejected: '반려됨',
};

const APPROVAL_STATUS_COLORS: Record<string, string> = {
  pending_approval: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

// 교정 결과 라벨 및 색상
const RESULT_LABELS: Record<string, string> = {
  passed: '적합',
  failed: '부적합',
  pending: '-',
};

const RESULT_COLORS: Record<string, string> = {
  passed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

// 교정 결과 키 계산 함수
const getResultKey = (record: CalibrationRecord): string => {
  // isPassed 필드가 있으면 사용
  if (record.isPassed === true) return 'passed';
  if (record.isPassed === false) return 'failed';
  // calibrationResult 필드가 있으면 사용
  if (record.calibrationResult === 'PASS') return 'passed';
  if (record.calibrationResult === 'FAIL') return 'failed';
  return 'pending';
};

// 교정 결과 옵션
const CALIBRATION_RESULT_OPTIONS = [
  { value: 'PASS', label: '적합 (PASS)' },
  { value: 'FAIL', label: '부적합 (FAIL)' },
  { value: 'CONDITIONAL', label: '조건부 적합' },
];

export function CalibrationHistorySection({
  equipmentUuid,
  history,
  onAdd,
  onDelete,
  isLoading = false,
  disabled = false,
  isCreateMode = false,
}: CalibrationHistorySectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<CreateCalibrationHistoryInput>({
    calibrationDate: dayjs().format('YYYY-MM-DD'),
    nextCalibrationDate: dayjs().add(12, 'month').format('YYYY-MM-DD'),
    calibrationAgency: '',
    calibrationCycle: 12,
    calibrationResult: 'PASS',
    notes: '',
  });
  // 에러 상태 관리
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleOpenDialog = () => {
    setFormData({
      calibrationDate: dayjs().format('YYYY-MM-DD'),
      nextCalibrationDate: dayjs().add(12, 'month').format('YYYY-MM-DD'),
      calibrationAgency: '',
      calibrationCycle: 12,
      calibrationResult: 'PASS',
      notes: '',
    });
    // 에러 상태 초기화
    setFormErrors({});
    setSaveError(null);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!onAdd) return;

    // 폼 유효성 검사
    const errors: Record<string, string> = {};

    if (!formData.calibrationDate) {
      errors.calibrationDate = '교정일을 입력하세요.';
    }

    if (!formData.calibrationAgency.trim()) {
      errors.calibrationAgency = '교정기관을 입력하세요.';
    }

    if (!formData.calibrationCycle || formData.calibrationCycle < 1) {
      errors.calibrationCycle = '유효한 교정 주기를 입력하세요.';
    }

    if (!formData.nextCalibrationDate) {
      errors.nextCalibrationDate = '차기 교정일을 입력하세요.';
    }

    // 교정일이 차기 교정일 이후인지 확인
    if (formData.calibrationDate && formData.nextCalibrationDate) {
      if (dayjs(formData.calibrationDate).isAfter(dayjs(formData.nextCalibrationDate))) {
        errors.nextCalibrationDate = '차기 교정일은 교정일 이후여야 합니다.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSaveError(null);
    setIsSaving(true);

    try {
      await onAdd(formData);
      setIsDialogOpen(false);
    } catch (error) {
      const errorMessage = error instanceof ApiError
        ? error.getUserMessage()
        : error instanceof Error
          ? error.message
          : '교정 이력 저장 중 오류가 발생했습니다.';
      setSaveError(errorMessage);
      console.error('Failed to add calibration history:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 삭제 확인 다이얼로그 상태
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteClick = (historyId: string) => {
    setDeleteTargetId(historyId);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete || !deleteTargetId) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await onDelete(deleteTargetId);
      setDeleteTargetId(null);
    } catch (error) {
      const errorMessage = error instanceof ApiError
        ? error.getUserMessage()
        : error instanceof Error
          ? error.message
          : '삭제 중 오류가 발생했습니다.';
      setDeleteError(errorMessage);
      console.error('Failed to delete calibration history:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // 교정일 변경 시 차기 교정일 자동 계산
  const handleCalibrationDateChange = (date: string) => {
    setFormData((prev) => ({
      ...prev,
      calibrationDate: date,
      nextCalibrationDate: dayjs(date).add(prev.calibrationCycle, 'month').format('YYYY-MM-DD'),
    }));
  };

  // 교정 주기 변경 시 차기 교정일 자동 계산
  const handleCycleChange = (cycle: number) => {
    setFormData((prev) => ({
      ...prev,
      calibrationCycle: cycle,
      nextCalibrationDate: dayjs(prev.calibrationDate).add(cycle, 'month').format('YYYY-MM-DD'),
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-purple-500" />
            <CardTitle>장비 교정 이력</CardTitle>
          </div>
          {/* 등록 모드: 직접 추가 버튼, 수정 모드: 교정 등록 페이지 링크 */}
          {isCreateMode || onAdd ? (
            <Button type="button" size="sm" variant="outline" onClick={handleOpenDialog} disabled={disabled}>
              <Plus className="h-4 w-4 mr-1" />
              추가
            </Button>
          ) : equipmentUuid ? (
            <Button size="sm" variant="outline" asChild disabled={disabled}>
              <Link href={`/calibrations/create?equipmentId=${equipmentUuid}`}>
                <Plus className="h-4 w-4 mr-1" />
                교정 등록
              </Link>
            </Button>
          ) : null}
        </div>
        <CardDescription>
          장비의 교정 이력입니다. 교정 관리 페이지에서 상세 정보를 확인할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            교정 이력이 없습니다.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>교정일</TableHead>
                <TableHead>교정 결과</TableHead>
                <TableHead>차기 교정일</TableHead>
                <TableHead>교정기관</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>승인</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => {
                const resultKey = getResultKey(item);
                const agencyName = item.agencyName || item.calibrationAgency;
                const isTempItem = item.id.startsWith('temp-');
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      {dayjs(item.calibrationDate).format('YYYY-MM-DD')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={RESULT_COLORS[resultKey]}
                      >
                        {RESULT_LABELS[resultKey]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.nextCalibrationDate
                        ? dayjs(item.nextCalibrationDate).format('YYYY-MM-DD')
                        : '-'}
                    </TableCell>
                    <TableCell>{agencyName || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[item.status] || 'bg-gray-100'}
                      >
                        {STATUS_LABELS[item.status] || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.approvalStatus && (
                        <Badge
                          variant="outline"
                          className={
                            APPROVAL_STATUS_COLORS[item.approvalStatus] || 'bg-gray-100'
                          }
                        >
                          {APPROVAL_STATUS_LABELS[item.approvalStatus] ||
                            item.approvalStatus}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {/* 임시 항목이거나 삭제 핸들러가 있으면 삭제 버튼 표시 */}
                        {(isTempItem || onDelete) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(item.id)}
                            disabled={disabled}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                        {/* 실제 저장된 항목은 상세 페이지 링크 */}
                        {!isTempItem && (
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/calibrations/${item.id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* 교정 이력 추가 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>교정 이력 추가</DialogTitle>
            <DialogDescription>
              장비의 교정 이력 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 전체 저장 에러 메시지 */}
            {saveError && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {/* 교정일 */}
            <div className="space-y-2">
              <Label htmlFor="calibrationDate">교정일 *</Label>
              <Input
                id="calibrationDate"
                type="date"
                value={formData.calibrationDate}
                onChange={(e) => {
                  handleCalibrationDateChange(e.target.value);
                  setFormErrors((prev) => ({ ...prev, calibrationDate: '' }));
                }}
                disabled={isSaving}
                className={formErrors.calibrationDate ? 'border-destructive' : ''}
              />
              {formErrors.calibrationDate && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.calibrationDate}
                </p>
              )}
            </div>

            {/* 교정 결과 */}
            <div className="space-y-2">
              <Label htmlFor="calibrationResult">교정 결과 *</Label>
              <Select
                value={formData.calibrationResult}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    calibrationResult: value as 'PASS' | 'FAIL' | 'CONDITIONAL',
                  }))
                }
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="결과 선택" />
                </SelectTrigger>
                <SelectContent>
                  {CALIBRATION_RESULT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 교정기관 */}
            <div className="space-y-2">
              <Label htmlFor="calibrationAgency">교정기관 *</Label>
              <Input
                id="calibrationAgency"
                value={formData.calibrationAgency}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, calibrationAgency: e.target.value }));
                  setFormErrors((prev) => ({ ...prev, calibrationAgency: '' }));
                }}
                placeholder="예: 한국표준과학연구원"
                disabled={isSaving}
                className={formErrors.calibrationAgency ? 'border-destructive' : ''}
              />
              {formErrors.calibrationAgency && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.calibrationAgency}
                </p>
              )}
            </div>

            {/* 교정 주기 */}
            <div className="space-y-2">
              <Label htmlFor="calibrationCycle">교정 주기 (개월) *</Label>
              <Input
                id="calibrationCycle"
                type="number"
                min={1}
                max={60}
                value={formData.calibrationCycle}
                onChange={(e) => {
                  handleCycleChange(parseInt(e.target.value) || 12);
                  setFormErrors((prev) => ({ ...prev, calibrationCycle: '' }));
                }}
                disabled={isSaving}
                className={formErrors.calibrationCycle ? 'border-destructive' : ''}
              />
              {formErrors.calibrationCycle && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.calibrationCycle}
                </p>
              )}
            </div>

            {/* 차기 교정일 (자동 계산) */}
            <div className="space-y-2">
              <Label htmlFor="nextCalibrationDate">차기 교정일</Label>
              <Input
                id="nextCalibrationDate"
                type="date"
                value={formData.nextCalibrationDate}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, nextCalibrationDate: e.target.value }));
                  setFormErrors((prev) => ({ ...prev, nextCalibrationDate: '' }));
                }}
                disabled={isSaving}
                className={formErrors.nextCalibrationDate ? 'border-destructive' : ''}
              />
              {formErrors.nextCalibrationDate && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {formErrors.nextCalibrationDate}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                교정일과 주기를 기준으로 자동 계산됩니다.
              </p>
            </div>

            {/* 비고 */}
            <div className="space-y-2">
              <Label htmlFor="notes">비고</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="추가 정보를 입력하세요"
                rows={2}
                disabled={isSaving}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              취소
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>삭제 확인</DialogTitle>
            <DialogDescription>
              이 교정 이력을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTargetId(null)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
