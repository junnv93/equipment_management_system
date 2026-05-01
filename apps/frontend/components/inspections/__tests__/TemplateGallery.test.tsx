/// <reference types="@testing-library/jest-dom" />
/**
 * TemplateGallery — Phase 1B-F 단위 검증
 *
 * 시나리오:
 * 1. open=true면 dialog 렌더 + blank 카드 + 매칭 카드 표시
 * 2. blank 카드 클릭 → onSelect(null)
 * 3. 매칭 카드 클릭 → onSelect(entry)
 * 4. skipNextTime 체크 후 선택 → markGallerySkipped 호출
 * 5. items=[] → empty 메시지 표시
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateGallery } from '../TemplateGallery';
import type { InspectionTemplateGalleryEntry } from '@/lib/api/inspection-template-api';

const mockMarkSkipped = jest.fn();

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params && Object.keys(params).length > 0) {
      const paramStr = Object.entries(params)
        .map(([k, v]) => `${k}=${v}`)
        .join(',');
      return `${key}:${paramStr}`;
    }
    return key;
  },
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

jest.mock('@/lib/design-tokens', () => ({
  INSPECTION_TEMPLATE_GALLERY_CARD_TOKENS: {
    grid: 'grid',
    card: 'card',
    blankCard: 'blankCard',
    cardTitle: 'cardTitle',
    matchReasonChip: 'chip',
    cardMeta: 'cardMeta',
    skipCheckboxRow: 'skipCheckboxRow',
  },
}));

jest.mock('@/lib/inspection/template-gallery-skip', () => ({
  markGallerySkipped: (...args: unknown[]) => mockMarkSkipped(...args),
}));

jest.mock('@/lib/analytics/track', () => ({
  track: jest.fn(),
}));

const mockEntry: InspectionTemplateGalleryEntry = {
  template: {
    id: 'tpl-1',
    equipmentId: 'eq-1',
    inspectionType: 'intermediate',
    version: 3,
    structure: {
      items: [],
      resultSections: [],
      counts: { tables: 0, photos: 0, texts: 0 },
    },
    createdAt: '2026-04-15T10:00:00.000Z',
  },
  matchReason: 'modelName',
  modelName: 'Multimeter X',
  equipmentName: '디지털 멀티미터 #2',
};

beforeEach(() => {
  mockMarkSkipped.mockClear();
});

describe('TemplateGallery', () => {
  it('renders blank card and matched cards when open', () => {
    render(
      <TemplateGallery
        open={true}
        onOpenChange={jest.fn()}
        items={[mockEntry]}
        onSelect={jest.fn()}
        equipmentTypeId="type-1"
        inspectionType="intermediate"
      />
    );
    expect(screen.getByText('intermediateInspection.gallery.blankCard.title')).toBeInTheDocument();
    expect(screen.getByText('디지털 멀티미터 #2')).toBeInTheDocument();
  });

  it('calls onSelect(null) when blank card clicked', () => {
    const onSelect = jest.fn();
    const onOpenChange = jest.fn();
    render(
      <TemplateGallery
        open={true}
        onOpenChange={onOpenChange}
        items={[mockEntry]}
        onSelect={onSelect}
        equipmentTypeId="type-1"
        inspectionType="intermediate"
      />
    );
    fireEvent.click(screen.getByLabelText('intermediateInspection.gallery.blankAriaLabel'));
    expect(onSelect).toHaveBeenCalledWith(null);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onSelect(entry) when matched card clicked', () => {
    const onSelect = jest.fn();
    render(
      <TemplateGallery
        open={true}
        onOpenChange={jest.fn()}
        items={[mockEntry]}
        onSelect={onSelect}
        equipmentTypeId="type-1"
        inspectionType="intermediate"
      />
    );
    // cardAriaLabel 포함 button 클릭
    const card = screen.getByLabelText(/cardAriaLabel/);
    fireEvent.click(card);
    expect(onSelect).toHaveBeenCalledWith(mockEntry);
  });

  it('shows empty message when items=[]', () => {
    render(
      <TemplateGallery
        open={true}
        onOpenChange={jest.fn()}
        items={[]}
        onSelect={jest.fn()}
        equipmentTypeId="type-1"
        inspectionType="intermediate"
      />
    );
    expect(screen.getByText('intermediateInspection.gallery.empty')).toBeInTheDocument();
  });

  it('calls markGallerySkipped when skipNextTime checked then closed', () => {
    const onSelect = jest.fn();
    render(
      <TemplateGallery
        open={true}
        onOpenChange={jest.fn()}
        items={[mockEntry]}
        onSelect={onSelect}
        equipmentTypeId="type-1"
        inspectionType="intermediate"
      />
    );
    fireEvent.click(screen.getByLabelText('intermediateInspection.gallery.skipNextTime'));
    fireEvent.click(screen.getByLabelText('intermediateInspection.gallery.cancelAriaLabel'));
    expect(mockMarkSkipped).toHaveBeenCalledWith('type-1', 'intermediate');
  });
});
