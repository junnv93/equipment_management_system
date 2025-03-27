/**
 * 날짜 형식을 포맷팅하는 유틸리티 함수
 * @param {string|Date} date - 포맷팅할 날짜 (문자열 또는 Date 객체)
 * @param {boolean} includeTime - 시간 포함 여부 (기본값: false)
 * @returns {string} 포맷팅된 날짜 문자열
 */
export const formatDate = (date, includeTime = false) => {
  if (!date) return '-';
  
  try {
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return dateObj.toLocaleDateString('ko-KR', options);
  } catch (error) {
    console.error('Date formatting error:', error);
    return '-';
  }
};

/**
 * 숫자를 통화 형식으로 포맷팅하는 유틸리티 함수
 * @param {number} amount - 포맷팅할 금액
 * @param {string} currency - 통화 코드 (기본값: 'KRW')
 * @returns {string} 포맷팅된 통화 문자열
 */
export const formatCurrency = (amount, currency = 'KRW') => {
  if (amount === null || amount === undefined) return '-';
  
  try {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  } catch (error) {
    console.error('Currency formatting error:', error);
    return amount.toString();
  }
};

/**
 * 문자열의 길이를 제한하고 초과 시 말줄임표를 추가하는 유틸리티 함수
 * @param {string} text - 제한할 문자열
 * @param {number} maxLength - 최대 길이 (기본값: 50)
 * @returns {string} 제한된 문자열
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
};

/**
 * 파일 크기를 사람이 읽기 쉬운 형식으로 변환하는 유틸리티 함수
 * @param {number} bytes - 바이트 단위의 파일 크기
 * @param {number} decimals - 소수점 자릿수 (기본값: 2)
 * @returns {string} 포맷팅된 파일 크기
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * 전화번호 형식을 포맷팅하는 유틸리티 함수
 * @param {string} phoneNumber - 포맷팅할 전화번호
 * @returns {string} 포맷팅된 전화번호
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // 숫자만 추출
  const cleaned = ('' + phoneNumber).replace(/\D/g, '');
  
  // 한국 전화번호 형식에 맞게 포맷팅
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  } else if (cleaned.length === 8) {
    return cleaned.replace(/(\d{4})(\d{4})/, '$1-$2');
  }
  
  return phoneNumber;
}; 