/**
 * Content-Disposition 헤더 빌더 (RFC 5987)
 *
 * 한글/특수문자 파일명의 브라우저 호환성을 보장하기 위해 UTF-8 인코딩 사용.
 * filename* 파라미터(RFC 5987)는 IE11+, Chrome, Firefox, Safari 모두 지원.
 *
 * SSOT: 모든 파일 다운로드 컨트롤러는 이 함수를 경유해야 함.
 * 직접 헤더 문자열 조립 금지 (9번째 중복 발생 방지).
 */
export function buildContentDisposition(
  filename: string,
  disposition: 'attachment' | 'inline' = 'attachment'
): string {
  return `${disposition}; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
