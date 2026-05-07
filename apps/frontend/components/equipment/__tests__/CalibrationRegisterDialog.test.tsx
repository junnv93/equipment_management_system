/**
 * CalibrationRegisterDialog — RTL 단위 테스트.
 *
 * 검증 범위:
 *   - managementNumber mismatch 시 destructive toast + state 미보존
 *   - dialog close → 재open 시 form state reset (extractedCertificate / extractedFile)
 *
 * 위임된 검증:
 *   - PDF 추출 정상 flow → backend e2e + Playwright (별도 sprint)
 *   - CalibrationForm submit 동작 → CalibrationForm 자체 spec
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ExtractedCalibrationCertificate } from '@equipment-management/schemas';

// ----- Mocks -----
const toastMock = jest.fn();

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, vars?: Record<string, unknown>) =>
    vars ? `${key}|${JSON.stringify(vars)}` : key,
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

let onExtractedRef: ((cert: ExtractedCalibrationCertificate, file: File) => void) | null = null;
jest.mock('@/components/calibration/CalibrationCertificatePdfUploader', () => ({
  CalibrationCertificatePdfUploader: ({
    onExtracted,
  }: {
    onExtracted: (cert: ExtractedCalibrationCertificate, file: File) => void;
  }) => {
    onExtractedRef = onExtracted;
    return React.createElement('div', { 'data-testid': 'pdf-uploader-mock' }, 'PdfUploaderMock');
  },
}));

jest.mock('@/components/calibration/CalibrationForm', () => ({
  CalibrationForm: ({ defaultValues }: { defaultValues?: Record<string, unknown> }) =>
    React.createElement(
      'div',
      { 'data-testid': 'calibration-form-mock' },
      `CalibrationFormMock|defaults=${defaultValues ? JSON.stringify(defaultValues.certificateNumber ?? null) : 'none'}`
    ),
}));

jest.mock('@/lib/calibration/extracted-to-form-defaults', () => ({
  extractedToFormDefaults: (cert: ExtractedCalibrationCertificate) => ({
    certificateNumber: cert.certificateNumber,
  }),
}));

import { CalibrationRegisterDialog } from '../CalibrationRegisterDialog';

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: 0 }, queries: { retry: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

const validCert: ExtractedCalibrationCertificate = {
  managementNumber: 'EQ-001',
  certificateNumber: 'CERT-2026-001',
  revisionNumber: 1,
  parentCertificateNumber: null,
  calibrationDate: '2026-05-01',
  nextCalibrationDate: '2027-05-01',
  agencyName: 'HCT',
};

const mismatchCert: ExtractedCalibrationCertificate = {
  ...validCert,
  managementNumber: 'EQ-002',
};

beforeEach(() => {
  toastMock.mockReset();
  onExtractedRef = null;
});

describe('CalibrationRegisterDialog — managementNumber mismatch', () => {
  it('PDF 추출 결과의 managementNumber가 prop과 다르면 destructive toast 발화', () => {
    render(
      React.createElement(CalibrationRegisterDialog, {
        equipmentId: 'eq-uuid-001',
        managementNumber: 'EQ-001',
      }),
      { wrapper: makeWrapper() }
    );

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(onExtractedRef).not.toBeNull();
    onExtractedRef?.(mismatchCert, new File(['x'], 'cert.pdf', { type: 'application/pdf' }));

    expect(toastMock).toHaveBeenCalledTimes(1);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
        description: expect.stringContaining('certificateUpload.noEquipmentMatch'),
      })
    );
  });

  it('mismatch 시 form defaults 사전 채움 안 됨 (state 미보존)', () => {
    render(
      React.createElement(CalibrationRegisterDialog, {
        equipmentId: 'eq-uuid-001',
        managementNumber: 'EQ-001',
      }),
      { wrapper: makeWrapper() }
    );

    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    onExtractedRef?.(mismatchCert, new File(['x'], 'cert.pdf', { type: 'application/pdf' }));

    expect(screen.getByTestId('calibration-form-mock')).toHaveTextContent('defaults=none');
  });

  it('managementNumber 일치 시 destructive toast 미발화 + form defaults 사전 채움', () => {
    render(
      React.createElement(CalibrationRegisterDialog, {
        equipmentId: 'eq-uuid-001',
        managementNumber: 'EQ-001',
      }),
      { wrapper: makeWrapper() }
    );

    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    act(() => {
      onExtractedRef?.(validCert, new File(['x'], 'cert.pdf', { type: 'application/pdf' }));
    });

    const destructiveCalls = toastMock.mock.calls.filter(
      ([arg]) => (arg as { variant?: string })?.variant === 'destructive'
    );
    expect(destructiveCalls).toHaveLength(0);
    expect(screen.getByTestId('calibration-form-mock')).toHaveTextContent('CERT-2026-001');
  });
});

describe('CalibrationRegisterDialog — close → re-open form state reset', () => {
  it('정상 추출 후 dialog close → 재open 시 form defaults 미보존 (reset)', () => {
    render(
      React.createElement(CalibrationRegisterDialog, {
        equipmentId: 'eq-uuid-001',
        managementNumber: 'EQ-001',
      }),
      { wrapper: makeWrapper() }
    );

    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    act(() => {
      onExtractedRef?.(validCert, new File(['x'], 'cert.pdf', { type: 'application/pdf' }));
    });
    expect(screen.getByTestId('calibration-form-mock')).toHaveTextContent('CERT-2026-001');

    // ESC로 dialog close (Radix Dialog onOpenChange 트리거)
    act(() => {
      fireEvent.keyDown(document.body, { key: 'Escape' });
    });

    // 재open
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /register/i }));
    });

    // form defaults reset 확인 — 이전 certificateNumber 미보존
    expect(screen.getByTestId('calibration-form-mock')).toHaveTextContent('defaults=none');
  });
});
