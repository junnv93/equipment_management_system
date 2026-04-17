/**
 * QR URL 빌더 / 파서 — FE/BE 공용 SSOT
 *
 * ⚠️ 이 파일이 장비 QR URL 포맷의 단일 소스입니다.
 * - 프론트엔드 EquipmentQRCode 컴포넌트 (생성)
 * - 프론트엔드 스캐너 (Phase 2, 역파싱)
 * - 백엔드 알림/이메일 링크 (Phase 2+, 서버 렌더)
 *
 * 원칙:
 * - 환경변수(process.env.*) 직접 참조 금지 → `appUrl` 파라미터 주입
 * - 관리번호 유효성은 `parseManagementNumber` SSOT 경유 (정규식 재정의 금지)
 * - 임시 관리번호(TEMP-*)는 Phase 1 범위 제외
 */

import { parseManagementNumber } from '@equipment-management/schemas';

/**
 * 장비 QR URL 경로 (host 제외 부분)
 *
 * `/e/{managementNumber}` 형식은 `FRONTEND_ROUTES.EQUIPMENT.BY_MGMT`와 일치해야 합니다.
 * 변경 시 두 SSOT를 함께 갱신하세요.
 */
export const EQUIPMENT_QR_PATH_PREFIX = '/e/' as const;

/**
 * Handover QR URL 경로 (token은 query string으로 전달).
 *
 * `/handover?token={jwt}` 형식은 `FRONTEND_ROUTES.HANDOVER(token)`와 일치.
 * QR 페이로드 파싱 시 URL path prefix + token 파라미터 양쪽 매칭.
 */
export const HANDOVER_QR_PATH = '/handover' as const;
export const HANDOVER_QR_TOKEN_PARAM = 'token' as const;

/**
 * 장비 QR URL을 생성합니다.
 *
 * @param managementNumber 유효한 관리번호 (예: 'SUW-E0001')
 * @param appUrl 애플리케이션 베이스 URL (프론트엔드: `NEXT_PUBLIC_APP_URL` 또는 `window.location.origin`,
 *                                       백엔드: `env.FRONTEND_URL`). 후행 슬래시 유무 무관.
 * @returns 절대 URL (예: 'https://ems.example.com/e/SUW-E0001')
 * @throws {Error} appUrl 미지정 / 빈 문자열 / 유효하지 않은 관리번호
 *
 * @example
 * buildEquipmentQRUrl('SUW-E0001', 'https://ems.example.com')
 * // → 'https://ems.example.com/e/SUW-E0001'
 */
export function buildEquipmentQRUrl(managementNumber: string, appUrl: string): string {
  if (!appUrl || appUrl.trim() === '') {
    throw new Error(
      'buildEquipmentQRUrl: `appUrl` is required. ' +
        'Frontend callers must pass `NEXT_PUBLIC_APP_URL` or `window.location.origin`; ' +
        'backend callers must pass `FRONTEND_URL`.'
    );
  }

  if (!parseManagementNumber(managementNumber)) {
    throw new Error(
      `buildEquipmentQRUrl: invalid management number "${managementNumber}". ` +
        'Expected format like "SUW-E0001".'
    );
  }

  const normalizedBase = appUrl.replace(/\/+$/, '');
  return `${normalizedBase}${EQUIPMENT_QR_PATH_PREFIX}${encodeURIComponent(managementNumber)}`;
}

/**
 * 장비 QR URL을 역파싱합니다.
 *
 * 스캐너(Phase 2)가 임의의 URL을 받았을 때 자사 장비 QR인지 판정하는 용도.
 * 관리번호 유효성까지 검증합니다.
 *
 * @param url 전체 URL 문자열
 * @returns 파싱 성공 시 `{ managementNumber }`, 실패 시 `null`
 *
 * @example
 * parseEquipmentQRUrl('https://ems.example.com/e/SUW-E0001')
 * // → { managementNumber: 'SUW-E0001' }
 * parseEquipmentQRUrl('https://other.com/foo')
 * // → null
 */
/**
 * Handover 인수인계 QR URL을 생성합니다.
 *
 * @param token 서명된 JWT 토큰 (백엔드 `POST /checkouts/:uuid/handover-token` 응답)
 * @param appUrl 애플리케이션 베이스 URL (프론트/백엔드 주입 방식 동일)
 * @throws {Error} 인자 누락 시
 *
 * @example
 * buildHandoverQRUrl('eyJhbGciOi...', 'https://ems.example.com')
 * // → 'https://ems.example.com/handover?token=eyJhbGciOi...'
 */
export function buildHandoverQRUrl(token: string, appUrl: string): string {
  if (!token || token.trim() === '') {
    throw new Error('buildHandoverQRUrl: `token` is required');
  }
  if (!appUrl || appUrl.trim() === '') {
    throw new Error(
      'buildHandoverQRUrl: `appUrl` is required. ' +
        'Frontend callers must pass `NEXT_PUBLIC_APP_URL` or `window.location.origin`; ' +
        'backend callers must pass `FRONTEND_URL`.'
    );
  }
  const normalizedBase = appUrl.replace(/\/+$/, '');
  return `${normalizedBase}${HANDOVER_QR_PATH}?${HANDOVER_QR_TOKEN_PARAM}=${encodeURIComponent(token)}`;
}

/**
 * Handover QR URL을 역파싱합니다.
 *
 * @returns 파싱 성공 시 `{ token }`, 실패 시 `null`
 */
export function parseHandoverQRUrl(url: string): { token: string } | null {
  try {
    const parsed = new URL(url);
    if (parsed.pathname !== HANDOVER_QR_PATH) return null;
    const token = parsed.searchParams.get(HANDOVER_QR_TOKEN_PARAM);
    return token && token.trim() !== '' ? { token } : null;
  } catch {
    return null;
  }
}

export function parseEquipmentQRUrl(url: string): { managementNumber: string } | null {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    // URL 생성 실패 (상대 경로 혹은 비-URL) → 직접 경로 매칭 fallback
    pathname = url;
  }

  if (!pathname.startsWith(EQUIPMENT_QR_PATH_PREFIX)) {
    return null;
  }

  const raw = pathname.slice(EQUIPMENT_QR_PATH_PREFIX.length);
  // 추가 경로 세그먼트(`/e/SUW-E0001/extra`) 거부
  if (raw.includes('/')) {
    return null;
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }

  if (!parseManagementNumber(decoded)) {
    return null;
  }

  return { managementNumber: decoded };
}
