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

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

/**
 * RFC 4180 계열 CSV 파서.
 *
 * - 쉼표, CRLF/LF, quoted field, escaped quote(`""`) 처리
 * - 첫 번째 행은 헤더로 해석
 * - 짧은 행은 빈 값으로 padding, 긴 행은 헤더 수에 맞춰 자름
 */
export function parseCsvTable(raw: string): ParsedCsv | null {
  const records = parseCsvRecords(raw);
  if (records.length === 0) return null;

  const [headers, ...rows] = records;
  const normalizedHeaders = headers.map((header) => header.trim());
  if (normalizedHeaders.length === 0 || normalizedHeaders.every((header) => header === '')) {
    return null;
  }

  const columnCount = normalizedHeaders.length;
  return {
    headers: normalizedHeaders,
    rows: rows
      .filter((row) => row.some((cell) => cell.trim().length > 0))
      .map((row) => normalizeCsvRow(row, columnCount)),
  };
}

function normalizeCsvRow(row: string[], columnCount: number): string[] {
  const normalized = row.map((cell) => cell.trim());
  while (normalized.length < columnCount) normalized.push('');
  return normalized.slice(0, columnCount);
}

function parseCsvRecords(raw: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    const nextChar = raw[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      record.push(field);
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      record.push(field);
      field = '';
      records.push(record);
      record = [];
      if (char === '\r' && nextChar === '\n') index += 1;
      continue;
    }

    field += char;
  }

  record.push(field);
  records.push(record);

  return records;
}
