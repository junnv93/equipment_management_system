/**
 * 데이터 마이그레이션 내부 타입 정의
 *
 * API 계약 타입(MigrationRowStatus, RowFieldError, MigrationRowPreview,
 * MigrationPreviewResult, MigrationExecuteResult)은 @equipment-management/schemas에서 import.
 * 이 파일은 백엔드 서비스 전용 내부 타입만 정의.
 */

// API 계약 타입 import (로컬 인터페이스에서 참조) + re-export (모듈 내부 단일 진입점)
import type {
  MigrationRowStatus,
  RowFieldError,
  MigrationRowPreview,
  MigrationPreviewResult,
  MigrationExecuteResult,
} from '@equipment-management/schemas';

export type {
  MigrationRowStatus,
  RowFieldError,
  MigrationRowPreview,
  MigrationPreviewResult,
  MigrationExecuteResult,
};

/** Excel에서 파싱된 원시 행 데이터 (내부 전용) */
export interface RawExcelRow {
  /** Excel 행 번호 (1-indexed, 헤더 제외) */
  rowNumber: number;
  /** 컬럼명 → 셀값 원시 매핑 */
  rawData: Record<string, unknown>;
}

/** 컬럼 매핑 후 정규화된 행 데이터 (내부 전용) */
export interface MappedRow {
  rowNumber: number;
  /** DB 필드명 → 값 (타입 변환 완료) */
  mappedData: Record<string, unknown>;
  /** 인식되지 않은 Excel 컬럼 헤더 목록 */
  unmappedColumns: string[];
}

/** 관리번호 자동 생성을 위한 사이트/분류 그룹 (내부 전용) */
export interface ManagementNumberGroup {
  site: string;
  classification: string;
  /** DB에서 조회한 현재 최대 일련번호 */
  maxSerial: number;
  /** 이 그룹의 행들에게 순차 할당할 카운터 */
  nextSerial: number;
}

/** 세션 스토리지 데이터 — 메모리 캐시 (내부 전용) */
export interface MigrationSession {
  sessionId: string;
  /** Preview를 요청한 사용자 ID — Execute 시 소유권 검증에 사용 */
  userId: string;
  /** 저장된 파일 경로 (FileUploadService 반환값) */
  filePath: string;
  /** 원본 파일명 */
  originalFileName: string;
  /** Preview 결과 (Execute에서 재사용) */
  previewResult: MigrationPreviewResult;
  createdAt: Date;
}
