'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2 } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import cablesApi, { type UpdateCableDto, type CableMeasurement } from '@/lib/api/cables-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { isConflictError } from '@/lib/api/error';
import { getPageContainerClasses, PAGE_HEADER_TOKENS } from '@/lib/design-tokens';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { SITE_VALUES, CABLE_CONNECTOR_TYPE_VALUES } from '@equipment-management/schemas';
import type { Site } from '@equipment-management/schemas';
import { useSiteLabels } from '@/lib/i18n/use-enum-labels';
import { MeasurementFormDialog } from '@/components/cables/MeasurementFormDialog';
import { useAuth } from '@/hooks/use-auth';
import { Permission } from '@equipment-management/shared-constants';

interface CableDetailContentProps {
  id: string;
}

export default function CableDetailContent({ id }: CableDetailContentProps) {
  const t = useTranslations('cables');
  const { can } = useAuth();
  const canUpdate = can(Permission.UPDATE_CALIBRATION);
  const { fmtDate } = useDateFormatter();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const siteLabels = useSiteLabels();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMeasurementOpen, setIsMeasurementOpen] = useState(false);

  const { data: cable, isLoading } = useQuery({
    queryKey: queryKeys.cables.detail(id),
    queryFn: () => cablesApi.get(id),
    ...QUERY_CONFIG.CABLES_DETAIL,
  });

  const { data: measurements = [] } = useQuery({
    queryKey: queryKeys.cables.measurements(id),
    queryFn: () => cablesApi.getMeasurements(id),
    ...QUERY_CONFIG.CABLES_DETAIL,
  });

  const [editForm, setEditForm] = useState({
    length: '',
    connectorType: '' as string,
    frequencyRangeMin: '',
    frequencyRangeMax: '',
    serialNumber: '',
    location: '',
    site: '' as Site | '',
  });

  const openEditDialog = () => {
    if (cable) {
      setEditForm({
        length: cable.length ?? '',
        connectorType: cable.connectorType ?? '',
        frequencyRangeMin: cable.frequencyRangeMin != null ? String(cable.frequencyRangeMin) : '',
        frequencyRangeMax: cable.frequencyRangeMax != null ? String(cable.frequencyRangeMax) : '',
        serialNumber: cable.serialNumber ?? '',
        location: cable.location ?? '',
        site: (cable.site ?? '') as Site | '',
      });
      setIsEditOpen(true);
    }
  };

  const handleMutationError = (error: Error) => {
    if (isConflictError(error)) {
      toast({
        title: t('toast.versionConflict'),
        description: t('toast.versionConflictDesc'),
        variant: 'destructive',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.cables.detail(id) });
    } else {
      toast({ title: t('toast.error'), description: error.message, variant: 'destructive' });
    }
  };

  const updateMutation = useMutation({
    mutationFn: (data: UpdateCableDto) => cablesApi.update(id, data),
    onSuccess: () => {
      toast({ title: t('toast.updateSuccess') });
      setIsEditOpen(false);
    },
    onError: handleMutationError,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cables.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cables.lists() });
    },
  });

  const handleEditSubmit = () => {
    if (!cable) return;
    const dto: UpdateCableDto = {
      version: cable.version,
      length: editForm.length || undefined,
      connectorType: editForm.connectorType || undefined,
      frequencyRangeMin: editForm.frequencyRangeMin
        ? Number(editForm.frequencyRangeMin)
        : undefined,
      frequencyRangeMax: editForm.frequencyRangeMax
        ? Number(editForm.frequencyRangeMax)
        : undefined,
      serialNumber: editForm.serialNumber || undefined,
      location: editForm.location || undefined,
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

  if (!cable) {
    return (
      <div className={getPageContainerClasses('centered')}>
        <p className="text-muted-foreground">{t('detail.notFound')}</p>
      </div>
    );
  }

  const freqRange =
    cable.frequencyRangeMin != null && cable.frequencyRangeMax != null
      ? `${cable.frequencyRangeMin} - ${cable.frequencyRangeMax}`
      : cable.frequencyRangeMin != null
        ? `${cable.frequencyRangeMin}+`
        : cable.frequencyRangeMax != null
          ? `- ${cable.frequencyRangeMax}`
          : null;

  const fields: { key: string; value: string | null | undefined }[] = [
    { key: 'managementNumber', value: cable.managementNumber },
    { key: 'length', value: cable.length },
    { key: 'connectorType', value: cable.connectorType },
    { key: 'frequencyRange', value: freqRange },
    { key: 'serialNumber', value: cable.serialNumber },
    { key: 'location', value: cable.location },
    { key: 'site', value: cable.site },
    { key: 'status', value: t(`status.${cable.status}` as Parameters<typeof t>[0]) },
    {
      key: 'lastMeasurementDate',
      value: cable.lastMeasurementDate ? fmtDate(cable.lastMeasurementDate) : null,
    },
    { key: 'createdAt', value: cable.createdAt ? fmtDate(cable.createdAt) : null },
    { key: 'updatedAt', value: cable.updatedAt ? fmtDate(cable.updatedAt) : null },
  ];

  // Find latest measurement with data points
  const latestMeasurement: CableMeasurement | undefined =
    measurements.length > 0 ? measurements[0] : undefined;

  return (
    <div className={getPageContainerClasses('detail')}>
      {/* Nav */}
      <Button variant="ghost" size="sm" onClick={() => router.push(FRONTEND_ROUTES.CABLES.LIST)}>
        <ArrowLeft className="mr-1 h-4 w-4" />
        {t('list.title')}
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={PAGE_HEADER_TOKENS.title}>{cable.managementNumber}</h1>
          <p className={PAGE_HEADER_TOKENS.subtitle}>
            {cable.connectorType || ''} {cable.length ? `${cable.length}M` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={cable.status === 'active' ? 'default' : 'secondary'}>
            {t(`status.${cable.status}` as Parameters<typeof t>[0])}
          </Badge>
          {canUpdate && (
            <>
              <Button variant="outline" size="sm" onClick={openEditDialog}>
                <Edit2 className="mr-1 h-4 w-4" />
                {t('detail.editButton')}
              </Button>
              <Button size="sm" onClick={() => setIsMeasurementOpen(true)}>
                {t('measurement.addButton')}
              </Button>
            </>
          )}
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

      {/* Measurements History */}
      <Card>
        <CardHeader>
          <CardTitle>{t('detail.measurementsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {measurements.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('detail.noMeasurements')}
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('detail.measurementColumns.date')}</TableHead>
                    <TableHead>{t('detail.measurementColumns.notes')}</TableHead>
                    <TableHead>{t('detail.measurementColumns.dataPointCount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {measurements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{fmtDate(m.measurementDate)}</TableCell>
                      <TableCell>{m.notes || '-'}</TableCell>
                      <TableCell>{m.dataPoints?.length ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Latest Measurement Data */}
      {latestMeasurement?.dataPoints && latestMeasurement.dataPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('detail.latestDataTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('measurement.frequency')}</TableHead>
                    <TableHead>{t('measurement.loss')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestMeasurement.dataPoints.map((dp) => (
                    <TableRow key={dp.id}>
                      <TableCell className="font-mono text-sm tabular-nums">
                        {dp.frequencyMhz}
                      </TableCell>
                      <TableCell className="font-mono text-sm tabular-nums">{dp.lossDb}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('form.editTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('form.lengthLabel')}</Label>
              <Input
                value={editForm.length}
                onChange={(e) => setEditForm({ ...editForm, length: e.target.value })}
                placeholder={t('form.lengthPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('form.connectorTypeLabel')}</Label>
              <Select
                value={editForm.connectorType}
                onValueChange={(v) => setEditForm({ ...editForm, connectorType: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('form.connectorTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {CABLE_CONNECTOR_TYPE_VALUES.map((ct) => (
                    <SelectItem key={ct} value={ct}>
                      {t(`connectorType.${ct}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('form.frequencyRangeMinLabel')}</Label>
                <Input
                  type="number"
                  value={editForm.frequencyRangeMin}
                  onChange={(e) => setEditForm({ ...editForm, frequencyRangeMin: e.target.value })}
                  placeholder={t('form.frequencyRangeMinPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('form.frequencyRangeMaxLabel')}</Label>
                <Input
                  type="number"
                  value={editForm.frequencyRangeMax}
                  onChange={(e) => setEditForm({ ...editForm, frequencyRangeMax: e.target.value })}
                  placeholder={t('form.frequencyRangeMaxPlaceholder')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('form.serialNumberLabel')}</Label>
              <Input
                value={editForm.serialNumber}
                onChange={(e) => setEditForm({ ...editForm, serialNumber: e.target.value })}
                placeholder={t('form.serialNumberPlaceholder')}
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

      {/* Measurement Form Dialog */}
      <MeasurementFormDialog
        cableId={id}
        open={isMeasurementOpen}
        onOpenChange={setIsMeasurementOpen}
      />
    </div>
  );
}
