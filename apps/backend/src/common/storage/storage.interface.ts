/**
 * 파일 스토리지 Provider 인터페이스
 *
 * 구현체를 교체하면 Local FS → S3 호환(RustFS, MinIO, AWS S3) 등으로 전환 가능합니다.
 *
 * @example
 * // Local (기본): 단일 서버 개발/온프레미스 환경
 * // S3 (프로덕션): 컨테이너 재시작 후에도 파일 영속, 다중 인스턴스 지원
 */
export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

export interface IStorageProvider {
  /** 컨테이너(버킷/디렉토리) 초기화 — 앱 부트스트랩 시 호출 */
  ensureContainer(): Promise<void>;
  /** 파일 업로드 */
  upload(key: string, body: Buffer, contentType: string): Promise<void>;
  /** 파일 다운로드 */
  download(key: string): Promise<Buffer>;
  /** 파일 삭제 — 실패해도 예외 미발생 (warn만) */
  delete(key: string): Promise<void>;

  /** Presigned URL 지원 여부 (S3만 true) */
  supportsPresignedUrl(): boolean;

  /**
   * 다운로드용 Presigned URL 생성
   * @param key 스토리지 키
   * @param originalFileName 다운로드 시 파일명 (Content-Disposition)
   * @param expiresIn 만료 시간 (초, 기본 3600)
   */
  getPresignedDownloadUrl?(
    key: string,
    originalFileName: string,
    expiresIn?: number
  ): Promise<string>;
}
