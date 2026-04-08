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
import { addMonths, isAfter } from 'date-fns';
import { formatDate, toDate } from '@/lib/utils/date';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ApiError } from '@/lib/errors/equipment-errors';
import { type SemanticColorKey, getSemanticStatusClasses } from '@/lib/design-tokens';

export interface CalibrationRecord {
  id: string;
  calibrationDate: string | Date;
  nextCalibrationDate?: string | Date;
  calibrationAgency?: string;
  certificateNumber?: string;
  result?: string; // lowercase: 'pass', 'fail', 'conditional'
  status: string;
  approvalStatus?: string;
}

// 교정 이력 생성 입력 타입
export interface CreateCalibrationHistoryInput {
  calibrationDate: string;
  nextCalibrationDate: string;
  calibrationAgency: string;
  calibrationCycle: number;
  result: 'pass' | 'fail' | 'conditional';
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

const STATUS_SEMANTIC: Record<string, SemanticColorKey> = {
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'ok',
  failed: 'critical',
};

const APPROVAL_STATUS_SEMANTIC: Record<string, SemanticColorKey> = {
  pending_approval: 'warning',
  approved: 'ok',
  rejected: 'critical',
};

const RESULT_SEMANTIC: Record<string, SemanticColorKey> = {
  pass: 'ok',
  fail: 'critical',
  conditional: 'warning',
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  scheduled: 'statusScheduled',
  in_progress: 'statusInProgress',
  completed: 'statusCompleted',
  failed: 'statusFailed',
};

const APPROVAL_LABEL_KEYS: Record<string, string> = {
  pending_approval: 'approvalPending',
  approved: 'approvalApproved',
  rejected: 'approvalRejected',
};

const RESULT_LABEL_KEYS: Record<string, string> = {
  pass: 'resultPass',
  fail: 'resultFail',
  conditional: 'resultConditional',
};

export function CalibrationHistorySection({
  equipmentUuid,
  history,
  onAdd,
  onDelete,
  isLoading: _isLoading = false,
  disabled = false,
  isCreateMode = false,
}: CalibrationHistorySectionProps) {
  const t = useTranslations('equipment.calibrationHistorySection');
  const { fmtDate } = useDateFormatter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<CreateCalibrationHistoryInput>({
    calibrationDate: formatDate(new Date(), 'yyyy-MM-dd'),
    nextCalibrationDate: formatDate(addMonths(new Date(), 12), 'yyyy-MM-dd'),
    calibrationAgency: '',
    calibrationCycle: 12,
    result: 'pass',
    notes: '',
  });
  // 에러 상태 관리
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleOpenDialog = () => {
    setFormData({
      calibrationDate: formatDate(new Date(), 'yyyy-MM-dd'),
      nextCalibrationDate: formatDate(addMonths(new Date(), 12), 'yyyy-MM-dd'),
      calibrationAgency: '',
      calibrationCycle: 12,
      result: 'pass',
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
      errors.calibrationDate = t('validationCalDate');
    }

    if (!formData.calibrationAgency.trim()) {
      errors.calibrationAgency = t('validationAgency');
    }

    if (!formData.calibrationCycle || formData.calibrationCycle < 1) {
      errors.calibrationCycle = t('validationCycle');
    }

    if (!formData.nextCalibrationDate) {
      errors.nextCalibrationDate = t('validationNextCalDate');
    }

    if (formData.calibrationDate && formData.nextCalibrationDate) {
      const calDate = toDate(formData.calibrationDate);
      const nextCalDate = toDate(formData.nextCalibrationDate);
      if (calDate && nextCalDate && isAfter(calDate, nextCalDate)) {
        errors.nextCalibrationDate = t('validationNextCalDateOrder');
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
      const errorMessage =
        error instanceof ApiError
          ? error.getUserMessage()
          : error instanceof Error
            ? error.message
            : t('saveError');
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
      const errorMessage =
        error instanceof ApiError
          ? error.getUserMessage()
          : error instanceof Error
            ? error.message
            : t('deleteError');
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
      nextCalibrationDate: formatDate(
        addMonths(toDate(date) ?? new Date(), prev.calibrationCycle),
        'yyyy-MM-dd'
      ),
    }));
  };

  // 교정 주기 변경 시 차기 교정일 자동 계산
  const handleCycleChange = (cycle: number) => {
    setFormData((prev) => ({
      ...prev,
      calibrationCycle: cycle,
      nextCalibrationDate: formatDate(
        addMonths(toDate(prev.calibrationDate) ?? new Date(), cycle),
        'yyyy-MM-dd'
      ),
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-brand-purple" />
            <CardTitle>{t('title')}</CardTitle>
          </div>
          {isCreateMode || onAdd ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleOpenDialog}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('addButton')}
            </Button>
          ) : equipmentUuid ? (
            <Button size="sm" variant="outline" asChild disabled={disabled}>
              <Link href={`/calibrations/create?equipmentId=${equipmentUuid}`}>
                <Plus className="h-4 w-4 mr-1" />
                {t('registerButton')}
              </Link>
            </Button>
          ) : null}
        </div>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">{t('emptyState')}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tableCalDate')}</TableHead>
                <TableHead>{t('tableResult')}</TableHead>
                <TableHead>{t('tableNextCalDate')}</TableHead>
                <TableHead>{t('tableAgency')}</TableHead>
                <TableHead>{t('tableStatus')}</TableHead>
                <TableHead>{t('tableApproval')}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => {
                const resultKey = item.result || '';
                const isTempItem = item.id.startsWith('temp-');
                return (
                  <TableRow key={item.id}>
                    <TableCell>{fmtDate(item.calibrationDate)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          RESULT_SEMANTIC[resultKey]
                            ? getSemanticStatusClasses(RESULT_SEMANTIC[resultKey])
                            : 'bg-muted text-muted-foreground'
                        }
                      >
                        {RESULT_LABEL_KEYS[resultKey]
                          ? t(
                              RESULT_LABEL_KEYS[resultKey] as
                                | 'resultPass'
                                | 'resultFail'
                                | 'resultConditional'
                            )
                          : '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>{fmtDate(item.nextCalibrationDate)}</TableCell>
                    <TableCell>{item.calibrationAgency || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          STATUS_SEMANTIC[item.status]
                            ? getSemanticStatusClasses(STATUS_SEMANTIC[item.status])
                            : 'bg-muted'
                        }
                      >
                        {STATUS_LABEL_KEYS[item.status]
                          ? t(
                              STATUS_LABEL_KEYS[item.status] as
                                | 'statusScheduled'
                                | 'statusInProgress'
                                | 'statusCompleted'
                                | 'statusFailed'
                            )
                          : item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.approvalStatus && (
                        <Badge
                          variant="outline"
                          className={
                            APPROVAL_STATUS_SEMANTIC[item.approvalStatus]
                              ? getSemanticStatusClasses(
                                  APPROVAL_STATUS_SEMANTIC[item.approvalStatus]
                                )
                              : getSemanticStatusClasses('neutral')
                          }
                        >
                          {APPROVAL_LABEL_KEYS[item.approvalStatus]
                            ? t(
                                APPROVAL_LABEL_KEYS[item.approvalStatus] as
                                  | 'approvalPending'
                                  | 'approvalApproved'
                                  | 'approvalRejected'
                              )
                            : item.approvalStatus}
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
                            aria-label={t('deleteAriaLabel', {
                              date: fmtDate(item.calibrationDate),
                            })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                          </Button>
                        )}
                        {/* 실제 저장된 항목은 상세 페이지 링크 */}
                        {!isTempItem && (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            aria-label={t('detailAriaLabel', {
                              date: fmtDate(item.calibrationDate),
                            })}
                          >
                            <Link href={`/calibrations/${item.id}`}>
                              <ExternalLink className="h-4 w-4" aria-hidden="true" />
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
            <DialogTitle>{t('dialogTitle')}</DialogTitle>
            <DialogDescription>{t('dialogDescription')}</DialogDescription>
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
              <Label htmlFor="calibrationDate">{t('formCalDate')}</Label>
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
              <Label htmlFor="result">{t('formResult')}</Label>
              <Select
                value={formData.result}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    result: value as 'pass' | 'fail' | 'conditional',
                  }))
                }
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('formResultPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">{t('resultPass')}</SelectItem>
                  <SelectItem value="fail">{t('resultFail')}</SelectItem>
                  <SelectItem value="conditional">{t('resultConditional')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 교정기관 */}
            <div className="space-y-2">
              <Label htmlFor="calibrationAgency">{t('formAgency')}</Label>
              <Input
                id="calibrationAgency"
                value={formData.calibrationAgency}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, calibrationAgency: e.target.value }));
                  setFormErrors((prev) => ({ ...prev, calibrationAgency: '' }));
                }}
                placeholder={t('formAgencyPlaceholder')}
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
              <Label htmlFor="calibrationCycle">{t('formCycle')}</Label>
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
              <Label htmlFor="nextCalibrationDate">{t('formNextCalDate')}</Label>
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
              <p className="text-xs text-muted-foreground">{t('formNextCalDateHint')}</p>
            </div>

            {/* 비고 */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('formNotes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder={t('formNotesPlaceholder')}
                rows={2}
                disabled={isSaving}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? t('saving') : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('deleteConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('deleteConfirmDescription')}</DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTargetId(null)} disabled={isDeleting}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? t('deleting') : t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
