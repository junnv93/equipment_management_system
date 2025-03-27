import { format, parseISO, isValid } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * ISO 문자열이나 Date 객체를 받아 사용자 친화적인 날짜 형식으로 변환합니다.
 * @param date ISO 문자열 또는 Date 객체
 * @param formatStr 원하는 포맷 문자열 (기본값: 'yyyy년 MM월 dd일')
 * @param includeTime 시간 포함 여부 (기본값: false)
 * @returns 포맷된 날짜 문자열, 유효하지 않은 날짜는 '-'로 표시
 */
export function formatDate(
  date: string | Date | undefined | null,
  formatStr?: string,
  includeTime: boolean = false
): string {
  if (!date) return '-';
  
  try {
    // Date 객체가 아니면 ISO 문자열로 간주하고 파싱
    const dateObj = date instanceof Date ? date : parseISO(date);
    
    // 유효한 날짜인지 확인
    if (!isValid(dateObj)) return '-';
    
    // formatStr이 제공되지 않은 경우 includeTime에 따라 기본 포맷 사용
    const defaultFormat = includeTime ? 'yyyy.MM.dd HH:mm' : 'yyyy.MM.dd';
    return format(dateObj, formatStr || defaultFormat, { locale: ko });
  } catch (error) {
    console.error('Date formatting error:', error);
    return '-';
  }
}

/**
 * ISO 문자열이나 Date 객체를 받아 날짜와 시간을 포함한 형식으로 변환합니다.
 * @param date ISO 문자열 또는 Date 객체
 * @returns 포맷된 날짜와 시간 문자열, 유효하지 않은 날짜는 '-'로 표시
 */
export function formatDateTime(date: string | Date | undefined | null): string {
  return formatDate(date, 'yyyy년 MM월 dd일 HH:mm');
}

/**
 * ISO 문자열이나 Date 객체를 받아 간략한 날짜 형식으로 변환합니다.
 * @param date ISO 문자열 또는 Date 객체
 * @returns 포맷된 간략한 날짜 문자열, 유효하지 않은 날짜는 '-'로 표시
 */
export function formatShortDate(date: string | Date | undefined | null): string {
  return formatDate(date, 'yy.MM.dd');
}

/**
 * 현재 날짜로부터 지정된 일수 후의 날짜를 계산합니다.
 * @param days 더할 일수
 * @returns 계산된 Date 객체
 */
export function addDaysFromToday(days: number): Date {
  const today = new Date();
  return new Date(today.setDate(today.getDate() + days));
}

/**
 * 두 날짜 사이의 일수 차이를 계산합니다.
 * @param date1 비교할 첫 번째 날짜 (ISO 문자열 또는 Date 객체)
 * @param date2 비교할 두 번째 날짜 (ISO 문자열 또는 Date 객체, 기본값: 오늘)
 * @returns 일수 차이 (정수)
 */
export function daysBetween(date1: string | Date, date2: string | Date = new Date()): number {
  try {
    const d1 = date1 instanceof Date ? date1 : parseISO(date1);
    const d2 = date2 instanceof Date ? date2 : parseISO(date2);
    
    // 유효한 날짜인지 확인
    if (!isValid(d1) || !isValid(d2)) return 0;
    
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Date calculation error:', error);
    return 0;
  }
}

/**
 * 현재 날짜로부터 지정된 일수만큼 이후의 날짜를 반환
 * @param days 추가할 일수
 * @returns ISO 형식 날짜 문자열
 */
export function getDateAfterDays(days: number): string {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + days);
  return futureDate.toISOString().split('T')[0];
}

/**
 * 현재 날짜로부터 지정된 일수만큼 이전의 날짜를 반환
 * @param days 뺄 일수
 * @returns ISO 형식 날짜 문자열
 */
export function getDateBeforeDays(days: number): string {
  const today = new Date();
  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - days);
  return pastDate.toISOString().split('T')[0];
}

/**
 * 날짜가 오늘 이전인지 확인
 * @param dateString ISO 형식 날짜 문자열
 * @returns 오늘 이전이면 true, 아니면 false
 */
export function isDateOverdue(dateString: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 오늘 자정으로 설정
  
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0); // 비교 날짜도 자정으로 설정
  
  return targetDate < today;
}

/**
 * 현재 시간을 한국 시간대 기준으로 반환
 * @returns 현재 시간 ISO 문자열
 */
export function getCurrentDateTime(): string {
  return new Date().toISOString();
} 