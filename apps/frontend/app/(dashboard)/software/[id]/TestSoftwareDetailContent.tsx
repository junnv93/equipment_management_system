'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, ToggleLeft, FileCheck, Package, Plus, Unlink } from 'lucide-react';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import testSoftwareApi, {
  type TestSoftware,
  type UpdateTestSoftwareDto,
  type LinkedEquipment,
} from '@/lib/api/software-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { UserCombobox } from '@/components/ui/user-combobox';
import { TEST_FIELD_VALUES, SITE_VALUES } from '@equipment-management/schemas';
import type { TestField, Site } from '@equipment-management/schemas';
import { getPageContainerClasses, PAGE_HEADER_TOKENS } from '@/lib/design-tokens';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { FRONTEND_ROUTES, Permission } from '@equipment-management/shared-constants';
import { useAuth } from '@/hooks/use-auth';
import { useSiteLabels } from '@/lib/i18n/use-enum-labels';
import { EquipmentCombobox } from '@/components/ui/equipment-combobox';

interface TestSoftwareDetailContentProps {
  id: string;
}

export default function TestSoftwareDetailContent({ id }: TestSoftwareDetailContentProps) {
  const t = useTranslations('software');
  const { can } = useAuth();
  const canUpdate = can(Permission.UPDATE_TEST_SOFTWARE);
  const { fmtDate } = useDateFormatter();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const siteLabels = useSiteLabels();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLinkEquipmentOpen, setIsLinkEquipmentOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | undefined>();
  const [linkNotes, setLinkNotes] = useState('');

  const { data: software, isLoading } = useQuery({
    queryKey: queryKeys.testSoftware.detail(id),
    queryFn: () => testSoftwareApi.get(id),
    ...QUERY_CONFIG.TEST_SOFTWARE_DETAIL,
  });

  // M:N 연결된 장비
  const { data: linkedEquipment = [] } = useQuery({
    queryKey: queryKeys.testSoftware.linkedEquipment(id),
    queryFn: () => testSoftwareApi.listLinkedEquipment(id),
    ...QUERY_CONFIG.HISTORY,
  });

  const invalidateLinkCaches = (equipmentId?: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.testSoftware.linkedEquipment(id) });
    if (equipmentId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testSoftware.byEquipment(equipmentId),
      });
    }
  };

  const linkEquipmentMutation = useMutation({
    mutationFn: (data: { equipmentId: string; notes?: string }) =>
      testSoftwareApi.linkEquipment(id, data),
    onSuccess: () => {
      toast({ title: t('linkedEquipment.linkSuccess') });
      setIsLinkEquipmentOpen(false);
      setSelectedEquipmentId(undefined);
      setLinkNotes('');
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: 'destructive' });
    },
    onSettled: () => invalidateLinkCaches(selectedEquipmentId),
  });

  const unlinkEquipmentMutation = useMutation({
    mutationFn: (equipmentId: string) => testSoftwareApi.unlinkEquipment(id, equipmentId),
    onSuccess: () => {
      toast({ title: t('linkedEquipment.unlinkSuccess') });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: 'destructive' });
    },
    onSettled: (_d, _e, equipmentId) => invalidateLinkCaches(equipmentId),
  });

  const handleLinkEquipment = () => {
    if (!selectedEquipmentId) return;
    linkEquipmentMutation.mutate({
      equipmentId: selectedEquipmentId,
      notes: linkNotes || undefined,
    });
  };

  const handleUnlinkEquipment = (equipmentId: string) => {
    if (!confirm(t('linkedEquipment.unlinkConfirm'))) return;
    unlinkEquipmentMutation.mutate(equipmentId);
  };

  const [editForm, setEditForm] = useState({
    name: '',
    softwareVersion: '',
    testField: '' as TestField | '',
    manufacturer: '',
    location: '',
    primaryManagerId: '',
    secondaryManagerId: '',
    installedAt: '',
    site: '' as Site | '',
  });

  const openEditDialog = () => {
    if (software) {
      setEditForm({
        name: software.name,
        softwareVersion: software.softwareVersion ?? '',
        testField: software.testField,
        manufacturer: software.manufacturer ?? '',
        location: software.location ?? '',
        primaryManagerId: software.primaryManagerId ?? '',
        secondaryManagerId: software.secondaryManagerId ?? '',
        installedAt: software.installedAt ?? '',
        site: (software.site ?? '') as Site | '',
      });
      setIsEditOpen(true);
    }
  };

  const updateMutation = useOptimisticMutation<TestSoftware, UpdateTestSoftwareDto, TestSoftware>({
    mutationFn: (data) => testSoftwareApi.update(id, data),
    queryKey: queryKeys.testSoftware.detail(id),
    optimisticUpdate: (old, data) => {
      if (!old) throw new Error('optimisticUpdate: cache miss on detail page');
      const { version: _v, ...fields } = data;
      return { ...old, ...fields };
    },
    invalidateKeys: [queryKeys.testSoftware.lists()],
    successMessage: t('toast.updateSuccess'),
    onSuccessCallback: () => setIsEditOpen(false),
  });

  const toggleMutation = useOptimisticMutation<TestSoftware, void, TestSoftware>({
    mutationFn: () => {
      const current = queryClient.getQueryData<TestSoftware>(queryKeys.testSoftware.detail(id));
      return testSoftwareApi.toggleAvailability(id, current?.version ?? 0);
    },
    queryKey: queryKeys.testSoftware.detail(id),
    optimisticUpdate: (old) => {
      if (!old) throw new Error('optimisticUpdate: cache miss on detail page');
      return {
        ...old,
        availability: old.availability === 'available' ? 'unavailable' : 'available',
      };
    },
    invalidateKeys: [queryKeys.testSoftware.lists()],
    successMessage: t('toast.toggleSuccess'),
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
      primaryManagerId: editForm.primaryManagerId || undefined,
      secondaryManagerId: editForm.secondaryManagerId || undefined,
      installedAt: editForm.installedAt || undefined,
      site: (editForm.site as Site) || undefined,
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
    { key: 'installedAt', value: software.installedAt ? fmtDate(software.installedAt) : null },
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
      <Button variant="ghost" size="sm" onClick={() => router.push(FRONTEND_ROUTES.SOFTWARE.LIST)}>
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
          {canUpdate && (
            <>
              <Button variant="outline" size="sm" onClick={() => toggleMutation.mutate()}>
                <ToggleLeft className="mr-1 h-4 w-4" />
                {t('detail.toggleAvailability')}
              </Button>
              <Button variant="outline" size="sm" onClick={openEditDialog}>
                <Edit2 className="mr-1 h-4 w-4" />
                {t('detail.editButton')}
              </Button>
            </>
          )}
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
            <div className="space-y-2">
              <Label>{t('form.primaryManagerLabel')}</Label>
              <UserCombobox
                value={editForm.primaryManagerId || undefined}
                onChange={(id) => setEditForm({ ...editForm, primaryManagerId: id ?? '' })}
                placeholder={t('form.primaryManagerPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.secondaryManagerLabel')}</Label>
              <UserCombobox
                value={editForm.secondaryManagerId || undefined}
                onChange={(id) => setEditForm({ ...editForm, secondaryManagerId: id ?? '' })}
                placeholder={t('form.secondaryManagerPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.installedAtLabel')}</Label>
              <Input
                type="date"
                value={editForm.installedAt}
                onChange={(e) => setEditForm({ ...editForm, installedAt: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.siteLabel')}</Label>
              <Select
                value={editForm.site}
                onValueChange={(v) => setEditForm({ ...editForm, site: v as Site })}
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

      {/* 연결된 장비 섹션 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-5 w-5 text-brand-info" aria-hidden="true" />
            {t('linkedEquipment.title')}
            {linkedEquipment.length > 0 && (
              <Badge variant="secondary">{linkedEquipment.length}</Badge>
            )}
          </CardTitle>
          {canUpdate && (
            <Button variant="outline" size="sm" onClick={() => setIsLinkEquipmentOpen(true)}>
              <Plus className="mr-1 h-3 w-3" />
              {t('linkedEquipment.linkButton')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {linkedEquipment.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">
                      {t('linkedEquipment.colManagementNumber')}
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">
                      {t('linkedEquipment.colName')}
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">
                      {t('linkedEquipment.colModel')}
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">
                      {t('linkedEquipment.colStatus')}
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground">
                      {t('linkedEquipment.colActions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {linkedEquipment.map((eq: LinkedEquipment) => (
                    <tr key={eq.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">
                        <Link
                          href={FRONTEND_ROUTES.EQUIPMENT.DETAIL(eq.id)}
                          className="text-brand-primary hover:underline"
                        >
                          {eq.managementNumber}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">{eq.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{eq.modelName || '-'}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline" className="text-xs">
                          {eq.status}
                        </Badge>
                      </td>
                      <td className="py-2">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnlinkEquipment(eq.id)}
                            disabled={unlinkEquipmentMutation.isPending}
                          >
                            <Unlink className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Package className="mb-2 h-8 w-8" />
              <p className="text-sm">{t('linkedEquipment.empty')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link Equipment Dialog */}
      <Dialog open={isLinkEquipmentOpen} onOpenChange={setIsLinkEquipmentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('linkedEquipment.linkDialogTitle')}</DialogTitle>
            <DialogDescription>{t('linkedEquipment.linkDialogDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <EquipmentCombobox
              value={selectedEquipmentId}
              onChange={setSelectedEquipmentId}
              excludeIds={linkedEquipment.map((eq: LinkedEquipment) => eq.id)}
            />
            <div className="space-y-2">
              <Label>{t('linkedEquipment.linkNotes')}</Label>
              <Input
                value={linkNotes}
                onChange={(e) => setLinkNotes(e.target.value)}
                placeholder={t('linkedEquipment.linkNotesPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkEquipmentOpen(false)}>
              {t('form.cancel')}
            </Button>
            <Button
              onClick={handleLinkEquipment}
              disabled={!selectedEquipmentId || linkEquipmentMutation.isPending}
            >
              {t('linkedEquipment.linkButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
