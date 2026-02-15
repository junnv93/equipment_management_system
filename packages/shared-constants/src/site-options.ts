/**
 * 사이트 필터 옵션 SSOT (Single Source of Truth)
 *
 * 이 파일은 사이트 셀렉트/필터 UI에서 사용하는 옵션의 유일한 소스입니다.
 * schemas 패키지의 SiteEnum + SITE_LABELS에서 프로그래밍적으로 생성합니다.
 *
 * SSOT 체인:
 *   @equipment-management/schemas: SiteEnum (값 정의) + SITE_LABELS (한글 라벨)
 *     → 이 파일: SITE_FILTER_OPTIONS (필터 UI용 옵션 배열)
 *       → EquipmentFilters.tsx, CalibrationSettingsContent.tsx 등 (import)
 *
 * 새 사이트 추가 시:
 * 1. schemas/enums.ts의 SiteEnum, SITE_LABELS, SITE_TO_CODE에 추가
 * 2. 프론트엔드는 이 파일을 통해 자동 반영
 */

import { SiteEnum, SITE_LABELS, type Site } from '@equipment-management/schemas';

/**
 * 사이트 필터 옵션 (필터 드롭다운용)
 *
 * SiteEnum.options에서 자동 생성 → 새 사이트 추가 시 자동 반영
 */
export const SITE_FILTER_OPTIONS: ReadonlyArray<{ value: Site; label: string }> =
  SiteEnum.options.map((site) => ({
    value: site,
    label: SITE_LABELS[site],
  }));
