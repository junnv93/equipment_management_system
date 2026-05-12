/// <reference types="@testing-library/jest-dom" />
import * as React from 'react';
import { render, screen } from '@testing-library/react';

// 실 i18n 메시지(ko) 를 namespace-resolver 로 lookup — aria-label tone 통합 회귀 차단.
import qrMessages from '../../../messages/ko/qr.json';

jest.mock('next-intl', () => {
  // useTranslations('qr.statusBadge') → t('status.available') → resolve from ko/qr.json
  const get = (path: string): string => {
    const parts = path.split('.');
    let cur: unknown = qrMessages;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        return path;
      }
    }
    return typeof cur === 'string' ? cur : path;
  };
  return {
    useTranslations: (namespace?: string) => (key: string) => {
      // namespace 가 'qr.statusBadge' 이면 ko.qr 의 'statusBadge.<key>' lookup.
      // qrMessages 는 'qr' namespace 의 내용 — 따라서 namespace 에서 'qr.' prefix 제거 후 resolve.
      if (!namespace) return get(key);
      const ns = namespace.replace(/^qr\./, '');
      return get(`${ns}.${key}`);
    },
    useLocale: () => 'ko',
  };
});

import { StatusBadge } from '../StatusBadge';
import { EquipmentStatusEnum } from '@equipment-management/schemas';

describe('StatusBadge', () => {
  // EQUIPMENT_STATUS_TONE SSOT (packages/shared-constants/src/equipment-status-tone.ts):
  // available=ok / checked_out=warn / non_conforming=urgent / spare=mute /
  // pending_disposal=urgent / disposed=mute / temporary=warn / inactive=mute.
  const cases: Array<{
    status: (typeof EquipmentStatusEnum.options)[number];
    statusLabel: string;
    toneLabel: string;
  }> = [
    { status: 'available', statusLabel: '사용 가능', toneLabel: '정상' },
    { status: 'checked_out', statusLabel: '반출 중', toneLabel: '주의' },
    { status: 'non_conforming', statusLabel: '부적합', toneLabel: '긴급' },
    { status: 'spare', statusLabel: '여분', toneLabel: '비활성' },
    { status: 'pending_disposal', statusLabel: '폐기 대기', toneLabel: '긴급' },
    { status: 'disposed', statusLabel: '폐기 완료', toneLabel: '비활성' },
    { status: 'temporary', statusLabel: '임시 등록', toneLabel: '주의' },
    { status: 'inactive', statusLabel: '비활성', toneLabel: '비활성' },
  ];

  it.each(cases)(
    'aria-label combines status + tone for status=$status',
    ({ status, statusLabel, toneLabel }) => {
      render(<StatusBadge status={status} />);
      const badge = screen.getByRole('status');
      const ariaLabel = badge.getAttribute('aria-label');
      expect(ariaLabel).toContain(statusLabel);
      expect(ariaLabel).toContain(toneLabel);
    }
  );

  it('label prop overrides status i18n while keeping tone aria-label', () => {
    render(<StatusBadge status="available" label="커스텀 라벨" />);
    const badge = screen.getByRole('status');
    expect(badge.getAttribute('aria-label')).toContain('커스텀 라벨');
    expect(badge.getAttribute('aria-label')).toContain('정상');
  });

  it('showDot=false omits the dot element (label-only)', () => {
    const { container } = render(<StatusBadge status="available" showDot={false} />);
    const dots = container.querySelectorAll('[aria-hidden="true"]');
    expect(dots.length).toBe(0);
  });

  it('is React.memo wrapped — displayName preserved (memo wrapper identity)', () => {
    expect(StatusBadge.displayName).toBe('StatusBadge');
    // React.memo identity: 컴포넌트가 memo wrapper 객체인지 검증.
    expect(typeof StatusBadge).toBe('object');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((StatusBadge as any).$$typeof).toBeDefined();
  });
});
