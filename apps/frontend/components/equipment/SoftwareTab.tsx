'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Code, BookOpen, Download, ExternalLink, Cpu, Monitor } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DocumentTypeValues } from '@equipment-management/schemas';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { documentApi, type DocumentRecord } from '@/lib/api/document-api';
import testSoftwareApi from '@/lib/api/software-api';
import { TIMELINE_TOKENS, DOCUMENT_DISPLAY } from '@/lib/design-tokens';
import type { Equipment } from '@/lib/api/equipment-api';

interface SoftwareTabProps {
  equipment: Equipment;
}

export function SoftwareTab({ equipment }: SoftwareTabProps) {
  const t = useTranslations('equipment');
  const equipmentId = String(equipment.id);

  // 장비 문서에서 매뉴얼 필터링
  const { data: equipmentDocs = [] } = useQuery({
    queryKey: queryKeys.documents.byEquipment(equipmentId),
    queryFn: () => documentApi.getEquipmentDocuments(equipmentId),
    enabled: !!equipmentId,
    staleTime: CACHE_TIMES.LONG,
  });

  const manuals = useMemo(
    () =>
      equipmentDocs.filter(
        (d: DocumentRecord) => d.documentType === DocumentTypeValues.EQUIPMENT_MANUAL
      ),
    [equipmentDocs]
  );

  // 장비에 연결된 시험용 소프트웨어 목록 (M:N)
  const { data: linkedSoftware = [] } = useQuery({
    queryKey: queryKeys.testSoftware.byEquipment(equipmentId),
    queryFn: () => testSoftwareApi.listByEquipment(equipmentId),
    enabled: !!equipmentId,
    staleTime: CACHE_TIMES.MEDIUM,
  });

  const handleDownload = async (doc: DocumentRecord) => {
    await documentApi.downloadDocument(doc.id, doc.originalFileName);
  };

  const hasFirmware = !!equipment.firmwareVersion;
  const hasManualLocation = !!equipment.manualLocation;
  const hasManualFiles = manuals.length > 0;
  const hasLinkedSoftware = linkedSoftware.length > 0;
  const isEmpty = !hasFirmware && !hasManualLocation && !hasManualFiles && !hasLinkedSoftware;

  if (isEmpty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-brand-info" />
            {t('softwareTab.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={TIMELINE_TOKENS.empty.container}>
            <Code className={TIMELINE_TOKENS.empty.icon} />
            <p className={TIMELINE_TOKENS.empty.text}>{t('softwareTab.empty')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 섹션 A: 펌웨어 정보 */}
      {hasFirmware && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="h-5 w-5 text-brand-info" aria-hidden="true" />
              {t('softwareTab.firmwareTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <dt className="text-sm text-muted-foreground">{t('softwareTab.firmwareVersion')}</dt>
              <dd className="text-sm font-mono font-medium">{equipment.firmwareVersion}</dd>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* 섹션 B: 매뉴얼 */}
      {(hasManualLocation || hasManualFiles) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-5 w-5 text-brand-info" aria-hidden="true" />
              {t('softwareTab.manualTitle')}
              {hasManualFiles && (
                <Badge variant="secondary" className={DOCUMENT_DISPLAY.countBadge}>
                  {manuals.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasManualLocation && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                <dt className="text-sm text-muted-foreground">{t('softwareTab.manualLocation')}</dt>
                <dd className="text-sm font-medium">{equipment.manualLocation}</dd>
              </dl>
            )}
            {hasManualFiles && (
              <div className="space-y-2">
                {hasManualLocation && (
                  <p className="text-sm text-muted-foreground">{t('softwareTab.manualFiles')}</p>
                )}
                {manuals.map((manual: DocumentRecord) => (
                  <div key={manual.id} className={DOCUMENT_DISPLAY.manualRow}>
                    <div className="flex items-center gap-3 min-w-0">
                      <BookOpen className={DOCUMENT_DISPLAY.manualIcon} aria-hidden="true" />
                      <span className="text-sm truncate">{manual.originalFileName}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 flex-shrink-0"
                      onClick={() => handleDownload(manual)}
                      aria-label={`${t('softwareTab.download')} ${manual.originalFileName}`}
                    >
                      <Download className="h-4 w-4" />
                      {t('softwareTab.download')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 섹션 C: 관련 시험용 소프트웨어 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Monitor className="h-5 w-5 text-brand-info" aria-hidden="true" />
            {t('softwareTab.relatedSoftware')}
            {hasLinkedSoftware && (
              <Badge variant="secondary" className={DOCUMENT_DISPLAY.countBadge}>
                {linkedSoftware.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasLinkedSoftware ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">
                        {t('softwareTab.colManagementNumber')}
                      </th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">
                        {t('softwareTab.colName')}
                      </th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">
                        {t('softwareTab.colVersion')}
                      </th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">
                        {t('softwareTab.colTestField')}
                      </th>
                      <th className="pb-2 font-medium text-muted-foreground">
                        {t('softwareTab.colAvailability')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedSoftware.map((sw) => (
                      <tr key={sw.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-mono text-xs">
                          <Link
                            href={FRONTEND_ROUTES.SOFTWARE.DETAIL(sw.id)}
                            className="text-brand-primary hover:underline"
                          >
                            {sw.managementNumber}
                          </Link>
                        </td>
                        <td className="py-2 pr-4">{sw.name}</td>
                        <td className="py-2 pr-4 font-mono text-xs">{sw.softwareVersion ?? '-'}</td>
                        <td className="py-2 pr-4">
                          <Badge variant="outline" className="text-xs">
                            {sw.testField}
                          </Badge>
                        </td>
                        <td className="py-2">
                          <Badge
                            variant={sw.availability === 'available' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {sw.availability === 'available'
                              ? t('softwareTab.available')
                              : t('softwareTab.unavailable')}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <Link
                  href={FRONTEND_ROUTES.SOFTWARE.LIST}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('softwareTab.goToRegistry')}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ) : (
            <div className={TIMELINE_TOKENS.empty.container}>
              <Monitor className={TIMELINE_TOKENS.empty.icon} />
              <p className={TIMELINE_TOKENS.empty.text}>{t('softwareTab.emptyRelatedSoftware')}</p>
              <Link
                href={FRONTEND_ROUTES.SOFTWARE.LIST}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
              >
                {t('softwareTab.goToRegistry')}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
