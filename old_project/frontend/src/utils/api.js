// API URL을 환경 변수에서 가져옵니다.
// 환경 변수가 없으면 기본값으로 로컬 서버를 사용합니다.
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

// 슬래시 중복을 방지하기 위해 마지막 슬래시를 제거합니다
const formatUrl = (url) => {
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const baseUrl = formatUrl(API_BASE_URL);

export const EQUIPMENT_API = `${baseUrl}/equipment/`;
export const CHECKOUT_API = `${baseUrl}/checkouts/`;

export const getToken = () => {
  const token = localStorage.getItem('token');
  console.log('Token from localStorage:', token);
  return token;
};

export const getAuthHeader = () => {
  const token = getToken();
  return token ? `Bearer ${token}` : '';
};

export const handleApiError = (error) => {
  if (error.response) {
    return error.response.data;
  }
  return { message: error.message };
};