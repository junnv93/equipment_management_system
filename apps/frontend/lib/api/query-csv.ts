/**
 * CSV query parameter normalization SSOT.
 *
 * Backend Query DTOs accept CSV strings (`'id1,id2,id3'`) which Zod helpers like
 * `optionalCsvUuid` / `optionalCsvEnum` then split + validate per token.
 * Frontend callers naturally hold arrays — this helper is the single conversion
 * point so call sites never inline `Array.isArray ? join(',') : value`.
 *
 * Future encoding evolution (URL-encoded csv, JSON array, comma-escape) can
 * happen here without touching callers.
 */

export type CsvParamInput = string | readonly string[] | undefined | null;

export function toCsvParam(value: CsvParamInput): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  }
  if (value.length === 0) return undefined;
  const tokens = value.map((token) => token.trim()).filter((token) => token.length > 0);
  return tokens.length === 0 ? undefined : tokens.join(',');
}
