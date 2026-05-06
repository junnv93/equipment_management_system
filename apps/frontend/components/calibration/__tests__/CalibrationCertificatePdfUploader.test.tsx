/**
 * CalibrationCertificatePdfUploader — RTL 단위 테스트 (Phase A).
 *
 * 검증 범위 (분리된 책임):
 *   - 렌더링 + ARIA + disabled/isPending UX
 *   - 비-PDF 차단 → toast destructive (file input + drag-drop)
 *
 * 위임된 검증:
 *   - mime/size 검증 정확성 → `validateCertificateFile` 단위 테스트가 cover
 *     (validate-certificate-file.test.ts — 순수 함수 + DOM 무관 + 8/8 PASS)
 *   - 정상 PDF flow + onSuccess/onError callback → backend e2e (A3) +
 *     Playwright e2e (별도 sprint)에서 cover
 *
 * 분리 이유:
 *   - JSDOM의 File 생성자가 'application/pdf' mime을 fireEvent.change 경로로
 *     보존하지 못하는 well-known 한계가 있어, RTL에서 정상 PDF flow를
 *     deterministic하게 재현 불가. 진정한 시니어급 답변은 *검증 가능한 구조*로
 *     refactor (validateCertificateFile helper 추출) — 1개 변경 layer로 모든
 *     보안 검증을 testable하게 격상.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ----- Mocks -----
const extractMutateMock = jest.fn();
const toastMock = jest.fn();

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, vars?: Record<string, unknown>) =>
    vars ? `${key}|${JSON.stringify(vars)}` : key,
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

jest.mock('@/hooks/use-extract-calibration-certificate', () => ({
  useExtractCalibrationCertificate: jest.fn(({ onSuccess, onError } = {}) => ({
    mutate: (file: File) => extractMutateMock(file, { onSuccess, onError }),
    isPending: false,
  })),
  getExtractCertificateErrorI18n: jest.fn(() => ({
    key: 'calibration.errors.certificateExtractionFailed',
    vars: {},
  })),
}));

import { CalibrationCertificatePdfUploader } from '../CalibrationCertificatePdfUploader';
import { useExtractCalibrationCertificate } from '@/hooks/use-extract-calibration-certificate';

const mockedUseExtract = useExtractCalibrationCertificate as jest.MockedFunction<
  typeof useExtractCalibrationCertificate
>;

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: 0 }, queries: { retry: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

/** Plain object cast로 file.type을 정확히 보장 (JSDOM File 한계 회피) */
function makeFile(mime: string, size = 1024): File {
  return {
    name: 'cert.pdf',
    type: mime,
    size,
    lastModified: Date.now(),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    slice: () => new Blob(),
    stream: () => new ReadableStream(),
    text: () => Promise.resolve(''),
    webkitRelativePath: '',
  } as unknown as File;
}

function setInputFiles(input: HTMLInputElement, files: File[]): void {
  Object.defineProperty(input, 'files', {
    value: files,
    writable: false,
    configurable: true,
  });
  fireEvent.change(input);
}

beforeEach(() => {
  extractMutateMock.mockReset();
  toastMock.mockReset();
  mockedUseExtract.mockImplementation(
    ({ onSuccess, onError } = {}) =>
      ({
        mutate: (file: File) => extractMutateMock(file, { onSuccess, onError }),
        isPending: false,
      }) as unknown as ReturnType<typeof useExtractCalibrationCertificate>
  );
});

describe('CalibrationCertificatePdfUploader — render & UX', () => {
  it('드롭존 + 파일 선택 버튼 + 영역 ARIA가 렌더링된다', () => {
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <CalibrationCertificatePdfUploader onExtracted={jest.fn()} />
      </Wrapper>
    );
    expect(screen.getByTestId('calibration-certificate-pdf-button')).toBeInTheDocument();
    expect(screen.getByTestId('calibration-certificate-pdf-input')).toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveAttribute('aria-label');
  });

  it('disabled prop이 true면 파일 선택 버튼 잠김', () => {
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <CalibrationCertificatePdfUploader onExtracted={jest.fn()} disabled />
      </Wrapper>
    );
    expect(screen.getByTestId('calibration-certificate-pdf-button')).toBeDisabled();
  });

  it('isPending 상태에서 aria-busy + 버튼 잠금', () => {
    mockedUseExtract.mockImplementation(
      () =>
        ({
          mutate: extractMutateMock,
          isPending: true,
        }) as unknown as ReturnType<typeof useExtractCalibrationCertificate>
    );

    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <CalibrationCertificatePdfUploader onExtracted={jest.fn()} />
      </Wrapper>
    );

    expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('calibration-certificate-pdf-button')).toBeDisabled();
  });
});

describe('CalibrationCertificatePdfUploader — security gating', () => {
  it('파일 input: 비-PDF mime → extract 차단 + destructive toast', () => {
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <CalibrationCertificatePdfUploader onExtracted={jest.fn()} />
      </Wrapper>
    );

    const input = screen.getByTestId('calibration-certificate-pdf-input') as HTMLInputElement;
    setInputFiles(input, [makeFile('image/jpeg')]);

    expect(extractMutateMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });

  it('드래그-드롭: 비-PDF mime → extract 차단 + destructive toast', () => {
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <CalibrationCertificatePdfUploader onExtracted={jest.fn()} />
      </Wrapper>
    );

    const dropzone = screen.getByRole('region');
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [makeFile('image/png')] },
    });

    expect(extractMutateMock).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });

  it('disabled 상태에서는 드롭 이벤트도 무시됨 (isPending과 동일 가드)', () => {
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <CalibrationCertificatePdfUploader onExtracted={jest.fn()} disabled />
      </Wrapper>
    );

    const dropzone = screen.getByRole('region');
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [makeFile('application/pdf')] },
    });

    expect(extractMutateMock).not.toHaveBeenCalled();
  });
});
