'use client';

import { useActionState, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { XCircle } from 'lucide-react';
import type { ApprovalItem } from '@/lib/api/approvals-api';

interface RejectModalProps {
  item: ApprovalItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

interface RejectFormState {
  error: string | null;
  success: boolean;
}

// 반려 사유 템플릿
const REJECT_TEMPLATES = [
  { value: '', label: '직접 입력' },
  {
    value: '서류 미비: 필수 서류가 누락되어 반려합니다. 해당 서류를 첨부하여 재요청해주세요.',
    label: '서류 미비',
  },
  {
    value: '정보 오류: 입력된 정보에 오류가 있습니다. 수정 후 재요청해주세요.',
    label: '정보 오류',
  },
  {
    value: '절차 미준수: 규정된 절차를 따르지 않았습니다. 절차에 따라 재요청해주세요.',
    label: '절차 미준수',
  },
  {
    value: '타당성 부족: 요청 사유에 대한 타당성이 부족합니다. 추가 설명과 함께 재요청해주세요.',
    label: '타당성 부족',
  },
];

export default function RejectModal({ item, isOpen, onClose, onConfirm }: RejectModalProps) {
  // Local state for real-time validation
  const [reasonValue, setReasonValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setReasonValue('');
      setValidationError(null);
    }
  }, [isOpen]);

  // useActionState 패턴 사용 (Next.js 16)
  const [state, formAction, isPending] = useActionState<RejectFormState, FormData>(
    async (prevState, formData) => {
      const reason = formData.get('reason') as string;

      // 반려 사유 10자 이상 검증
      if (!reason || reason.trim().length < 10) {
        // Set local validation error state instead
        setValidationError('반려 사유는 10자 이상 입력해주세요.');
        return {
          error: null, // Don't set error in state
          success: false,
        };
      }

      try {
        await onConfirm(reason.trim());
        return { error: null, success: true };
      } catch {
        return {
          error: '반려 처리 중 오류가 발생했습니다.',
          success: false,
        };
      }
    },
    { error: null, success: false }
  );

  // Real-time validation on input change
  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setReasonValue(value);

    // Clear validation error if user enters valid input
    if (value.trim().length >= 10) {
      setValidationError(null);
    }
  };

  const handleTemplateSelect = (value: string) => {
    if (value) {
      setReasonValue(value);
      // Clear validation error when template is selected (all templates are > 10 chars)
      setValidationError(null);
    }
  };

  // Use validation error from real-time validation or form submission
  const displayError = validationError || state.error;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>반려</DialogTitle>
          <DialogDescription>
            &quot;{item.summary}&quot; 요청을 반려합니다. 반려 사유를 입력해주세요.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {/* 템플릿 선택 */}
          <div className="space-y-2">
            <Label htmlFor="template">사유 템플릿</Label>
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger id="template">
                <SelectValue placeholder="템플릿 선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                {REJECT_TEMPLATES.map((template) => (
                  <SelectItem key={template.value || 'direct'} value={template.value || 'direct'}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 반려 사유 */}
          <div className="space-y-2">
            <Label htmlFor="reject-reason">반려 사유 (10자 이상 필수) *</Label>
            <Textarea
              id="reject-reason"
              name="reason"
              value={reasonValue}
              onChange={handleReasonChange}
              placeholder="반려 사유를 입력하세요"
              className="min-h-[120px]"
              aria-describedby={displayError ? 'reject-error' : undefined}
            />
            {displayError && (
              <p
                id="reject-error"
                className="text-sm text-destructive"
                role="alert"
                aria-live="assertive"
              >
                {displayError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              취소
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending}
              aria-busy={isPending}
              className="bg-ul-red hover:bg-ul-red-hover"
            >
              <XCircle className="h-4 w-4 mr-1" />
              {isPending ? '처리 중...' : '반려'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
