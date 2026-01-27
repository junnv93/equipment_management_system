/**
 * uuid 모듈 타입 선언
 *
 * uuid v9.x는 자체 타입을 제공하지만, 특정 환경에서 인식되지 않을 수 있습니다.
 */
declare module 'uuid' {
  /**
   * UUID v4 생성 (랜덤 기반)
   */
  export function v4(): string;

  /**
   * UUID v1 생성 (타임스탬프 기반)
   */
  export function v1(): string;

  /**
   * UUID v5 생성 (네임스페이스 + 이름 기반, SHA-1)
   */
  export function v5(name: string, namespace: string | Uint8Array): string;

  /**
   * UUID v3 생성 (네임스페이스 + 이름 기반, MD5)
   */
  export function v3(name: string, namespace: string | Uint8Array): string;

  /**
   * UUID 유효성 검사
   */
  export function validate(uuid: string): boolean;

  /**
   * UUID 버전 확인
   */
  export function version(uuid: string): number;

  /**
   * UUID 파싱
   */
  export function parse(uuid: string): Uint8Array;

  /**
   * Uint8Array를 UUID 문자열로 변환
   */
  export function stringify(arr: Uint8Array, offset?: number): string;
}
