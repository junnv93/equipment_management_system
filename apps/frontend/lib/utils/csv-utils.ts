/**
 * RFC 4180 CSV 유틸리티
 *
 * - 셀 값 내 `"` → `""` 이스케이프
 * - `=`, `+`, `-`, `@`, `\t`, `\r`, `\n` 시작 값에 `'` 프리픽스 (Excel 공식 주입 방지)
 */
export function sanitizeCsvCell(value: unknown): string {
  const str = String(value ?? '').replace(/"/g, '""');
  if (/^[=+\-@\t\r\n]/.test(str)) {
    return `"'${str}"`;
  }
  return `"${str}"`;
}
