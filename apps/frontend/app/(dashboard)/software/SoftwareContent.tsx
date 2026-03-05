'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslations } from 'next-intl';
import softwareApi, { SOFTWARE_TYPE_LABELS, SoftwareType } from '@/lib/api/software-api';
import { queryKeys } from '@/lib/api/query-config';
import { format } from 'date-fns';
import { Monitor, Search, Package, Layers } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function SoftwareContent() {
  const t = useTranslations('software');
  const [searchTerm, setSearchTerm] = useState('');

  // 소프트웨어 관리대장 조회
  const { data: registryData, isLoading } = useQuery({
    queryKey: queryKeys.software.registry(),
    queryFn: () => softwareApi.getSoftwareRegistry(),
  });

  const filteredRegistry =
    registryData?.registry.filter(
      (item) =>
        item.softwareName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.equipmentName?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('registry.title')}</h1>
        <p className="text-muted-foreground">{t('registry.subtitle')}</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('registry.stats.totalEquipments')}
            </CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registryData?.totalEquipments || 0}</div>
            <p className="text-xs text-muted-foreground">{t('registry.stats.equipmentsDesc')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('registry.stats.totalTypes')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registryData?.totalSoftwareTypes || 0}</div>
            <p className="text-xs text-muted-foreground">{t('registry.stats.typesDesc')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('registry.stats.lastUpdated')}</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {registryData?.generatedAt
                ? format(new Date(registryData.generatedAt), 'MM/dd HH:mm')
                : '-'}
            </div>
            <p className="text-xs text-muted-foreground">{t('registry.stats.updatedDesc')}</p>
          </CardContent>
        </Card>
      </div>

      {/* 소프트웨어별 요약 */}
      {registryData?.summary && registryData.summary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('registry.summary.title')}</CardTitle>
            <CardDescription>{t('registry.summary.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {registryData.summary.map((sw) => (
                <Card key={sw.softwareName} className="border">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{sw.softwareName}</span>
                      <Badge variant="secondary">
                        {t('registry.summary.equipmentCount', { count: sw.equipmentCount })}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('registry.summary.version', {
                        versions:
                          sw.versions.filter((v) => v).join(', ') ||
                          t('registry.summary.noVersion'),
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 상세 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('registry.table.title')}</CardTitle>
          <CardDescription>
            {t('registry.table.description', { count: filteredRegistry.length })}
          </CardDescription>
          <div className="relative w-full max-w-sm pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground mt-1" />
            <Input
              placeholder={t('registry.table.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredRegistry.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('registry.table.empty')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('registry.table.headers.equipmentName')}</TableHead>
                  <TableHead>{t('registry.table.headers.softwareName')}</TableHead>
                  <TableHead>{t('registry.table.headers.version')}</TableHead>
                  <TableHead>{t('registry.table.headers.type')}</TableHead>
                  <TableHead>{t('registry.table.headers.lastUpdated')}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistry.map((item) => (
                  <TableRow key={item.equipmentId}>
                    <TableCell className="font-medium">{item.equipmentName}</TableCell>
                    <TableCell>{item.softwareName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.softwareVersion || '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.softwareType
                        ? SOFTWARE_TYPE_LABELS[item.softwareType as SoftwareType]
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {item.lastUpdated ? format(new Date(item.lastUpdated), 'yyyy-MM-dd') : '-'}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/equipment/${item.equipmentId}/software`}
                        className="text-primary hover:underline text-sm"
                      >
                        {t('registry.table.viewHistory')}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
