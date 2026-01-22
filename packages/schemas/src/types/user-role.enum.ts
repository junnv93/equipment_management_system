/**
 * 사용자 역할에 대한 열거형 타입
 *
 * 역할 코드는 UL-QP-18 장비 관리 절차서의 영문 명칭을 기준으로 합니다:
 * - Test Engineer (시험실무자)
 * - Technical Manager (기술책임자)
 * - Lab Manager (시험소장)
 */
export enum UserRoleEnum {
  TEST_ENGINEER = 'test_engineer', // 시험실무자 (Test Engineer)
  TECHNICAL_MANAGER = 'technical_manager', // 기술책임자 (Technical Manager)
  LAB_MANAGER = 'lab_manager', // 시험소장 (Lab Manager)
}
