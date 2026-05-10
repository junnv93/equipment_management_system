'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SaveViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 현재 URL search params 직렬화 문자열 */
  currentParams: string;
  onSave: (name: string, params: string) => boolean;
}

export function SaveViewDialog({ open, onOpenChange, currentParams, onSave }: SaveViewDialogProps) {
  const t = useTranslations('checkouts.savedViews.saveDialog');
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const success = onSave(trimmed, currentParams);
    if (success) {
      setName('');
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setName('');
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="save-view-desc">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription id="save-view-desc">{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="save-view-name">{t('nameLabel')}</Label>
          <Input
            id="save-view-name"
            ref={inputRef}
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('namePlaceholder')}
            maxLength={50}
            aria-required="true"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
