'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Code } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Equipment } from '@/lib/api/equipment-api';
import { TIMELINE_TOKENS } from '@/lib/design-tokens';

interface SoftwareTabProps {
  equipment: Equipment;
}

export function SoftwareTab({ equipment }: SoftwareTabProps) {
  const t = useTranslations('equipment');
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5 text-brand-info" />
          {t('softwareTab.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {equipment.firmwareVersion ? (
          <div className="space-y-4">
            {equipment.firmwareVersion && (
              <div>
                <p className="text-sm text-muted-foreground">{t('softwareTab.firmwareVersion')}</p>
                <p className="font-medium">{equipment.firmwareVersion}</p>
              </div>
            )}
          </div>
        ) : (
          <div className={TIMELINE_TOKENS.empty.container}>
            <Code className={TIMELINE_TOKENS.empty.icon} />
            <p className={TIMELINE_TOKENS.empty.text}>{t('softwareTab.empty')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
