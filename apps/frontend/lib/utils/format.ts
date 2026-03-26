/**
 * 파일 크기 포맷 유틸리티 — SSOT
 *
 * 문서 관련 UI에서 파일 크기를 표시할 때 사용합니다.
 * AttachmentsTab, DocumentRevisionDialog 등에서 공통 사용.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
