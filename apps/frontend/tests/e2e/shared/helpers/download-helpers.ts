/**
 * Download (양식 export) 동선 SSOT helper.
 *
 * UL-QP-18-NN 양식 다운로드 UI 동선의 결정성 보장:
 *   1) 사용자 클릭 → `<a download>` (blob URL) 트리거
 *   2) Playwright `waitForEvent('download')` 캡처
 *   3) Content-Disposition 의 `filename*=UTF-8''...` (RFC 5987) 한국어 파일명 보존 검증
 *   4) (옵션) 확장자 검증 (.docx / .xlsx)
 *
 * 기존 wf-19b/20b/21 spec 은 `page.request.get` API 직접 호출 — UI 동선 미커버.
 * 이 helper 로 작성된 spec 은 사용자 시점의 회귀(권한 게이팅 / 토스트 / 한글 파일명 인코딩)
 * 를 잡아낸다. 새 양식 export 버튼이 추가될 때마다 spec 에서 이 helper 만 호출하면
 * 동일 가드가 자동 적용된다.
 *
 * @example
 * ```ts
 * const button = page.getByRole('button', { name: '관리대장 내보내기' });
 * const download = await expectFileDownload(page, () => button.click(), {
 *   filenamePattern: /UL-QP-18-01.*\.docx$/,
 * });
 * ```
 */
import { expect, type Page, type Download } from '@playwright/test';

const DEFAULT_DOWNLOAD_TIMEOUT_MS = 15_000;

interface ExpectFileDownloadOptions {
  /**
   * `download.suggestedFilename()` 매칭 정규식.
   * 한국어 파일명 보존(RFC 5987 `filename*=UTF-8''...`) + 확장자 동시 검증 권장.
   * 미지정 시 파일명 패턴 검증을 건너뛴다.
   */
  filenamePattern?: RegExp;
  /**
   * waitForEvent('download') 타임아웃 (ms). 기본 15초.
   */
  timeout?: number;
}

/**
 * 다운로드 트리거 동작을 실행하고 결과 Download 객체를 반환한다.
 *
 * `Promise.all` race 안전 패턴 — `waitForEvent` 가 반드시 click 이전에 등록되어야
 * blob URL 다운로드 이벤트를 놓치지 않는다.
 *
 * @param page - 클릭 대상 Page
 * @param trigger - 다운로드를 발생시키는 비동기 동작 (보통 button.click())
 * @param options - 파일명 패턴 / 타임아웃
 * @returns Playwright Download 객체 (추가 검증/저장 가능)
 */
export async function expectFileDownload(
  page: Page,
  trigger: () => Promise<void>,
  options: ExpectFileDownloadOptions = {}
): Promise<Download> {
  const timeout = options.timeout ?? DEFAULT_DOWNLOAD_TIMEOUT_MS;
  const [download] = await Promise.all([page.waitForEvent('download', { timeout }), trigger()]);

  // 파일명은 SSOT(서버 Content-Disposition) 가 결정 — 클라이언트는 파싱만 수행.
  // RFC 5987 `filename*=UTF-8''...` 가 깨지면 한국어 파일명이 mojibake 로 떨어지므로
  // suggestedFilename() 패턴 매칭으로 회귀 가드.
  if (options.filenamePattern) {
    expect(download.suggestedFilename()).toMatch(options.filenamePattern);
  }

  return download;
}
