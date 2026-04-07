'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { listFormTemplates } from '@/lib/api/form-templates-api';
import { queryKeys } from '@/lib/api/query-config';
import { cn } from '@/lib/utils';

interface FormNumberBadgeProps {
  /** UL-QP-03 §8 양식 관리대장상의 안정 식별자(예: '중간점검표', '자체 점검표') */
  formName: string;
  className?: string;
}

/**
 * 현행 양식 번호를 배지로 표시.
 *
 * 디자인 근거:
 * - 양식 번호는 개정 시 변경될 수 있으므로 i18n 문자열에 하드코딩하지 않는다.
 * - DB의 `form_templates.is_current=true` row를 SSOT로 삼아 런타임에 표시한다.
 * - 동일 queryKey(`formTemplates.list`)를 양식 관리 페이지와 공유하므로
 *   추가 네트워크 호출은 최대 1회(staleTime 1h).
 * - 미등록/오류/로딩 시 null — 페이지 기능을 차단하지 않는다.
 */
export function FormNumberBadge({ formName, className }: FormNumberBadgeProps) {
  const { data } = useQuery({
    queryKey: queryKeys.formTemplates.list(),
    queryFn: listFormTemplates,
    staleTime: 1000 * 60 * 60, // 1h — 양식 번호 개정은 매우 드묾
    select: (items) => items.find((item) => item.formName === formName)?.current?.formNumber,
  });

  if (!data) return null;

  return (
    <Badge
      variant="outline"
      className={cn('font-mono text-xs font-normal text-muted-foreground', className)}
    >
      {data}
    </Badge>
  );
}
