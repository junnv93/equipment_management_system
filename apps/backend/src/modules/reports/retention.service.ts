import { Injectable, Logger } from '@nestjs/common';
import { FORM_CATALOG } from '@equipment-management/shared-constants';

/**
 * 기록 보존연한 서비스 (UL-QP-18 섹션 15)
 *
 * 양식번호별 기본 보존연한 매핑 및 만료일 계산
 * 보존연한 데이터는 FORM_CATALOG (SSOT)에서 파생합니다.
 */

/** 양식번호별 기본 보존연한 (년) — FORM_CATALOG에서 파생 */
export const FORM_RETENTION_PERIODS: Record<string, { years: number; label: string }> =
  Object.fromEntries(
    Object.entries(FORM_CATALOG).map(([k, v]) => [
      k,
      { years: v.retentionYears, label: v.retentionLabel },
    ])
  );

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  /**
   * 양식번호에 해당하는 기본 보존연한 반환
   * @returns retentionPeriod 문자열 (예: "5년", "영구보존")
   */
  getDefaultRetentionPeriod(formNumber: string): string | null {
    return FORM_RETENTION_PERIODS[formNumber]?.label ?? null;
  }

  /**
   * 문서 생성일 기준으로 보존 만료일 계산
   * @returns null if 영구보존 (-1)
   */
  calculateRetentionExpiresAt(formNumber: string, createdAt: Date): Date | null {
    const config = FORM_RETENTION_PERIODS[formNumber];
    if (!config || config.years === -1) return null; // 영구보존

    const expiresAt = new Date(createdAt);
    expiresAt.setFullYear(expiresAt.getFullYear() + config.years);
    return expiresAt;
  }

  /**
   * 모든 양식번호와 보존연한 매핑 반환
   */
  getAllRetentionPeriods(): Record<string, { years: number; label: string }> {
    return { ...FORM_RETENTION_PERIODS };
  }
}
