// utils/api.js에서 정의한 상수를 가져옵니다.
import { API_BASE_URL, EQUIPMENT_API, CHECKOUT_API } from '../utils/api';

// 추가적인 API 엔드포인트를 정의합니다.
export { API_BASE_URL, EQUIPMENT_API, CHECKOUT_API };

// 슬래시 중복을 방지하기 위해 마지막 슬래시를 제거합니다
const formatUrl = (url) => {
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const baseUrl = formatUrl(API_BASE_URL);

export const USER_API = `${baseUrl}/users/`;
export const DASHBOARD_API = `${baseUrl}/dashboard/`;