/**
 * ⚠️ SINGLE SOURCE OF TRUTH: 엔티티별 필드명 한글 매핑
 *
 * DiffViewer 등에서 사용하는 필드명 한글 라벨입니다.
 * - 하드코딩 금지 (각 컴포넌트에서 중복 정의하지 말 것)
 * - getFieldLabel(entityType, fieldName) 헬퍼 함수 사용
 *
 * @see packages/schemas/src/audit-log.ts (AuditEntityType)
 * @remarks 서버 사이드 전용 — 프론트엔드 UI 표시에는 i18n 메시지(audit.fieldLabels.*)를 사용하세요.
 */

/**
 * 엔티티별 필드명 한글 매핑
 */
export const FIELD_LABELS: Record<string, Record<string, string>> = {
  // 장비 (equipment)
  equipment: {
    name: '장비명',
    managementNumber: '관리번호',
    modelNumber: '모델번호',
    manufacturer: '제조사명',
    serial: '일련번호',
    classification: '분류',
    site: '사이트',
    team: '팀',
    teamId: '팀',
    status: '상태',
    location: '위치',
    building: '건물',
    room: '호실',
    managementMethod: '관리 방법',
    calibrationDate: '교정일',
    nextCalibrationDate: '차기 교정일',
    calibrationCycle: '교정 주기',
    purchaseYear: '구입년도',
    purchasePrice: '구매 가격',
    assetNumber: '자산번호',
    notes: '비고',
    registeredBy: '등록자',
    registeredByName: '등록자',
    technicalManager: '운영책임자 (정)',
    deputyManagerId: '운영책임자 (부)',
    initialLocation: '최초 설치 위치',
    installationDate: '설치 일시',
    supplier: '공급사',
    supplierContact: '공급사 연락처',
    specMatch: '시방일치 여부',
    accessories: '부속품',
    description: '장비사양',
    serialNumber: '일련번호',
  },

  // 교정 (calibration)
  calibration: {
    equipmentId: '장비',
    equipmentName: '장비명',
    calibrationDate: '교정일',
    nextCalibrationDate: '차기 교정일',
    result: '교정 결과',
    approvalStatus: '승인 상태',
    approvedBy: '승인자',
    approverComment: '승인자 코멘트',
    rejectedBy: '반려자',
    rejectReason: '반려 사유',
    performedBy: '교정 수행자',
    externalAgency: '외부 기관',
    certificateNumber: '성적서 번호',
    notes: '비고',
  },

  // 반출 (checkout)
  checkout: {
    equipmentId: '장비',
    equipmentName: '장비명',
    type: '반출 유형',
    purpose: '반출 목적',
    status: '상태',
    requestedBy: '요청자',
    requestedByName: '요청자',
    approvedBy: '승인자',
    approvedByName: '승인자',
    approvedAt: '승인 시각',
    rejectedBy: '반려자',
    rejectionReason: '반려 사유',
    checkoutDate: '반출 시작일',
    expectedReturnDate: '반입 예정일',
    actualReturnDate: '실제 반입일',
    destination: '반출 목적지',
    notes: '비고',
  },

  // 교정계획서 (calibration_plan)
  calibration_plan: {
    year: '연도',
    version: '버전',
    status: '상태',
    submittedAt: '제출 시각',
    reviewedBy: '검토자',
    reviewedByName: '검토자',
    reviewedAt: '검토 시각',
    reviewComment: '검토 의견',
    approvedBy: '승인자',
    approvedByName: '승인자',
    approvedAt: '승인 시각',
    rejectedBy: '반려자',
    rejectionReason: '반려 사유',
    rejectionStage: '반려 단계',
  },

  // 부적합 (non_conformance)
  non_conformance: {
    equipmentId: '장비',
    equipmentName: '장비명',
    status: '상태',
    category: '분류',
    description: '내용',
    discoveredBy: '발견자',
    discoveredByName: '발견자',
    discoveredAt: '발견 시각',
    rootCause: '근본 원인',
    correctiveAction: '시정 조치',
    preventiveAction: '예방 조치',
    closedBy: '종료자',
    closedByName: '종료자',
    closedAt: '종료 시각',
    closureNotes: '종료 비고',
    rejectedBy: '반려자',
    rejectionReason: '반려 사유',
  },

  // 폐기 (disposal_requests)
  disposal: {
    equipmentId: '장비',
    equipmentName: '장비명',
    reason: '폐기 사유',
    reasonDetail: '상세 사유',
    reviewStatus: '검토 상태',
    requestedBy: '요청자',
    requestedByName: '요청자',
    requestedAt: '요청 시각',
    reviewedBy: '검토자',
    reviewedByName: '검토자',
    reviewedAt: '검토 시각',
    reviewOpinion: '검토 의견',
    approvedBy: '승인자',
    approvedByName: '승인자',
    approvedAt: '승인 시각',
    approvalComment: '승인 의견',
    rejectedBy: '반려자',
    rejectionReason: '반려 사유',
    rejectionStep: '반려 단계',
  },

  // 사용자 (user)
  user: {
    name: '이름',
    email: '이메일',
    role: '역할',
    site: '사이트',
    teamId: '팀',
    teamName: '팀명',
    isActive: '활성 상태',
  },

  // 팀 (team)
  team: {
    name: '팀명',
    site: '사이트',
    classification: '분류',
    leaderId: '팀장',
    leaderName: '팀장',
  },

  // 소프트웨어 (software)
  software: {
    equipmentId: '장비',
    name: '소프트웨어명',
    version: '버전',
    installedDate: '설치일',
    licenseKey: '라이선스 키',
    expiryDate: '만료일',
    vendor: '제공업체',
    notes: '비고',
  },

  // 보정계수 (calibration_factor)
  calibration_factor: {
    equipmentId: '장비',
    frequency: '주파수',
    factor: '보정계수',
    unit: '단위',
    effectiveDate: '적용일',
    notes: '비고',
  },
};

/**
 * 엔티티 타입과 필드명으로 한글 라벨 조회
 *
 * @param entityType - 엔티티 타입 (equipment, calibration, checkout 등)
 * @param fieldName - 필드명 (status, name 등)
 * @returns 한글 라벨 (예: "상태", "장비명") 또는 원본 필드명 (라벨이 없는 경우)
 *
 * @example
 * ```typescript
 * getFieldLabel('equipment', 'status') // → "상태"
 * getFieldLabel('calibration', 'result') // → "교정 결과"
 * getFieldLabel('equipment', 'unknownField') // → "unknownField" (원본)
 * ```
 */
export function getFieldLabel(entityType: string, fieldName: string): string {
  const entityLabels = FIELD_LABELS[entityType];
  if (!entityLabels) {
    return fieldName; // 엔티티 타입 라벨이 없으면 원본 반환
  }
  return entityLabels[fieldName] || fieldName; // 필드 라벨이 없으면 원본 반환
}

/**
 * 엔티티의 여러 필드를 한 번에 변환
 *
 * @param entityType - 엔티티 타입
 * @param fields - 필드명 배열
 * @returns 한글 라벨 배열
 *
 * @example
 * ```typescript
 * getFieldLabels('equipment', ['status', 'name', 'location'])
 * // → ["상태", "장비명", "위치"]
 * ```
 */
export function getFieldLabels(entityType: string, fields: string[]): string[] {
  return fields.map((field) => getFieldLabel(entityType, field));
}

/**
 * 엔티티의 모든 필드 라벨 조회
 *
 * @param entityType - 엔티티 타입
 * @returns 필드명 → 한글 라벨 매핑 객체
 */
export function getAllFieldLabels(entityType: string): Record<string, string> | undefined {
  return FIELD_LABELS[entityType];
}
