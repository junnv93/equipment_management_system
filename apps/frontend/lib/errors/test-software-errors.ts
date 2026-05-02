/**
 * Test Software 도메인 에러 매핑 SSOT
 *
 * @see packages/schemas/src/errors.ts (ErrorCode SSOT)
 * @see apps/frontend/messages/{ko,en}/software.json (errors namespace)
 *   — 호출자 useTranslations('software') 사용 (TestSoftwareDetailContent 패턴)
 */
import { ErrorCode } from '@equipment-management/schemas';
import { extractErrorCode, type ErrorToast } from './disposal-errors';

type TranslationFunction = (key: string, values?: Record<string, string | number | Date>) => string;

const TEST_SOFTWARE_ERROR_I18N_KEYS: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.TestSoftwareNotFound]: 'errors.notFound',
  [ErrorCode.EquipmentLinkNotFound]: 'errors.equipmentLinkNotFound',
};

export function mapTestSoftwareErrorToToast(error: unknown, t: TranslationFunction): ErrorToast {
  const code = extractErrorCode(error);
  const errorCode = code as ErrorCode | null;

  if (errorCode && TEST_SOFTWARE_ERROR_I18N_KEYS[errorCode]) {
    return {
      title: t('errors.title'),
      description: t(TEST_SOFTWARE_ERROR_I18N_KEYS[errorCode]!),
    };
  }

  return {
    title: t('errors.title'),
    description: error instanceof Error ? error.message : String(error),
  };
}
