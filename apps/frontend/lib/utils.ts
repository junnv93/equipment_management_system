import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Re-export date utilities for compatibility
export { formatDate, formatDateTime, formatShortDate } from './utils/date';

/**
 * Tailwind CSS 클래스를 병합하기 위한 유틸리티 함수
 * clsx로 클래스 조건부 적용 후 tailwind-merge로 중복 스타일 해결
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 숫자를 통화 형식으로 변환 (예: 1000000 -> 1,000,000원)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * 문자열의 첫 글자를 대문자로 변환
 */
export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * 문자열을 안전하게 잘라내는 함수 (말줄임표 추가)
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * 현재 날짜로부터 지정된 일수만큼 이후의 날짜 계산
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
