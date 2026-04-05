'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import testSoftwareApi, { type CreateTestSoftwareDto } from '@/lib/api/software-api';
import { queryKeys } from '@/lib/api/query-config';
import { apiClient } from '@/lib/api/api-client';
import { TEST_FIELD_VALUES, SITE_VALUES } from '@equipment-management/schemas';
import type { TestField, Site } from '@equipment-management/schemas';
import { getPageContainerClasses, PAGE_HEADER_TOKENS } from '@/lib/design-tokens';
import { FRONTEND_ROUTES, API_ENDPOINTS } from '@equipment-management/shared-constants';
import { useSiteLabels } from '@/lib/i18n/use-enum-labels';

export default function CreateTestSoftwareContent() {
  const t = useTranslations('software');
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const siteLabels = useSiteLabels();

  const { data: usersData } = useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: () =>
      apiClient.get(API_ENDPOINTS.USERS.LIST).then((r) => r.data as { id: string; name: string }[]),
  });

  const [form, setForm] = useState({
    name: '',
    softwareVersion: '',
    testField: '' as TestField | '',
    manufacturer: '',
    location: '',
    requiresValidation: true,
    primaryManagerId: '',
    secondaryManagerId: '',
    installedAt: '',
    site: '' as Site | '',
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateTestSoftwareDto) => testSoftwareApi.create(data),
    onSuccess: (created) => {
      toast({ title: t('toast.createSuccess') });
      router.push(FRONTEND_ROUTES.SOFTWARE.DETAIL(created.id));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.testSoftware.lists() });
    },
    onError: (error: Error) => {
      toast({ title: t('toast.error'), description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = () => {
    if (!form.name || !form.testField) return;
    const dto: CreateTestSoftwareDto = {
      name: form.name,
      testField: form.testField as TestField,
      ...(form.softwareVersion ? { softwareVersion: form.softwareVersion } : {}),
      ...(form.manufacturer ? { manufacturer: form.manufacturer } : {}),
      ...(form.location ? { location: form.location } : {}),
      ...(form.primaryManagerId ? { primaryManagerId: form.primaryManagerId } : {}),
      ...(form.secondaryManagerId ? { secondaryManagerId: form.secondaryManagerId } : {}),
      ...(form.installedAt ? { installedAt: form.installedAt } : {}),
      ...(form.site ? { site: form.site } : {}),
      requiresValidation: form.requiresValidation,
    };
    createMutation.mutate(dto);
  };

  return (
    <div className={getPageContainerClasses('detail')}>
      <Button variant="ghost" size="sm" onClick={() => router.push(FRONTEND_ROUTES.SOFTWARE.LIST)}>
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
              <Label>{t('form.nameLabel')}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('form.namePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.versionLabel')}</Label>
              <Input
                value={form.softwareVersion}
                onChange={(e) => setForm({ ...form, softwareVersion: e.target.value })}
                placeholder={t('form.versionPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.testFieldLabel')}</Label>
              <Select
                value={form.testField}
                onValueChange={(v) => setForm({ ...form, testField: v as TestField })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.testFieldPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {TEST_FIELD_VALUES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {t(`testField.${f}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('form.manufacturerLabel')}</Label>
              <Input
                value={form.manufacturer}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                placeholder={t('form.manufacturerPlaceholder')}
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
              <Label>{t('form.primaryManagerLabel')}</Label>
              <Select
                value={form.primaryManagerId}
                onValueChange={(v) => setForm({ ...form, primaryManagerId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.primaryManagerPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {(usersData ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('form.secondaryManagerLabel')}</Label>
              <Select
                value={form.secondaryManagerId}
                onValueChange={(v) => setForm({ ...form, secondaryManagerId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.secondaryManagerPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {(usersData ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('form.installedAtLabel')}</Label>
              <Input
                type="date"
                value={form.installedAt}
                onChange={(e) => setForm({ ...form, installedAt: e.target.value })}
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
            <div className="flex items-center gap-3 pt-6">
              <Switch
                checked={form.requiresValidation}
                onCheckedChange={(checked) => setForm({ ...form, requiresValidation: checked })}
              />
              <Label>{t('create.requiresValidationLabel')}</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => router.push(FRONTEND_ROUTES.SOFTWARE.LIST)}>
              {t('form.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name || !form.testField || createMutation.isPending}
            >
              {createMutation.isPending ? t('form.submitting') : t('create.submitButton')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
