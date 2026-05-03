import { APPROVAL_DETAIL_MODAL_TOKENS } from '@/lib/design-tokens';

describe('APPROVAL_DETAIL_MODAL_TOKENS', () => {
  it('uses fullscreen layout on mobile and restores centered modal from sm', () => {
    expect(APPROVAL_DETAIL_MODAL_TOKENS.content).toContain('inset-0');
    expect(APPROVAL_DETAIL_MODAL_TOKENS.content).toContain('h-dvh');
    expect(APPROVAL_DETAIL_MODAL_TOKENS.content).toContain('w-screen');
    expect(APPROVAL_DETAIL_MODAL_TOKENS.content).toContain('max-w-none');
    expect(APPROVAL_DETAIL_MODAL_TOKENS.content).toContain('rounded-none');
    expect(APPROVAL_DETAIL_MODAL_TOKENS.content).toContain('sm:left-[50%]');
    expect(APPROVAL_DETAIL_MODAL_TOKENS.content).toContain('sm:max-w-2xl');
    expect(APPROVAL_DETAIL_MODAL_TOKENS.content).toContain('sm:rounded-lg');
  });

  it('keeps the detail body scrollable inside the fullscreen grid row', () => {
    expect(APPROVAL_DETAIL_MODAL_TOKENS.content).toContain('grid-rows-[auto_minmax(0,1fr)_auto]');
    expect(APPROVAL_DETAIL_MODAL_TOKENS.scrollBody).toContain('min-h-0');
    expect(APPROVAL_DETAIL_MODAL_TOKENS.scrollBody).toContain('overflow-y-auto');
    expect(APPROVAL_DETAIL_MODAL_TOKENS.scrollBody).toContain('sm:max-h-[60vh]');
  });
});
