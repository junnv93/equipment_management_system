'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { exportFormTemplate } from '@/lib/api/reports-api';
import { getDownloadErrorToast } from '@/lib/errors/download-error-utils';

/**
 * UL-QP-18 form template 다운로드 버튼 (SSOT).
 *
 * 8개 call site 에서 반복되던 4-part boilerplate 를 단일 컴포넌트로 통합:
 *  1. canAct 권한 게이트 — Container에서 can(Permission.EXPORT_REPORTS) 결과를 주입
 *  2. loading state
 *  3. `exportFormTemplate(formNumber, params)` 호출
 *  4. 에러 시 destructive toast (silent swallow 금지 — tracker L28 계약 준수)
 *
 * 백엔드 `@RequirePermissions(Permission.EXPORT_REPORTS)` + `@SiteScoped` 와 1:1 정렬.
 * cross-site 접근은 서버가 404 반환 → 동일 toast 경로로 사용자 피드백.
 *
 * 상태 게이팅(approvalStatus 등)은 호출 측에서 조건부 렌더 (버튼 자체는 노출 여부만 관리).
 */
interface ExportFormButtonProps {
  /** UL-QP-18-XX form number (FORM_CATALOG SSOT 등록된 값). */
  formNumber: string;
  /** 백엔드 exporter 가 요구하는 query params (inspectionId/equipmentId/checkoutId/importId 등). */
  params: Record<string, string>;
  /** 버튼 라벨 (i18n 값). */
  label: string;
  /** 에러 toast description (i18n 값). */
  errorToastDescription: string;
  /** 권한 게이트 — Container에서 can(Permission.EXPORT_REPORTS) 결과를 주입. false이면 null 반환. */
  canAct: boolean;
  /** 외부에서 강제 비활성화할 때. */
  disabled?: boolean;
  className?: string;
  /** 아이콘 전용 버튼 (라벨 숨김). */
  iconOnly?: boolean;
  /** sm/default 사이즈. */
  size?: 'sm' | 'default';
}

export function ExportFormButton({
  formNumber,
  params,
  label,
  errorToastDescription,
  canAct,
  disabled,
  className,
  iconOnly = false,
  size = 'sm',
}: ExportFormButtonProps): React.ReactElement | null {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  if (!canAct) return null;

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportFormTemplate(formNumber, params);
    } catch (err) {
      toast({ variant: 'destructive', ...getDownloadErrorToast(err, errorToastDescription) });
    } finally {
      setExporting(false);
    }
  };

  const iconClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const iconSpacing = iconOnly ? '' : 'mr-1';

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={handleExport}
      disabled={exporting || disabled}
      className={className}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
    >
      {exporting ? (
        <Loader2 className={`${iconClass} ${iconSpacing} animate-spin`} />
      ) : (
        <Download className={`${iconClass} ${iconSpacing}`} />
      )}
      {!iconOnly && label}
    </Button>
  );
}
