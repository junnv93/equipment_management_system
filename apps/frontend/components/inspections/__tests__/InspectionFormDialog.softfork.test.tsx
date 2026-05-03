/// <reference types="@testing-library/jest-dom" />

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import InspectionFormDialog from '../InspectionFormDialog';
import equipmentApi from '@/lib/api/equipment-api';
import calibrationApi from '@/lib/api/calibration-api';
import { isConflictError, isNotFoundError } from '@/lib/api/error';
import {
  useLatestTemplate,
  useTemplateGallery,
  useUpsertTemplate,
} from '@/hooks/use-inspection-template';
import { queryKeys } from '@/lib/api/query-config';
import type { InspectionTemplateLatestResponse } from '@/lib/api/inspection-template-api';

const mockToast = jest.fn();
const mockCan = jest.fn(() => true);
const mockMutate = jest.fn();

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ can: mockCan }),
}));

jest.mock('@/lib/api/error', () => ({
  isConflictError: jest.fn(() => false),
  isNotFoundError: jest.fn(() => false),
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
  useUpsertTemplate: jest.fn(),
  useTemplateGallery: jest.fn(),
}));

jest.mock('../SoftForkDialog', () => ({
  SoftForkDialog: (props: {
    open: boolean;
    onChoice: (choice: 'this_only' | 'apply_forward' | 'cancel') => void;
  }) =>
    props.open ? (
      <div data-testid="soft-fork-dialog">
        <button type="button" onClick={() => props.onChoice('apply_forward')}>
          apply_forward
        </button>
      </div>
    ) : null,
}));

jest.mock('../TemplateGallery', () => ({
  TemplateGallery: () => null,
}));

jest.mock('../CheckItemPresetSelect', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../InlineResultSectionsEditor', () => ({
  __esModule: true,
  default: () => null,
}));

const latestTemplate: InspectionTemplateLatestResponse = {
  id: 'tpl-current',
  equipmentId: 'equipment-1',
  inspectionType: 'intermediate',
  version: 3,
  structure: {
    items: [{ checkItem: '기존 항목', checkCriteria: '기존 기준', checkResult: '', judgment: '' }],
    resultSections: [],
    counts: { tables: 0, photos: 0, texts: 0 },
  },
  sourceInspectionId: null,
  createdBy: 'user-1',
  createdAt: '2026-05-01T00:00:00.000Z',
  createdByName: 'Template Admin',
};

function setupDialog() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries');

  render(
    <QueryClientProvider client={queryClient}>
      <InspectionFormDialog
        open={true}
        onOpenChange={jest.fn()}
        equipmentId="equipment-1"
        equipmentName="Target equipment"
      />
    </QueryClientProvider>
  );

  return { invalidateQueries };
}

function fillRequiredFieldsAndChangeTemplateStructure() {
  const dateInput = document.querySelector('input[type="date"]');
  expect(dateInput).toBeInTheDocument();
  fireEvent.change(dateInput as HTMLInputElement, { target: { value: '2026-05-03' } });

  fireEvent.change(screen.getByDisplayValue('기존 항목'), { target: { value: '변경 항목' } });
}

describe('InspectionFormDialog soft fork submit flow', () => {
  beforeEach(() => {
    mockToast.mockClear();
    mockCan.mockReturnValue(true);
    mockMutate.mockReset();
    jest.mocked(isConflictError).mockReturnValue(false);
    jest.mocked(isNotFoundError).mockReturnValue(false);
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
    jest.mocked(calibrationApi.intermediateInspections.createByEquipment).mockClear();
    jest.mocked(calibrationApi.intermediateInspections.createByEquipment).mockResolvedValue({
      id: 'inspection-1',
    } as never);
    jest.mocked(useLatestTemplate).mockReturnValue({
      data: latestTemplate,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useLatestTemplate>);
    jest.mocked(useTemplateGallery).mockReturnValue({
      data: { items: [] },
    } as unknown as ReturnType<typeof useTemplateGallery>);
    jest.mocked(useUpsertTemplate).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpsertTemplate>);
  });

  it('applies structure forward as template v+1 before creating the inspection', async () => {
    mockMutate.mockImplementation((_body, options) => options.onSuccess());
    setupDialog();

    await waitFor(() => expect(screen.getByDisplayValue('기존 항목')).toBeInTheDocument());
    fillRequiredFieldsAndChangeTemplateStructure();
    fireEvent.click(screen.getByText('intermediateInspection.save'));
    fireEvent.click(await screen.findByText('apply_forward'));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        inspectionType: 'intermediate',
        version: 4,
        supersededBy: 'tpl-current',
        forkChoice: 'apply_forward',
        structure: expect.objectContaining({
          items: [
            expect.objectContaining({
              checkItem: '변경 항목',
              checkCriteria: '기존 기준',
            }),
          ],
        }),
      }),
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
    await waitFor(() => {
      expect(calibrationApi.intermediateInspections.createByEquipment).toHaveBeenCalledWith(
        'equipment-1',
        expect.objectContaining({
          inspectionDate: '2026-05-03',
          items: [
            expect.objectContaining({
              checkItem: '변경 항목',
              checkCriteria: '기존 기준',
            }),
          ],
        })
      );
    });
  });

  it('keeps the inspection unsubmitted and invalidates latest template cache on apply_forward CAS 409', async () => {
    jest.mocked(isConflictError).mockReturnValue(true);
    mockMutate.mockImplementation((_body, options) => options.onError({ statusCode: 409 }));
    const { invalidateQueries } = setupDialog();

    await waitFor(() => expect(screen.getByDisplayValue('기존 항목')).toBeInTheDocument());
    fillRequiredFieldsAndChangeTemplateStructure();
    fireEvent.click(screen.getByText('intermediateInspection.save'));
    fireEvent.click(await screen.findByText('apply_forward'));

    expect(calibrationApi.intermediateInspections.createByEquipment).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith({
      title: 'intermediateInspection.softFork.conflict.title',
      description: 'intermediateInspection.softFork.conflict.description',
      variant: 'destructive',
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.inspectionTemplate.latest('equipment-1', 'intermediate'),
    });
  });
});
