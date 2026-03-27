/**
 * i18n 기반 Enum Label Hooks
 *
 * packages/schemas의 한국어 라벨 상수(SITE_LABELS, CLASSIFICATION_LABELS 등)를
 * 프론트엔드에서 직접 import하는 대신, i18n 메시지에서 로컬라이즈된 라벨을 제공합니다.
 *
 * 아키텍처:
 *   packages/schemas (SSOT: enum values)
 *     ↓ values array
 *   useTranslations (next-intl)
 *     ↓ t(`namespace.${enumValue}`)
 *   Record<EnumType, string> (기존 LABELS 상수와 동일한 형태)
 *
 * 사용법:
 *   // Before (하드코딩 한국어)
 *   import { SITE_LABELS } from '@equipment-management/schemas';
 *   {Object.entries(SITE_LABELS).map(([key, label]) => ...)}
 *
 *   // After (i18n)
 *   import { useSiteLabels } from '@/lib/i18n/use-enum-labels';
 *   const siteLabels = useSiteLabels();
 *   {Object.entries(siteLabels).map(([key, label]) => ...)}
 *
 * 성능:
 *   - useMemo로 메모이제이션 (로케일 변경 시에만 재계산)
 *   - useTranslations는 next-intl 내부 캐시 활용
 */

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  SITE_VALUES,
  ClassificationEnum,
  type Site,
  type Classification,
  type CalibrationMethod,
} from '@equipment-management/schemas';
import { CALIBRATION_METHOD_VALUES } from '@equipment-management/schemas';

// ============================================================================
// Site Labels
// ============================================================================

/**
 * i18n 기반 사이트 라벨 맵
 *
 * @returns Record<Site, string> — SITE_LABELS와 동일한 형태
 * @example
 *   const siteLabels = useSiteLabels();
 *   siteLabels.suwon  // "수원랩" (ko) | "Suwon Lab" (en)
 */
export function useSiteLabels(): Record<Site, string> {
  const t = useTranslations('equipment');
  return useMemo(
    () =>
      Object.fromEntries(
        SITE_VALUES.map((site) => [site, t(`siteLabel.${site}` as Parameters<typeof t>[0])])
      ) as Record<Site, string>,
    [t]
  );
}

// ============================================================================
// Classification Labels
// ============================================================================

/**
 * i18n 기반 분류 라벨 맵
 *
 * @returns Record<Classification, string> — CLASSIFICATION_LABELS와 동일한 형태
 * @example
 *   const classificationLabels = useClassificationLabels();
 *   classificationLabels.fcc_emc_rf  // "FCC EMC/RF"
 */
export function useClassificationLabels(): Record<Classification, string> {
  const t = useTranslations('equipment');
  return useMemo(
    () =>
      Object.fromEntries(
        ClassificationEnum.options.map((cls) => [
          cls,
          t(`classification.${cls}` as Parameters<typeof t>[0]),
        ])
      ) as Record<Classification, string>,
    [t]
  );
}

// ============================================================================
// Calibration Method Labels
// ============================================================================

/**
 * i18n 기반 교정 방법 라벨 맵
 *
 * @returns Record<CalibrationMethod, string> — CALIBRATION_METHOD_LABELS와 동일한 형태
 * @example
 *   const methodLabels = useCalibrationMethodLabels();
 *   methodLabels.external_calibration  // "외부 교정" (ko) | "External Calibration" (en)
 */
export function useCalibrationMethodLabels(): Record<CalibrationMethod, string> {
  const t = useTranslations('equipment');
  return useMemo(
    () =>
      Object.fromEntries(
        CALIBRATION_METHOD_VALUES.map((method) => [
          method,
          t(`filters.calibrationMethodLabel.${method}` as Parameters<typeof t>[0]),
        ])
      ) as Record<CalibrationMethod, string>,
    [t]
  );
}
