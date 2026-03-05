import type { Checkout } from '@/lib/api/checkout-api';
import type { CheckoutStatus, CheckoutPurpose } from '@equipment-management/schemas';

export interface CheckoutGroup {
  /** 그룹 고유 키 (예: "2026-02-09|한국교정기술원") */
  key: string;
  /** 그룹 기준 날짜 (YYYY-MM-DD) */
  date: string;
  /** 날짜 라벨 ("반출일" | "신청일") — checkoutDate 유무에 따라 결정 */
  dateLabel: string;
  /** i18n 키 (예: "checkouts.groupCard.checkoutDateLabel") — Phase 3에서 전환 */
  dateLabelKey: string;
  /** 반출지 */
  destination: string;
  /** 반출지 i18n 키 (미지정일 때 사용) — Phase 3에서 전환 */
  destinationKey?: string;
  /** 해당 그룹의 checkout 목록 */
  checkouts: Checkout[];
  /** 그룹 내 전체 장비 수 */
  totalEquipment: number;
  /** 그룹 내 고유 상태 목록 */
  statuses: CheckoutStatus[];
  /** 그룹 내 고유 목적 목록 */
  purposes: CheckoutPurpose[];
}

/**
 * checkout에서 그룹화에 사용할 날짜(YYYY-MM-DD)를 추출합니다.
 * checkoutDate가 있으면 사용, 없으면 createdAt을 폴백으로 사용합니다.
 */
function getGroupDate(checkout: Checkout): { date: string; hasCheckoutDate: boolean } {
  if (checkout.checkoutDate) {
    return {
      date: checkout.checkoutDate.slice(0, 10),
      hasCheckoutDate: true,
    };
  }
  return {
    date: checkout.createdAt.slice(0, 10),
    hasCheckoutDate: false,
  };
}

/**
 * checkout 목록을 날짜+반출지 기준으로 그룹화합니다.
 *
 * - checkoutDate가 있으면 사용, 없으면 createdAt 폴백
 * - 최신 날짜 그룹이 상단 (내림차순)
 * - 같은 날짜 내에서는 반출지 가나다순
 */
export function groupCheckoutsByDateAndDestination(checkouts: Checkout[]): CheckoutGroup[] {
  const groupMap = new Map<string, { checkouts: Checkout[]; hasCheckoutDate: boolean }>();

  for (const checkout of checkouts) {
    const { date, hasCheckoutDate } = getGroupDate(checkout);
    const destination = checkout.destination || checkout.location || '미지정';
    const key = `${date}|${destination}`;

    const existing = groupMap.get(key);
    if (existing) {
      existing.checkouts.push(checkout);
      // 그룹 내 하나라도 checkoutDate가 있으면 "반출일"로 표시
      if (hasCheckoutDate) {
        existing.hasCheckoutDate = true;
      }
    } else {
      groupMap.set(key, { checkouts: [checkout], hasCheckoutDate });
    }
  }

  const groups: CheckoutGroup[] = [];

  for (const [key, { checkouts: groupCheckouts, hasCheckoutDate }] of Array.from(groupMap)) {
    const [date, destination] = key.split('|');

    // 그룹 내 전체 장비 수 집계
    const totalEquipment = groupCheckouts.reduce(
      (sum: number, co: Checkout) => sum + (co.equipment?.length || 0),
      0
    );

    // 고유 상태 목록
    const statusSet = new Set<CheckoutStatus>();
    for (const co of groupCheckouts) {
      statusSet.add(co.status);
    }

    // 고유 목적 목록
    const purposeSet = new Set<CheckoutPurpose>();
    for (const co of groupCheckouts) {
      if (co.purpose) {
        purposeSet.add(co.purpose as CheckoutPurpose);
      }
    }

    const isUnspecified = destination === '미지정';
    groups.push({
      key,
      date,
      dateLabel: hasCheckoutDate ? '반출일' : '신청일',
      dateLabelKey: hasCheckoutDate
        ? 'checkouts.groupCard.checkoutDateLabel'
        : 'checkouts.groupCard.requestDateLabel',
      destination,
      destinationKey: isUnspecified ? 'checkouts.groupCard.unspecifiedDestination' : undefined,
      checkouts: groupCheckouts,
      totalEquipment,
      statuses: Array.from(statusSet),
      purposes: Array.from(purposeSet),
    });
  }

  // 정렬: 날짜 내림차순, 같은 날짜 내 반출지 가나다순
  return groups.toSorted((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return a.destination.localeCompare(b.destination, 'ko');
  });
}
