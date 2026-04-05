import { Injectable, Logger } from '@nestjs/common';

/**
 * 기록 보존연한 서비스 (UL-QP-18 섹션 15)
 *
 * 양식번호별 기본 보존연한 매핑 및 만료일 계산
 */

/** 양식번호별 기본 보존연한 (년) */
export const FORM_RETENTION_PERIODS: Record<string, { years: number; label: string }> = {
  'UL-QP-18-01': { years: -1, label: '영구보존' }, // 시험설비 관리 대장
  'UL-QP-18-02': { years: -1, label: '영구보존' }, // 시험설비 이력카드
  'UL-QP-18-03': { years: 5, label: '5년' }, // 중간점검표
  'UL-QP-18-04': { years: 5, label: '5년' }, // 교정 성적서
  'UL-QP-18-05': { years: 5, label: '5년' }, // 자체점검표
  'UL-QP-18-06': { years: 5, label: '5년' }, // 교정계획서
  'UL-QP-18-07': { years: 5, label: '5년' }, // 시험용 소프트웨어 관리대장
  'UL-QP-18-08': { years: 5, label: '5년' }, // Cable/Path Loss 관리대장
  'UL-QP-18-09': { years: 5, label: '5년' }, // 소프트웨어 유효성 확인
  'UL-QP-18-10': { years: 3, label: '3년' }, // 반출/반입 기록
  'UL-QP-18-11': { years: 3, label: '3년' }, // 부적합 보고서
};

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
