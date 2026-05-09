/**
 * Non-Conformance 시드 reset 헬퍼 (SSOT)
 *
 * 시드 NC 행을 특정 status 로 멱등 복원. spec 간 race condition 방지 + DRY.
 *
 * 호출지:
 *  - `tests/e2e/features/non-conformances/nc-rejection-flow.spec.ts` (NC_006 + NC_007)
 *  - `tests/e2e/features/i18n/zod-fail-toast.spec.ts` (NC_006 단독)
 *
 * SQL 패턴: `UPDATE non_conformances SET status=..., version=1, ... WHERE id=$1`.
 *  - status='corrected' 의 경우 corrected_by/correction_date/correction_content 채움
 *  - 다른 status 도 향후 확장 가능 (open/resolved/closed)
 *
 * 캐시 invalidation: backend `/api/auth/test-cache-clear` POST 1회 호출 (다중 NC reset 후 일괄).
 */
import { Pool } from 'pg';
import { BASE_URLS, TEST_USER_IDS } from '../constants/shared-test-data';

interface ResetNcsToCorrectedOptions {
  /** correction 작성자 user UUID — 미지정 시 TECHNICAL_MANAGER_SUWON 기본값 */
  readonly correctorId?: string;
  /** correction 본문 — 미지정 시 generic placeholder */
  readonly correctionContent?: string;
}

/**
 * 시드 NC 행 N건을 corrected 상태로 일괄 복원.
 *
 * 멱등성 보장: 다른 spec 의 reject/close 결과(`status='open'/'closed'`)가 잔존해도
 * 본 헬퍼 호출 1회로 corrected 상태 재진입.
 *
 * @example
 *   await resetNcsToCorrected([TEST_NC_IDS.NC_006_WITH_REPAIR]);
 *   await resetNcsToCorrected(
 *     [TEST_NC_IDS.NC_006_WITH_REPAIR, TEST_NC_IDS.NC_007_DAMAGE_CORRECTED],
 *     { correctorId: TEST_USER_IDS.TECHNICAL_MANAGER_SUWON },
 *   );
 */
export async function resetNcsToCorrected(
  ncIds: readonly string[],
  options: ResetNcsToCorrectedOptions = {}
): Promise<void> {
  if (ncIds.length === 0) return;

  const correctorId = options.correctorId ?? TEST_USER_IDS.TECHNICAL_MANAGER_SUWON;
  const correctionContent = options.correctionContent ?? '내부 연결부 교체 완료';

  const pool = new Pool({ connectionString: BASE_URLS.DATABASE, max: 2 });
  try {
    for (const ncId of ncIds) {
      await pool.query(
        `UPDATE non_conformances
         SET status = 'corrected', version = 1,
             rejected_by = NULL, rejected_at = NULL, rejection_reason = NULL,
             closed_by = NULL, closed_at = NULL, closure_notes = NULL,
             corrected_by = $2, correction_date = NOW() - INTERVAL '3 days',
             correction_content = $3,
             updated_at = NOW()
         WHERE id = $1`,
        [ncId, correctorId, correctionContent]
      );
    }
    // 캐시 클리어 — 1회 일괄 (DB 갱신 후 backend 캐시 stale 방지)
    await fetch(`${BASE_URLS.BACKEND}/api/auth/test-cache-clear`, { method: 'POST' });
  } finally {
    await pool.end();
  }
}
