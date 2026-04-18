/**
 * 성공 경로 부작용(invalidate, toast 등) 콜백을 안전하게 실행합니다.
 *
 * 콜백이 throw/reject해도 호출자의 성공 응답을 뒤집지 않습니다.
 * 실패는 console.error 로그만 남기고 resolve로 흡수합니다.
 *
 * AD-7: use-optimistic-mutation / use-mutation-with-refresh 양쪽에서 공유.
 */
export async function safeCallback<R>(
  fn: (() => R | Promise<R>) | undefined,
  label: string
): Promise<void> {
  if (!fn) return;
  try {
    await fn();
  } catch (err) {
    console.error(`[${label}]`, err instanceof Error ? err.message : err);
  }
}
