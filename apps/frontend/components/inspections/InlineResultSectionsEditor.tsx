'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Trash2, ChevronUp, ChevronDown, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { CreateResultSectionDto } from '@/lib/api/calibration-api';
import ResultSectionFormDialog from './result-sections/ResultSectionFormDialog';
import ResultSectionPreview from './result-sections/ResultSectionPreview';
import type { ResultSection } from '@/lib/api/calibration-api';

interface InlineResultSectionsEditorProps {
  sections: CreateResultSectionDto[];
  onChange: (sections: CreateResultSectionDto[]) => void;
}

export default function InlineResultSectionsEditor({
  sections,
  onChange,
}: InlineResultSectionsEditorProps) {
  const t = useTranslations('calibration.resultSections');
  const [formOpen, setFormOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const handleAdd = (dto: CreateResultSectionDto) => {
    if (editIndex !== null) {
      const updated = [...sections];
      updated[editIndex] = dto;
      onChange(updated);
      setEditIndex(null);
    } else {
      onChange([...sections, dto]);
    }
    setFormOpen(false);
  };

  const handleRemove = (index: number) => {
    const updated = sections.filter((_, i) => i !== index);
    // Re-index sortOrder
    onChange(updated.map((s, i) => ({ ...s, sortOrder: i })));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= sections.length) return;
    const updated = [...sections];
    [updated[index], updated[swapIdx]] = [updated[swapIdx], updated[index]];
    onChange(updated.map((s, i) => ({ ...s, sortOrder: i })));
  };

  const toPreviewSection = (dto: CreateResultSectionDto, index: number): ResultSection => ({
    id: `temp-${index}`,
    inspectionId: '',
    inspectionType: 'intermediate',
    sectionType: dto.sectionType,
    sortOrder: dto.sortOrder,
    title: dto.title ?? null,
    content: dto.content ?? null,
    tableData: dto.tableData ?? null,
    richTableData: dto.richTableData ?? null,
    documentId: dto.documentId ?? null,
    imageWidthCm: dto.imageWidthCm?.toString() ?? null,
    imageHeightCm: dto.imageHeightCm?.toString() ?? null,
    createdAt: '',
    updatedAt: '',
  });

  const editTarget = editIndex !== null ? toPreviewSection(sections[editIndex], editIndex) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-muted-foreground">{t('title')}</h4>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setEditIndex(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-1 h-3 w-3" />
          {t('addSection')}
        </Button>
      </div>

      {sections.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="space-y-2">
          {sections.map((section, idx) => (
            <Card key={idx} className="relative">
              <CardContent className="p-3">
                <ResultSectionPreview section={toPreviewSection(section, idx)} />
                <div className="mt-2 flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={idx === sections.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditIndex(idx);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleRemove(idx)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ResultSectionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleAdd}
        editTarget={editTarget}
        nextSortOrder={sections.length}
        isSubmitting={false}
      />
    </div>
  );
}
