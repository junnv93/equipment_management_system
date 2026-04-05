'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import cablesApi, { type CreateCableDto } from '@/lib/api/cables-api';
import { queryKeys } from '@/lib/api/query-config';
import { SITE_VALUES } from '@equipment-management/schemas';
import type { Site } from '@equipment-management/schemas';
import { getPageContainerClasses, PAGE_HEADER_TOKENS } from '@/lib/design-tokens';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { useSiteLabels } from '@/lib/i18n/use-enum-labels';

const CONNECTOR_TYPES = ['K', 'SMA', 'N', 'other'] as const;

export default function CreateCableContent() {
  const t = useTranslations('cables');
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const siteLabels = useSiteLabels();

  const [form, setForm] = useState({
    length: '',
    connectorType: '',
    frequencyRangeMin: '',
    frequencyRangeMax: '',
    serialNumber: '',
    location: '',
    site: '' as Site | '',
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCableDto) => cablesApi.create(data),
    onSuccess: (created) => {
      toast({ title: t('create.success') });
      router.push(FRONTEND_ROUTES.CABLES.DETAIL(created.id));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cables.lists() });
    },
    onError: (error: Error) => {
      toast({ title: t('create.error'), description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = () => {
    const dto: CreateCableDto = {
      ...(form.length ? { length: form.length } : {}),
      ...(form.connectorType ? { connectorType: form.connectorType } : {}),
      ...(form.frequencyRangeMin ? { frequencyRangeMin: Number(form.frequencyRangeMin) } : {}),
      ...(form.frequencyRangeMax ? { frequencyRangeMax: Number(form.frequencyRangeMax) } : {}),
      ...(form.serialNumber ? { serialNumber: form.serialNumber } : {}),
      ...(form.location ? { location: form.location } : {}),
      ...(form.site ? { site: form.site } : {}),
    };
    createMutation.mutate(dto);
  };

  return (
    <div className={getPageContainerClasses('detail')}>
      <Button variant="ghost" size="sm" onClick={() => router.push(FRONTEND_ROUTES.CABLES.LIST)}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        {t('list.title')}
      </Button>

      <div>
        <h1 className={PAGE_HEADER_TOKENS.title}>{t('create.title')}</h1>
        <p className={PAGE_HEADER_TOKENS.subtitle}>{t('create.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('create.formTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('form.lengthLabel')}</Label>
              <Input
                value={form.length}
                onChange={(e) => setForm({ ...form, length: e.target.value })}
                placeholder={t('form.lengthPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.connectorTypeLabel')}</Label>
              <Select
                value={form.connectorType}
                onValueChange={(v) => setForm({ ...form, connectorType: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.connectorTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {CONNECTOR_TYPES.map((ct) => (
                    <SelectItem key={ct} value={ct}>
                      {t(`connectorType.${ct}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('form.frequencyRangeMinLabel')}</Label>
              <Input
                type="number"
                value={form.frequencyRangeMin}
                onChange={(e) => setForm({ ...form, frequencyRangeMin: e.target.value })}
                placeholder={t('form.frequencyRangeMinPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.frequencyRangeMaxLabel')}</Label>
              <Input
                type="number"
                value={form.frequencyRangeMax}
                onChange={(e) => setForm({ ...form, frequencyRangeMax: e.target.value })}
                placeholder={t('form.frequencyRangeMaxPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.serialNumberLabel')}</Label>
              <Input
                value={form.serialNumber}
                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                placeholder={t('form.serialNumberPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.locationLabel')}</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder={t('form.locationPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.siteLabel')}</Label>
              <Select
                value={form.site}
                onValueChange={(v) => setForm({ ...form, site: v as Site })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.sitePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {SITE_VALUES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {siteLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => router.push(FRONTEND_ROUTES.CABLES.LIST)}>
              {t('form.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? t('create.submitting') : t('create.submitButton')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
