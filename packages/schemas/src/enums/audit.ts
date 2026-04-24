import { z } from 'zod';

/**
 * SINGLE SOURCE OF TRUTH: 감사 로그 액션 열거형
 *
 * ## 감사 로그(Audit Log) vs 텔레메트리(Telemetry) 경계
 *
 * @AuditLog 데코레이터 사용 기준 (모두 충족 시에만 사용):
 *   ✅ 인증된 사용자의 의도적 비즈니스 액션 (req.user 존재)
 *   ✅ 비즈니스 엔티티의 상태 변경 또는 민감 조회
 *   ✅ 규정 준수(UL-QP-18) 또는 책임 추적이 필요한 이벤트
 *   ✅ 저빈도 이벤트 (DB write 부하 허용 수준)
 *
 * 텔레메트리/관찰 이벤트는 @AuditLog 금지 → NestJS Logger 사용:
 *   ❌ @Public() 엔드포인트 (req.user=undefined → 인터셉터 graceful skip)
 *   ❌ 시스템 상태 관찰 (health check, metrics, client-side errors)
 *   ❌ 고빈도 이벤트 (프론트엔드 에러 수집, 성능 메트릭)
 *   ❌ 응답이 void/NO_CONTENT (entityId 추출 불가)
 *
 * 표준 액션값 (소문자 + 언더스코어):
 * - create: 생성
 * - update: 수정
 * - delete: 삭제
 * - approve: 승인
 * - reject: 반려
 * - checkout: 반출
 * - return: 반입/반납
 * - cancel: 취소
 * - login: 로그인
 * - logout: 로그아웃
 * - read: 민감 조회 (QR 모바일 랜딩 등 책임 추적이 필요한 단일 리소스 조회)
 *
 * @see docs/development/API_STANDARDS.md
 */
export const AUDIT_ACTION_VALUES = [
  'create', // 생성
  'update', // 수정
  'delete', // 삭제
  'approve', // 승인
  'reject', // 반려
  'checkout', // 반출
  'return', // 반입/반납
  'cancel', // 취소
  'login', // 로그인
  'logout', // 로그아웃
  'close', // 종료 (부적합 종결)
  'reject_correction', // 조치 반려
  'export', // 내보내기 (보고서 파일 다운로드)
  'upload', // 파일 업로드
  'download', // 파일 다운로드
  'revision', // 문서 개정
  'link', // M:N 연결
  'unlink', // M:N 연결 해제
  'access_denied', // 권한/사이트 스코프 거부 (cross-site probing 추적)
  'submit', // 제출 (워크플로우 전이)
  'withdraw', // 제출 취소
  'resubmit', // 재제출
  'review', // 검토 (워크플로우 전이)
  'read', // 민감 조회 (QR 모바일 랜딩, 단일 리소스 조회 등 책임 추적 필요 시)
  'borrower_approve', // 대여 1차 승인 (차용 팀 TM)
  'borrower_reject', // 대여 1차 반려 (차용 팀 TM)
] as const;

export const AuditActionEnum = z.enum(AUDIT_ACTION_VALUES);
export type AuditAction = z.infer<typeof AuditActionEnum>;

/**
 * SINGLE SOURCE OF TRUTH: 감사 로그 엔티티 타입 열거형
 *
 * 표준 엔티티 타입값 (소문자 + 언더스코어):
 * - equipment: 장비
 * - calibration: 교정
 * - checkout: 반출
 * - rental: 대여
 * - user: 사용자
 * - team: 팀
 * - calibration_factor: 보정계수
 * - non_conformance: 부적합
 * - software: 소프트웨어
 * - calibration_plan: 교정계획서
 * - repair_history: 수리이력
 *
 * @see docs/development/API_STANDARDS.md
 */
export const AUDIT_ENTITY_TYPE_VALUES = [
  'equipment', // 장비
  'calibration', // 교정
  'checkout', // 반출
  'rental', // 대여
  'rental_import', // 대여 반입 (legacy — equipment_import로 대체됨)
  'user', // 사용자
  'team', // 팀
  'calibration_factor', // 보정계수
  'non_conformance', // 부적합
  'software', // 소프트웨어
  'calibration_plan', // 교정계획서
  'repair_history', // 수리이력
  'equipment_import', // 장비 반입
  'location_history', // 위치 이력
  'maintenance_history', // 유지보수 이력
  'incident_history', // 사고 이력
  'settings', // 설정
  'notification', // 알림
  'report', // 보고서
  'document', // 문서
  'software_validation', // 소프트웨어 유효성 확인
  'software_equipment_link', // 장비↔소프트웨어 연결
  'intermediate_inspection', // 중간점검
  'cable', // 케이블
  'cable_loss_measurement', // 케이블 손실 측정
  'self_inspection', // 자체점검
  'form_template', // 양식 템플릿
  'inspection_result_section', // 점검 결과 섹션
  'data_migration_session', // 데이터 마이그레이션 세션
] as const;

export const AuditEntityTypeEnum = z.enum(AUDIT_ENTITY_TYPE_VALUES);
export type AuditEntityType = z.infer<typeof AuditEntityTypeEnum>;
