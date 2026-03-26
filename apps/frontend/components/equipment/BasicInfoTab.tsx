'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Package, Wrench, ArrowRight, Camera, Download, BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { DocumentTypeValues } from '@equipment-management/schemas';
import {
  getTimestampClasses,
  EQUIPMENT_INFO_CARD_TOKENS,
  EQUIPMENT_CALIBRATION_TIMELINE_TOKENS,
  TRANSITION_PRESETS,
  DOCUMENT_DISPLAY,
} from '@/lib/design-tokens';
import { Badge } from '@/components/ui/badge';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import calibrationApi from '@/lib/api/calibration-api';
import { documentApi, type DocumentRecord } from '@/lib/api/document-api';
import { Button } from '@/components/ui/button';
import type { Equipment } from '@/lib/api/equipment-api';

interface BasicInfoTabProps {
  equipment: Equipment;
}

/**
 * 기본 정보 탭 — 시험설비이력카드(UL-QP-18-02) 디지털화
 *
 * 아키텍처:
 * - SSOT: 그리드/카드/타임라인 스타일 → EQUIPMENT_INFO_CARD_TOKENS, EQUIPMENT_CALIBRATION_TIMELINE_TOKENS
 * - SSOT: 교정 결과 라벨 → CALIBRATION_RESULT_LABELS (@equipment-management/schemas)
 * - SSOT: 교정 결과→dot 색상 → EQUIPMENT_CALIBRATION_TIMELINE_TOKENS.resultDotMap
 * - 캐시: queryKeys.calibrations.byEquipment 재사용 (CalibrationHistoryTab과 공유)
 */
export function BasicInfoTab({ equipment }: BasicInfoTabProps) {
  const t = useTranslations('equipment');
  const tCal = useTranslations('calibration');
  const { fmtDate } = useDateFormatter();
  const pathname = usePathname();
  const tokens = EQUIPMENT_INFO_CARD_TOKENS;
  const tl = EQUIPMENT_CALIBRATION_TIMELINE_TOKENS;

  const equipmentId = String(equipment.id);

  // 최근 교정이력 — CalibrationHistoryTab과 동일 queryKey로 캐시 공유
  const { data: calibrations = [] } = useQuery({
    queryKey: queryKeys.calibrations.byEquipment(equipmentId),
    queryFn: () => calibrationApi.getEquipmentCalibrations(equipmentId),
    enabled: !!equipmentId,
    staleTime: CACHE_TIMES.MEDIUM,
  });

  // 장비 문서 (사진, 매뉴얼)
  const { data: equipmentDocs = [] } = useQuery({
    queryKey: queryKeys.documents.byEquipment(equipmentId),
    queryFn: () => documentApi.getEquipmentDocuments(equipmentId),
    enabled: !!equipmentId,
    staleTime: CACHE_TIMES.LONG,
  });

  const photos = useMemo(
    () =>
      equipmentDocs.filter(
        (d: DocumentRecord) => d.documentType === DocumentTypeValues.EQUIPMENT_PHOTO
      ),
    [equipmentDocs]
  );
  const manuals = useMemo(
    () =>
      equipmentDocs.filter(
        (d: DocumentRecord) => d.documentType === DocumentTypeValues.EQUIPMENT_MANUAL
      ),
    [equipmentDocs]
  );

  const recentCalibrations = useMemo(() => calibrations.slice(0, 3), [calibrations]);

  /** 교정 결과 → 타임라인 dot 클래스 (SSOT: tl.resultDotMap) */
  const getDotClass = (result?: string) => {
    const variant = result ? (tl.resultDotMap[result] ?? 'info') : 'info';
    return tl.dot[variant];
  };

  const handleDownload = async (doc: DocumentRecord) => {
    await documentApi.downloadDocument(doc.id, doc.originalFileName);
  };

  return (
    <div className="space-y-8">
      {/* 장비 사진 — AP-04: tokens.card 깊이 + AP-05: count Badge */}
      <div className={tokens.card}>
        <div className={tokens.header}>
          <Camera className={tokens.headerIcon} aria-hidden="true" />
          <span className={tokens.headerTitle}>{t('basicInfoTab.equipmentPhoto')}</span>
          {photos.length > 0 && (
            <Badge variant="secondary" className={DOCUMENT_DISPLAY.countBadge}>
              {photos.length}
            </Badge>
          )}
        </div>
        <div className="p-4">
          {photos.length > 0 ? (
            <div className={DOCUMENT_DISPLAY.photoGrid}>
              {photos.map((photo: DocumentRecord) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => handleDownload(photo)}
                  className={DOCUMENT_DISPLAY.photoCard}
                  aria-label={`${t('basicInfoTab.download')} ${photo.originalFileName}`}
                >
                  <div className="flex items-center justify-center h-full">
                    <Camera className={DOCUMENT_DISPLAY.photoIcon} />
                  </div>
                  <div className={DOCUMENT_DISPLAY.photoOverlay}>
                    <p className="text-xs truncate">{photo.originalFileName}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* AP-09: 빈 상태 — 기능 인지 + CTA */
            <div className={DOCUMENT_DISPLAY.emptyCompact}>
              <Camera className={DOCUMENT_DISPLAY.emptyIcon} aria-hidden="true" />
              <p className={DOCUMENT_DISPLAY.emptyText}>{t('basicInfoTab.noPhotos')}</p>
            </div>
          )}
        </div>
      </div>

      {/* 장비 매뉴얼 — AP-06: hover accent 모션 */}
      <div className={tokens.card}>
        <div className={tokens.header}>
          <BookOpen className={tokens.headerIcon} aria-hidden="true" />
          <span className={tokens.headerTitle}>{t('basicInfoTab.equipmentManual')}</span>
          {manuals.length > 0 && (
            <Badge variant="secondary" className={DOCUMENT_DISPLAY.countBadge}>
              {manuals.length}
            </Badge>
          )}
        </div>
        <div className="p-4 space-y-2">
          {manuals.length > 0 ? (
            manuals.map((manual: DocumentRecord) => (
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
                  aria-label={`${t('basicInfoTab.download')} ${manual.originalFileName}`}
                >
                  <Download className="h-4 w-4" />
                  {t('basicInfoTab.download')}
                </Button>
              </div>
            ))
          ) : (
            /* AP-09: 빈 상태 */
            <div className={DOCUMENT_DISPLAY.emptyCompact}>
              <BookOpen className={DOCUMENT_DISPLAY.emptyIcon} aria-hidden="true" />
              <p className={DOCUMENT_DISPLAY.emptyText}>{t('basicInfoTab.noManuals')}</p>
            </div>
          )}
        </div>
      </div>

      {/* 기본 정보 카드 그리드 — 비대칭 1.6fr (SSOT: tokens.grid) */}
      <div className={tokens.grid}>
        {/* Primary: 장비 기본정보 — 좌측 brand-info 보더 (AP-04 깊이 차등) */}
        <div className={tokens.cardPrimary}>
          <div className={tokens.header}>
            <Package className={tokens.headerIcon} aria-hidden="true" />
            <span className={tokens.headerTitle}>{t('basicInfoTab.equipmentBasicInfo')}</span>
          </div>
          <div className={tokens.body}>
            <dl className={tokens.dlGrid}>
              <dt className={tokens.dtLabel}>{t('fields.name')}</dt>
              <dd className={tokens.ddValue}>{equipment.name || '-'}</dd>

              <dt className={tokens.dtLabel}>{t('fields.managementNumber')}</dt>
              <dd className={tokens.ddMono}>{equipment.managementNumber || '-'}</dd>

              <dt className={tokens.dtLabel}>{t('fields.modelName')}</dt>
              <dd className={tokens.ddValue}>{equipment.modelName || '-'}</dd>

              <dt className={tokens.dtLabel}>{t('fields.manufacturer')}</dt>
              <dd className={tokens.ddValue}>{equipment.manufacturer || '-'}</dd>

              <dt className={tokens.dtLabel}>{t('fields.serialNumber')}</dt>
              <dd className={tokens.ddMono}>{equipment.serialNumber || '-'}</dd>

              {equipment.assetNumber && (
                <>
                  <dt className={tokens.dtLabel}>{t('fields.assetNumber')}</dt>
                  <dd className={tokens.ddMono}>{equipment.assetNumber}</dd>
                </>
              )}

              <dt className={tokens.dtLabel}>{t('fields.purchaseYear')}</dt>
              <dd className={tokens.ddValue}>{equipment.purchaseYear ?? '-'}</dd>

              {equipment.description && (
                <>
                  <dt className={tokens.dtLabel}>{t('fields.description')}</dt>
                  <dd className="text-xs text-muted-foreground col-span-full mt-1">
                    {equipment.description}
                  </dd>
                </>
              )}
            </dl>
          </div>
        </div>

        {/* 교정 정보 */}
        <div className={tokens.card}>
          <div className={tokens.header}>
            <Wrench className={tokens.headerIcon} aria-hidden="true" />
            <span className={tokens.headerTitle}>{t('basicInfoTab.calibrationInfo')}</span>
          </div>
          <div className={tokens.body}>
            <dl className={tokens.dlGrid}>
              <dt className={tokens.dtLabel}>{t('basicInfoTab.calibrationRequired')}</dt>
              <dd className={tokens.ddValue}>
                {equipment.calibrationRequired === 'required'
                  ? t('basicInfoTab.calibrationRequiredYes')
                  : equipment.calibrationRequired === 'not_required'
                    ? t('basicInfoTab.calibrationRequiredNo')
                    : '-'}
              </dd>

              <dt className={tokens.dtLabel}>{t('basicInfoTab.calibrationMethod')}</dt>
              <dd className={tokens.ddValue}>
                {equipment.calibrationMethod
                  ? tCal(`method.${equipment.calibrationMethod}` as Parameters<typeof tCal>[0])
                  : '-'}
              </dd>

              <dt className={tokens.dtLabel}>{t('basicInfoTab.calibrationCycle')}</dt>
              <dd className={tokens.ddValue}>
                {equipment.calibrationCycle
                  ? `${equipment.calibrationCycle}${t('basicInfoTab.calibrationCycleUnit')}`
                  : '-'}
              </dd>

              <dt className={tokens.dtLabel}>{t('basicInfoTab.lastCalibrationDate')}</dt>
              <dd className={`${tokens.ddMono} ${getTimestampClasses()}`}>
                {fmtDate(equipment.lastCalibrationDate) ?? '-'}
              </dd>

              <dt className={tokens.dtLabel}>{t('basicInfoTab.nextCalibrationDate')}</dt>
              <dd className={`${tokens.ddMono} ${getTimestampClasses()}`}>
                {fmtDate(equipment.nextCalibrationDate) ?? '-'}
              </dd>

              <dt className={tokens.dtLabel}>{t('basicInfoTab.calibrationAgency')}</dt>
              <dd className={tokens.ddValue}>{equipment.calibrationAgency || '-'}</dd>
            </dl>
          </div>
        </div>

        {/* 위치 & 상태 */}
        <div className={tokens.card}>
          <div className={tokens.header}>
            <MapPin className={tokens.headerIcon} aria-hidden="true" />
            <span className={tokens.headerTitle}>{t('basicInfoTab.locationManagement')}</span>
          </div>
          <div className={tokens.body}>
            <dl className={tokens.dlGrid}>
              <dt className={tokens.dtLabel}>{t('fields.site')}</dt>
              <dd className={tokens.ddValue}>
                {equipment.site === 'suwon'
                  ? t('basicInfoTab.site.suwon')
                  : equipment.site === 'uiwang'
                    ? t('basicInfoTab.site.uiwang')
                    : equipment.site === 'pyeongtaek'
                      ? t('basicInfoTab.site.pyeongtaek')
                      : '-'}
              </dd>

              <dt className={tokens.dtLabel}>{t('fields.team')}</dt>
              <dd className={tokens.ddValue}>{equipment.teamName || '-'}</dd>

              <dt className={tokens.dtLabel}>{t('fields.location')}</dt>
              <dd className={tokens.ddValue}>{equipment.location || '-'}</dd>

              <dt className={tokens.dtLabel}>{t('fields.specMatch')}</dt>
              <dd className={tokens.ddValue}>
                {equipment.specMatch === 'match'
                  ? t('basicInfoTab.specMatchMatch')
                  : equipment.specMatch === 'mismatch'
                    ? t('basicInfoTab.specMatchMismatch')
                    : '-'}
              </dd>

              {equipment.isShared !== undefined && (
                <>
                  <dt className={tokens.dtLabel}>{t('basicInfoTab.sharedLabel')}</dt>
                  <dd className={tokens.ddValue}>
                    {equipment.isShared ? t('basicInfoTab.sharedYes') : t('basicInfoTab.sharedNo')}
                  </dd>
                </>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* 소프트웨어/펌웨어 (조건부) */}
      {(equipment.softwareVersion || equipment.firmwareVersion || equipment.manualLocation) && (
        <div className={tokens.card}>
          <div className={tokens.header}>
            <Package className={tokens.headerIcon} aria-hidden="true" />
            <span className={tokens.headerTitle}>{t('softwareTab.title')}</span>
          </div>
          <div className={tokens.body}>
            <dl className={tokens.dlGrid}>
              {equipment.softwareVersion && (
                <>
                  <dt className={tokens.dtLabel}>{t('softwareTab.softwareVersion')}</dt>
                  <dd className={tokens.ddMono}>{equipment.softwareVersion}</dd>
                </>
              )}
              {equipment.firmwareVersion && (
                <>
                  <dt className={tokens.dtLabel}>{t('softwareTab.firmwareVersion')}</dt>
                  <dd className={tokens.ddMono}>{equipment.firmwareVersion}</dd>
                </>
              )}
              {equipment.manualLocation && (
                <>
                  <dt className={tokens.dtLabel}>{t('softwareTab.manualLocation')}</dt>
                  <dd className={tokens.ddValue}>{equipment.manualLocation}</dd>
                </>
              )}
            </dl>
          </div>
        </div>
      )}

      {/* 최근 교정 이력 타임라인 — SSOT: resultDotMap + CALIBRATION_RESULT_LABELS */}
      {recentCalibrations.length > 0 && (
        <section aria-label={t('basicInfoTab.recentCalibrationHistory')}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-foreground">
              {t('basicInfoTab.recentCalibrationHistory')}
            </h3>
            <Link
              href={`${pathname}?tab=calibration`}
              className={`inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground ${TRANSITION_PRESETS.fastColor}`}
            >
              {t('basicInfoTab.viewAllCalibrations')}
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>

          <div className={tl.container}>
            <div className={tl.line} aria-hidden="true" />
            {recentCalibrations.map((cal) => (
              <div key={cal.id} className={tl.item}>
                <div className={`${tl.dot.base} ${getDotClass(cal.result)}`} />
                <div className={tl.content}>
                  <div className={tl.date}>{fmtDate(cal.calibrationDate)}</div>
                  <div className={tl.title}>
                    {t('basicInfoTab.calibrationEntry')}
                    {cal.result &&
                      ` — ${tCal(`result.${cal.result}` as Parameters<typeof tCal>[0])}`}
                  </div>
                  <div className={tl.desc}>
                    {cal.calibrationAgency}
                    {cal.certificateNumber && ` · ${cal.certificateNumber}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
