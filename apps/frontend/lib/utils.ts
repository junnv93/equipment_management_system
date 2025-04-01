import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Tailwind CSS 클래스를 병합하기 위한 유틸리티 함수
 * clsx로 클래스 조건부 적용 후 tailwind-merge로 중복 스타일 해결
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 날짜를 YYYY-MM-DD 형식의 문자열로 변환
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * 숫자를 통화 형식으로 변환 (예: 1000000 -> 1,000,000원)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
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
  return str.slice(0, maxLength) + "...";
}

/**
 * 대여 상태에 따른 배지 색상 반환
 */
export function getRentalStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "borrowed":
      return "bg-blue-100 text-blue-800";
    case "returned":
      return "bg-gray-100 text-gray-800";
    case "overdue":
      return "bg-orange-100 text-orange-800";
    case "return_requested":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/**
 * 현재 날짜로부터 지정된 일수만큼 이후의 날짜 계산
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
