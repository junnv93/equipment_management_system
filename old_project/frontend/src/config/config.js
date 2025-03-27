/**
 * 애플리케이션 전체에서 사용되는 설정 값을 관리하는 파일입니다.
 * 환경별(개발, 테스트, 프로덕션) 설정을 관리합니다.
 */

// 현재 환경 확인
const ENV = process.env.NODE_ENV || 'development';

// 기본 API URL 설정
const API_URL = {
  development: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api',
  test: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api',
  production: process.env.REACT_APP_API_BASE_URL || '/api',
};

// 프론트엔드 URL 설정
const FRONTEND_URL = {
  development: process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000',
  test: process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000',
  production: process.env.REACT_APP_FRONTEND_URL || '',
};

// 현재 환경에 맞는 설정 내보내기
export const config = {
  apiUrl: API_URL[ENV],
  frontendUrl: FRONTEND_URL[ENV],
  
  // API 엔드포인트 정의
  endpoints: {
    // 사용자 관련 엔드포인트
    users: {
      login: '/users/login/',
      me: '/users/me/',
      register: '/users/register/',
    },
    
    // 장비 관련 엔드포인트
    equipment: {
      base: '/equipment/',
      detail: (id) => `/equipment/${id}/`,
      calibration: (id) => `/equipment/${id}/calibration/`,
      calibrationHistory: (id, calibrationId) => `/equipment/${id}/calibration_history/${calibrationId}/`,
      maintenance: (id) => `/equipment/${id}/add_maintenance/`,
      maintenanceHistory: (id, maintenanceId) => `/equipment/${id}/maintenance/${maintenanceId}/`,
      repair: (id) => `/equipment/${id}/add_repair/`,
      repairHistory: (id, repairId) => `/equipment/${id}/repair_history/${repairId}/`,
      location: (id) => `/equipment/${id}/add_location_history/`,
      locationHistory: (id, locationId) => `/equipment/${id}/location_history/${locationId}/`,
    },
    
    // 대여/반납 관련 엔드포인트
    checkouts: {
      base: '/checkouts/',
      detail: (id) => `/checkouts/${id}/`,
    },
    
    // 대시보드 관련 엔드포인트
    dashboard: {
      summary: '/dashboard/summary/',
      stats: '/dashboard/stats/',
      calibrationReminder: '/dashboard/send_calibration_reminder/',
    },
  },
  
  // 기타 설정
  settings: {
    itemsPerPage: 10,
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
  },
};

/**
 * 전체 URL을 생성하는 헬퍼 함수
 * @param {string} endpoint - API 엔드포인트
 * @returns {string} 전체 URL
 */
export const getApiUrl = (endpoint) => {
  return `${config.apiUrl}${endpoint}`;
};

export default config; 