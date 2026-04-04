'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, ToggleLeft, FileCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import testSoftwareApi, { type UpdateTestSoftwareDto } from '@/lib/api/software-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { TEST_FIELD_VALUES } from '@equipment-management/schemas';
import type { TestField } from '@equipment-management/schemas';
import { getPageContainerClasses, PAGE_HEADER_TOKENS } from '@/lib/design-tokens';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';

interface TestSoftwareDetailContentProps {
  id: string;
}

export default function TestSoftwareDetailContent({ id }: TestSoftwareDetailContentProps) {
  const t = useTranslations('software');
  const { fmtDate } = useDateFormatter();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: software, isLoading } = useQuery({
    queryKey: queryKeys.testSoftware.detail(id),
    queryFn: () => testSoftwareApi.get(id),
    ...QUERY_CONFIG.TEST_SOFTWARE_LIST,
  });

  const [editForm, setEditForm] = useState({
    name: '',
    softwareVersion: '',
    testField: '' as TestField | '',
    manufacturer: '',
    location: '',
  });

  const openEditDialog = () => {
    if (software) {
      setEditForm({
        name: software.name,
        softwareVersion: software.softwareVersion ?? '',
        testField: software.testField,
        manufacturer: software.manufacturer ?? '',
        location: software.location ?? '',
      });
      setIsEditOpen(true);
    }
  };

  const updateMutation = useMutation({
    mutationFn: (data: UpdateTestSoftwareDto) => testSoftwareApi.update(id, data),
    onSuccess: () => {
      toast({ title: t('toast.updateSuccess') });
      setIsEditOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: t('toast.error'), description: error.message, variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.testSoftware.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.testSoftware.lists() });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: () => testSoftwareApi.toggleAvailability(id, software?.version ?? 0),
    onSuccess: () => {
      toast({ title: t('toast.toggleSuccess') });
    },
    onError: (error: Error) => {
      toast({ title: t('toast.error'), description: error.message, variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.testSoftware.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.testSoftware.lists() });
    },
  });

  const handleEditSubmit = () => {
    if (!software) return;
    const dto: UpdateTestSoftwareDto = {
      version: software.version,
      name: editForm.name,
      softwareVersion: editForm.softwareVersion || undefined,
      testField: (editForm.testField as TestField) || undefined,
      manufacturer: editForm.manufacturer || undefined,
      location: editForm.location || undefined,
    };
    updateMutation.mutate(dto);
  };

  if (isLoading) {
    return (
      <div className={getPageContainerClasses('detail')}>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!software) {
    return (
      <div className={getPageContainerClasses('centered')}>
        <p className="text-muted-foreground">{t('detail.notFound')}</p>
      </div>
    );
  }

  const fields: { key: string; value: string | null | undefined }[] = [
    { key: 'managementNumber', value: software.managementNumber },
    { key: 'name', value: software.name },
    { key: 'version', value: software.softwareVersion },
    { key: 'testField', value: t(`testField.${software.testField}`) },
    { key: 'primaryManager', value: software.primaryManagerName },
    { key: 'secondaryManager', value: software.secondaryManagerName },
    { key: 'installedAt', value: software.installedAt },
    { key: 'manufacturer', value: software.manufacturer },
    { key: 'location', value: software.location },
    {
      key: 'requiresValidation',
      value: software.requiresValidation
        ? t('detail.requiresValidationYes')
        : t('detail.requiresValidationNo'),
    },
    { key: 'site', value: software.site },
    { key: 'createdAt', value: software.createdAt ? fmtDate(software.createdAt) : null },
    { key: 'updatedAt', value: software.updatedAt ? fmtDate(software.updatedAt) : null },
  ];

  return (
    <div className={getPageContainerClasses('detail')}>
      {/* Nav */}
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        {t('list.title')}
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={PAGE_HEADER_TOKENS.title}>{software.name}</h1>
          <p className={PAGE_HEADER_TOKENS.subtitle}>{software.managementNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={software.availability === 'available' ? 'default' : 'secondary'}>
            {t(`availability.${software.availability}`)}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => toggleMutation.mutate()}>
            <ToggleLeft className="mr-1 h-4 w-4" />
            {t('detail.toggleAvailability')}
          </Button>
          <Button variant="outline" size="sm" onClick={openEditDialog}>
            <Edit2 className="mr-1 h-4 w-4" />
            {t('detail.editButton')}
          </Button>
          <Link href={FRONTEND_ROUTES.SOFTWARE.VALIDATION(id)}>
            <Button size="sm">
              <FileCheck className="mr-1 h-4 w-4" />
              {t('detail.validationLink')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Detail Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('detail.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map(({ key, value }) => (
              <div key={key}>
                <dt className="text-sm font-medium text-muted-foreground">
                  {t(`detail.fields.${key}` as Parameters<typeof t>[0])}
                </dt>
                <dd className="mt-1 text-sm">{value || t('detail.notSpecified')}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('form.editTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('form.nameLabel')}</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder={t('form.namePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.versionLabel')}</Label>
              <Input
                value={editForm.softwareVersion}
                onChange={(e) => setEditForm({ ...editForm, softwareVersion: e.target.value })}
                placeholder={t('form.versionPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.testFieldLabel')}</Label>
              <Select
                value={editForm.testField}
                onValueChange={(v) => setEditForm({ ...editForm, testField: v as TestField })}
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
                value={editForm.manufacturer}
                onChange={(e) => setEditForm({ ...editForm, manufacturer: e.target.value })}
                placeholder={t('form.manufacturerPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.locationLabel')}</Label>
              <Input
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                placeholder={t('form.locationPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              {t('form.cancel')}
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? t('form.submitting') : t('form.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
