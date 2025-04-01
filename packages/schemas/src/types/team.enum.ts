/**
 * 팀 종류에 대한 열거형 타입
 */
export enum TeamEnum {
  RF = 'rf',                 // RF 팀
  SAR = 'sar',               // SAR 팀
  EMC = 'emc',               // EMC 팀 
  AUTOMOTIVE = 'automotive', // Automotive 팀
  COMMON = 'common',         // 공통
}

/**
 * 팀 ID 타입 (데이터베이스 ID)
 */
export type TeamId = number; 