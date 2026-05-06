import type { ExtractedCalibrationCertificate } from '@equipment-management/schemas';
import type { CalibrationFormValues } from '@/lib/schemas/calibration-form-schema';

/**
 * HCT 교정기관명 — 추출된 PDF의 발급기관 식별 결과를 폼의 자유 텍스트
 * `calibrationAgency` 필드로 변환할 때 사용. SSOT 위치는 추출 service의
 * HCT_FORM_MARKERS이지만 frontend는 영문 enum('HCT')만 받으므로 i18n
 * 라벨은 별도. 한글 정식 표기는 calibration 도메인의 사용자 표기와 일치.
 */
const HCT_AGENCY_LABEL = '주식회사 에이치시티' as const;

/**
 * 차기교정주기 추정 (월 단위).
 * - PDF 추출 시점에는 `nextCalibrationDate - calibrationDate` 차이로 주기 도출.
 * - 누락 케이스(KOLAS-G-008 비대상)는 계산 불가 → undefined 반환 → 사용자 수동 입력.
 *
 * 30일 단위 round로 평균 월 산출 (1년 = 12개월, 6개월 등 표준 주기와 일치).
 */
function inferCalibrationCycleMonths(
  calibrationDate: string,
  nextCalibrationDate: string | null
): number | undefined {
  if (!nextCalibrationDate) return undefined;
  const cal = new Date(`${calibrationDate}T00:00:00Z`);
  const next = new Date(`${nextCalibrationDate}T00:00:00Z`);
  const diffMs = next.getTime() - cal.getTime();
  if (diffMs <= 0 || !Number.isFinite(diffMs)) return undefined;
  const days = diffMs / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.round(days / 30));
}

/**
 * 추출 결과 → CalibrationForm defaultValues 어댑터.
 *
 * 시니어급 합성(composition):
 * - 추출 service는 PDF→meta만 (단일 책임)
 * - 이 어댑터는 meta→form defaults만 (단일 책임)
 * - CalibrationForm은 defaults → 사용자 보정 → submit (단일 책임)
 *
 * `equipmentId`는 어댑터 호출자가 별도로 결정합니다 (managementNumber로 equipment
 * 조회 → id resolve). 어댑터는 PDF에 들어 있는 정보만 변환하고, 도메인 lookup은
 * 호출자가 책임집니다 — 단방향 의존성 유지.
 *
 * @param extracted PDF에서 추출된 표지 메타데이터
 * @param certificateFile 사용자가 업로드한 원본 PDF (CalibrationForm의 file 필드 채움)
 * @param equipmentId 매칭된 장비 ID (호출자가 lookup으로 resolve, 미매칭 시 undefined)
 */
export function extractedToFormDefaults(
  extracted: ExtractedCalibrationCertificate,
  certificateFile: File,
  equipmentId: string | undefined
): Partial<CalibrationFormValues> {
  const calibrationCycle = inferCalibrationCycleMonths(
    extracted.calibrationDate,
    extracted.nextCalibrationDate
  );

  return {
    equipmentId,
    calibrationDate: new Date(`${extracted.calibrationDate}T00:00:00`),
    nextCalibrationDate: extracted.nextCalibrationDate
      ? new Date(`${extracted.nextCalibrationDate}T00:00:00`)
      : undefined,
    calibrationCycle,
    calibrationAgency: HCT_AGENCY_LABEL,
    certificateNumber: extracted.certificateNumber,
    certificateFile,
  };
}
