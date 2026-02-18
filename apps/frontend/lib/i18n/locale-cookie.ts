import { SUPPORTED_LOCALES, type SupportedLocale } from '@equipment-management/schemas';

const COOKIE_NAME = 'NEXT_LOCALE';
const MAX_AGE = 365 * 24 * 60 * 60; // 1년

export function setLocaleCookie(locale: SupportedLocale): void {
  document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
}

export function isValidLocale(value: string | undefined): value is SupportedLocale {
  if (!value) return false;
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
