'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * 장비 상세 Tab footer "전체 보기" 링크 SSOT.
 *
 * 4 도메인(`CalibrationHistoryTab` / `MaintenanceHistoryTab` / `CalibrationFactorsTab` /
 * `IncidentHistoryTab`)의 동일 footer 패턴을 단일 컴포넌트로 결빙. 인라인 className 중복 제거 +
 * 변경 시 단일 진입점.
 *
 * 사용 패턴:
 * - Tab 본문(table/timeline/empty) 직후 + `<CardContent>` 내부 끝에 배치
 * - `href` 는 `FRONTEND_ROUTES.EQUIPMENT.{CALIBRATION_HISTORY|REPAIR_HISTORY|CALIBRATION_FACTORS|NON_CONFORMANCES}` SSOT 빌더 결과만 허용
 * - `label` 은 i18n 키 결과 (`<tab>.viewAllLink`)
 */
interface EquipmentTabFooterLinkProps {
  href: string;
  label: string;
}

export function EquipmentTabFooterLink({ href, label }: EquipmentTabFooterLinkProps) {
  return (
    <div className="flex justify-end pt-3 border-t mt-3">
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
      >
        {label}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}
