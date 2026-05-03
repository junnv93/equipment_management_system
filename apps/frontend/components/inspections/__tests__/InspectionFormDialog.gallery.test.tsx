/// <reference types="@testing-library/jest-dom" />

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import InspectionFormDialog from '../InspectionFormDialog';
import equipmentApi from '@/lib/api/equipment-api';
import { useLatestTemplate, useTemplateGallery } from '@/hooks/use-inspection-template';
import type { InspectionTemplateGalleryEntry } from '@/lib/api/inspection-template-api';

const mockTemplateGalleryProps: Array<{ open: boolean; items: InspectionTemplateGalleryEntry[] }> =
  [];

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ can: jest.fn(() => false) }),
}));

jest.mock('@/hooks/use-date-formatter', () => ({
  useDateFormatter: () => ({
    fmtDate: (date: string | Date | undefined | null) => (date ? String(date).slice(0, 10) : ''),
  }),
}));

jest.mock('@/lib/api/error', () => ({
  isConflictError: jest.fn(() => false),
  isNotFoundError: jest.fn(() => true),
}));

jest.mock('@/lib/errors/equipment-errors', () => ({
  EquipmentErrorCode: {
    VERSION_CONFLICT: 'VERSION_CONFLICT',
  },
  getLocalizedErrorInfo: jest.fn(() => ({ title: 'error', message: 'error' })),
}));

jest.mock('@/lib/feature-flags', () => ({
  getFeatureFlag: jest.fn(() => true),
}));

jest.mock('@/lib/inspection/template-gallery-skip', () => ({
  isGallerySkipped: jest.fn(() => false),
}));

jest.mock('@/lib/analytics/track', () => ({
  track: jest.fn(),
}));

jest.mock('@/lib/api/equipment-api', () => ({
  __esModule: true,
  default: {
    getEquipment: jest.fn(),
  },
}));

jest.mock('@/lib/api/calibration-api', () => ({
  __esModule: true,
  default: {
    intermediateInspections: {
      create: jest.fn(),
      createByEquipment: jest.fn(),
    },
  },
}));

jest.mock('@/components/form-templates/FormNumberBadge', () => ({
  FormNumberBadge: () => null,
}));

jest.mock('@/components/ui/equipment-combobox', () => ({
  EquipmentCombobox: () => null,
}));

jest.mock('@/hooks/use-inspection-template', () => ({
  useLatestTemplate: jest.fn(),
  useUpsertTemplate: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
  useTemplateGallery: jest.fn(),
}));

jest.mock('../TemplateGallery', () => ({
  TemplateGallery: (props: { open: boolean; items: InspectionTemplateGalleryEntry[] }) => {
    mockTemplateGalleryProps.push(props);
    return <div data-testid="template-gallery" data-open={String(props.open)} />;
  },
}));

jest.mock('../CheckItemPresetSelect', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../InlineResultSectionsEditor', () => ({
  __esModule: true,
  default: () => null,
}));

const galleryEntry: InspectionTemplateGalleryEntry = {
  template: {
    id: 'tpl-1',
    equipmentId: 'source-equipment',
    inspectionType: 'intermediate',
    version: 1,
    structure: {
      items: [],
      resultSections: [],
      counts: { tables: 0, photos: 0, texts: 0 },
    },
    createdAt: '2026-05-01T00:00:00.000Z',
  },
  matchReason: 'modelName',
  modelName: 'MX-100',
  equipmentName: 'Source equipment',
};

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <InspectionFormDialog
        open={true}
        onOpenChange={jest.fn()}
        equipmentId="equipment-1"
        equipmentName="Target equipment"
      />
    </QueryClientProvider>
  );
}

describe('InspectionFormDialog template gallery auto show', () => {
  beforeEach(() => {
    mockTemplateGalleryProps.length = 0;
    jest.mocked(equipmentApi.getEquipment).mockResolvedValue({
      id: 'equipment-1',
      equipmentName: 'Target equipment',
      equipmentType: 'type-1',
      modelName: 'MX-100',
      classificationCode: 'CLS-1',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
      version: 1,
    } as unknown as Awaited<ReturnType<typeof equipmentApi.getEquipment>>);
    jest.mocked(useLatestTemplate).mockReturnValue({
      data: undefined,
      isError: true,
      error: { status: 404 },
    } as unknown as ReturnType<typeof useLatestTemplate>);
    jest.mocked(useTemplateGallery).mockReturnValue({
      data: { items: [galleryEntry] },
    } as ReturnType<typeof useTemplateGallery>);
  });

  it('opens TemplateGallery when first-inspection gallery matches are available', async () => {
    renderDialog();

    await waitFor(() => {
      expect(mockTemplateGalleryProps.some((props) => props.open === true)).toBe(true);
    });
    expect(mockTemplateGalleryProps.at(-1)?.items).toEqual([galleryEntry]);
  });
});
