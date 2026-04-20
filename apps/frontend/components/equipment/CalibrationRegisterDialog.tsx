'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CalibrationForm } from '@/components/calibration/CalibrationForm';
import type { Calibration } from '@/lib/api/calibration-api';

interface CalibrationRegisterDialogProps {
  equipmentId: string;
}

export function CalibrationRegisterDialog({ equipmentId }: CalibrationRegisterDialogProps) {
  const t = useTranslations('equipment');
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = (_calibration: Calibration) => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {t('calibrationHistoryTab.register')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('calibrationHistoryTab.dialog.title')}</DialogTitle>
          <DialogDescription>{t('calibrationHistoryTab.dialog.description')}</DialogDescription>
        </DialogHeader>
        <CalibrationForm
          mode="dialog"
          equipmentId={equipmentId}
          onSuccess={handleSuccess}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
