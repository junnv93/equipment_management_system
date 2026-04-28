/// <reference types="@testing-library/jest-dom" />
import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CheckCircle2 } from 'lucide-react';

import { InlineActionButton } from '../inline-action-button';
import { resolveInlineActionVariant } from '@equipment-management/shared-constants';

// ── Mocks ─────────────────────────────────────────────────────────────────────
//
// design-tokens는 실제 토큰을 사용 (className 합성 검증을 위함). cn은 단순 join.
jest.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

// ── InlineActionButton — 8 케이스 ─────────────────────────────────────────────

describe('InlineActionButton', () => {
  it('4 variant 모두 SURFACE_INLINE_ACTION_TOKENS 합성 (base + variant + 임의 className)', () => {
    const variants = ['info', 'ok', 'warning', 'danger'] as const;
    for (const variant of variants) {
      const { unmount } = render(
        <InlineActionButton variant={variant} className="mt-2">
          {variant} 액션
        </InlineActionButton>
      );
      const btn = screen.getByRole('button', { name: new RegExp(variant) });
      expect(btn.className).toContain('h-7');
      expect(btn.className).toContain('font-semibold');
      expect(btn.className).toContain(`bg-surface-inline-action-${variant}-bg`);
      expect(btn.className).toContain(`text-surface-inline-action-${variant}-fg`);
      expect(btn.className).toContain(`border-surface-inline-action-${variant}-border`);
      expect(btn.className).toContain('mt-2');
      unmount();
    }
  });

  it('loading=true 시 aria-busy + disabled + Loader2 + 텍스트 동시 노출 (텍스트 가시성 유지)', () => {
    render(
      <InlineActionButton variant="info" loading>
        승인
      </InlineActionButton>
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('승인')).toBeInTheDocument(); // 텍스트가 사라지지 않음
    expect(btn.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('disabled prop은 loading 없이도 aria-disabled를 동기화', () => {
    render(
      <InlineActionButton variant="ok" disabled>
        반입 처리
      </InlineActionButton>
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-disabled', 'true');
  });

  it('disabled 시 onClick 호출 안 됨', () => {
    const handler = jest.fn();
    render(
      <InlineActionButton variant="info" disabled onClick={handler}>
        클릭불가
      </InlineActionButton>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('e.stopPropagation()이 부모 onClick으로 버블되지 않음', () => {
    const parentClick = jest.fn();
    const childClick = jest.fn((e: React.MouseEvent) => e.stopPropagation());
    render(
      <div onClick={parentClick}>
        <InlineActionButton variant="warning" onClick={childClick}>
          승인
        </InlineActionButton>
      </div>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(childClick).toHaveBeenCalledTimes(1);
    expect(parentClick).not.toHaveBeenCalled();
  });

  it('leadingIcon prop은 size-12 lucide 아이콘 1회 렌더 (와이어프레임 04 옵션)', () => {
    render(
      <InlineActionButton variant="ok" leadingIcon={CheckCircle2}>
        완료
      </InlineActionButton>
    );
    const btn = screen.getByRole('button');
    // lucide CheckCircle2는 svg 태그로 렌더됨
    const svg = btn.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('forwardRef — ref가 native HTMLButtonElement에 도달', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <InlineActionButton variant="info" ref={ref}>
        ref test
      </InlineActionButton>
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('default type은 "button" (form 내부 의도치 않은 submit 회피)', () => {
    render(<InlineActionButton variant="info">click me</InlineActionButton>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it("displayName이 'InlineActionButton'으로 설정 (DevTools 가독성)", () => {
    expect(InlineActionButton.displayName).toBe('InlineActionButton');
  });
});

// ── resolveInlineActionVariant 매트릭스 — 7+ 케이스 (co-location) ──────────────

describe('resolveInlineActionVariant — 와이어프레임 04 spec table 매트릭스', () => {
  it("urgency='critical'은 항상 'danger' (overdue 권위)", () => {
    expect(
      resolveInlineActionVariant({
        urgency: 'critical',
        nextAction: 'approve',
        isMyTurn: true,
      })
    ).toBe('danger');
    expect(
      resolveInlineActionVariant({
        urgency: 'critical',
        nextAction: 'submit_return',
        isMyTurn: false,
      })
    ).toBe('danger');
  });

  it("urgency='warning'은 항상 'warning' (D-0~D-2 권위)", () => {
    expect(
      resolveInlineActionVariant({
        urgency: 'warning',
        nextAction: 'borrower_receive',
        isMyTurn: true,
      })
    ).toBe('warning');
  });

  it("urgency='normal' + isMyTurn + (approve|borrower_approve) → 'warning' (내 차례 강조)", () => {
    expect(
      resolveInlineActionVariant({
        urgency: 'normal',
        nextAction: 'approve',
        isMyTurn: true,
      })
    ).toBe('warning');
    expect(
      resolveInlineActionVariant({
        urgency: 'normal',
        nextAction: 'borrower_approve',
        isMyTurn: true,
      })
    ).toBe('warning');
  });

  it("urgency='normal' + 반환·수령·반입 액션 → 'ok' (와이어프레임 04 spec, isMyTurn 무관)", () => {
    const okActions = [
      'submit_return',
      'lender_receive',
      'borrower_receive',
      'approve_return',
      'mark_in_use',
    ] as const;
    // isMyTurn=true와 false 양쪽 모두 'ok' (ok-class 액션은 isMyTurn에 종속되지 않음)
    for (const isMyTurn of [true, false]) {
      for (const nextAction of okActions) {
        expect(
          resolveInlineActionVariant({
            urgency: 'normal',
            nextAction,
            isMyTurn,
          })
        ).toBe('ok');
      }
    }
  });

  it("urgency='normal' + approve + 남의 차례 → 'info' (기본 진행)", () => {
    expect(
      resolveInlineActionVariant({
        urgency: 'normal',
        nextAction: 'approve',
        isMyTurn: false,
      })
    ).toBe('info');
  });

  it("nextAction=null (terminal)은 'info' default — 방어 케이스", () => {
    expect(
      resolveInlineActionVariant({
        urgency: 'normal',
        nextAction: null,
        isMyTurn: false,
      })
    ).toBe('info');
  });

  it("그 외 액션 (start, lender_check, borrower_return, reject, cancel) → 'info'", () => {
    const fallbackActions = [
      'start',
      'lender_check',
      'borrower_return',
      'reject',
      'cancel',
    ] as const;
    for (const nextAction of fallbackActions) {
      expect(
        resolveInlineActionVariant({
          urgency: 'normal',
          nextAction,
          isMyTurn: false,
        })
      ).toBe('info');
    }
  });
});
