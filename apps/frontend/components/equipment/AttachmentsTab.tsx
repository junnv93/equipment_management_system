'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Paperclip } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Equipment } from '@/lib/api/equipment-api';
import { TIMELINE_TOKENS } from '@/lib/design-tokens';

interface AttachmentsTabProps {
  equipment: Equipment;
}

export function AttachmentsTab({ equipment: _equipment }: AttachmentsTabProps) {
  const t = useTranslations('equipment');
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-brand-info" />
          {t('attachmentsTab.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={TIMELINE_TOKENS.empty.container}>
          <Paperclip className={TIMELINE_TOKENS.empty.icon} />
          <p className={TIMELINE_TOKENS.empty.text}>{t('attachmentsTab.empty')}</p>
        </div>
      </CardContent>
    </Card>
  );
}
